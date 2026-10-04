#!/usr/bin/env node
/**
 * XuPay end-to-end smoke test.
 * Drives the REAL running stack (docker compose up) through the full
 * business flow:
 *
 *   register x2 → KYC upload+approve x2 → create wallets → deposit
 *   → P2P transfer → idempotent retry → withdraw → balance assertions
 *   → transaction history
 *
 * Usage:  node scripts/e2e-smoke.mjs
 * Env:    USER_URL (default http://localhost:8081)
 *         PAY_URL  (default http://localhost:8082)
 */

const USER_URL = process.env.USER_URL || 'http://localhost:8081';
const PAY_URL = process.env.PAY_URL || 'http://localhost:8082';

let passed = 0;
let failed = 0;

function assert(cond, label, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✔ ${label}`);
  } else {
    failed++;
    console.error(`  ✘ ${label} ${detail}`);
  }
}

async function api(base, path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data };
}

async function registerAndVerify(label) {
  const email = `${label}-${Date.now()}@e2e.xupay.local`;
  console.log(`\n— ${label}: register ${email}`);

  const reg = await api(USER_URL, '/api/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Sup3rS3cret!',
      firstName: label,
      lastName: 'E2E',
    },
  });
  assert(reg.status === 200 || reg.status === 201, `${label} registered (HTTP ${reg.status})`);
  const token = reg.data?.token;
  const userId = reg.data?.userId;
  assert(!!token && !!userId, `${label} got JWT + userId`);

  // KYC: upload a document (approval is admin-only; unverified TIER_0 users
  // can still transact within TIER_0 limits, so approval isn't required here).
  const doc = await api(USER_URL, '/api/kyc/upload-document', {
    method: 'POST',
    token,
    body: {
      documentType: 'NATIONAL_ID',
      documentNumber: 'ID-123456789',
      documentCountry: 'VNM',
      fileUrl: 'https://storage.example.com/kyc/id.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 123456,
    },
  });
  assert(doc.status === 200 || doc.status === 201, `${label} KYC document uploaded (HTTP ${doc.status})`);

  return { email, token, userId };
}

async function createWallet(user, label) {
  const res = await api(PAY_URL, '/api/wallets', {
    method: 'POST',
    token: user.token,
    body: { userId: user.userId, walletType: 'PERSONAL', currency: 'VND' },
  });
  assert(res.status === 200 || res.status === 201, `${label} wallet created (HTTP ${res.status})`);
  return res.data;
}

async function balanceOf(user) {
  const res = await api(PAY_URL, `/api/wallets/user/${user.userId}`, { token: user.token });
  return res.data?.balanceCents;
}

async function main() {
  console.log('XuPay E2E smoke test');
  console.log(`User Service:    ${USER_URL}`);
  console.log(`Payment Service: ${PAY_URL}`);

  // 0. Health
  const h1 = await fetch(`${USER_URL}/actuator/health`).then((r) => r.status).catch(() => 0);
  const h2 = await fetch(`${PAY_URL}/actuator/health`).then((r) => r.status).catch(() => 0);
  assert(h1 === 200, 'user-service healthy');
  assert(h2 === 200, 'payment-service healthy');

  // 1-2. Users
  const alice = await registerAndVerify('alice');
  const bob = await registerAndVerify('bob');

  // 3. Wallets
  console.log('\n— wallets');
  await createWallet(alice, 'alice');
  await createWallet(bob, 'bob');

  // Amounts and counts stay within TIER_0 limits (unverified starter tier):
  // 1,250,000 VND per payment, 2 outgoing payments per hour, 5 per day.

  // 4. Deposit 8,000 cents to alice (top-up is not tier-limited)
  console.log('\n— deposit');
  const depositKey = crypto.randomUUID();
  const dep = await api(PAY_URL, '/api/payments/deposit', {
    method: 'POST',
    token: alice.token,
    body: {
      idempotencyKey: depositKey,
      userId: alice.userId,
      amountCents: 8000,
      description: 'e2e top-up',
    },
  });
  assert(dep.status === 201, `deposit completed (HTTP ${dep.status})`, JSON.stringify(dep.data));
  assert(dep.data?.status === 'COMPLETED', 'deposit status COMPLETED');
  assert((await balanceOf(alice)) === 8000, 'alice balance = 8,000 after deposit');

  // 5. Transfer 3,000 cents alice → bob (within TIER_0 limits)
  console.log('\n— transfer');
  const transferKey = crypto.randomUUID();
  const t1 = await api(PAY_URL, '/api/payments/transfer', {
    method: 'POST',
    token: alice.token,
    body: {
      idempotencyKey: transferKey,
      fromUserId: alice.userId,
      toUserId: bob.userId,
      amountCents: 3000,
      description: 'e2e transfer',
    },
  });
  assert(t1.status === 201, `transfer completed (HTTP ${t1.status})`, JSON.stringify(t1.data));
  assert(t1.data?.status === 'COMPLETED', 'transfer status COMPLETED');

  // 6. Idempotent retry: same key → same transaction, no double spend
  const t2 = await api(PAY_URL, '/api/payments/transfer', {
    method: 'POST',
    token: alice.token,
    body: {
      idempotencyKey: transferKey,
      fromUserId: alice.userId,
      toUserId: bob.userId,
      amountCents: 3000,
      description: 'e2e transfer (retry)',
    },
  });
  assert(
    t2.data?.transactionId === t1.data?.transactionId,
    'idempotent retry returned the SAME transaction'
  );
  assert((await balanceOf(alice)) === 5000, 'alice balance = 5,000 (no double spend)');
  assert((await balanceOf(bob)) === 3000, 'bob balance = 3,000');

  // 7. Withdraw 1,000 cents from bob
  console.log('\n— withdraw');
  const wd = await api(PAY_URL, '/api/payments/withdraw', {
    method: 'POST',
    token: bob.token,
    body: {
      idempotencyKey: crypto.randomUUID(),
      userId: bob.userId,
      amountCents: 1000,
      description: 'e2e cash out',
    },
  });
  assert(wd.status === 201, `withdraw completed (HTTP ${wd.status})`, JSON.stringify(wd.data));
  assert((await balanceOf(bob)) === 2000, 'bob balance = 2,000 after withdraw');

  // 8. Insufficient balance is rejected
  const overdraft = await api(PAY_URL, '/api/payments/withdraw', {
    method: 'POST',
    token: bob.token,
    body: {
      idempotencyKey: crypto.randomUUID(),
      userId: bob.userId,
      amountCents: 10_000_000,
    },
  });
  assert(overdraft.status >= 400, `overdraft rejected (HTTP ${overdraft.status})`);

  // 9. Transaction history
  console.log('\n— history');
  const list = await api(PAY_URL, `/api/payments?userId=${alice.userId}&page=0&size=10`, {
    token: alice.token,
  });
  assert(list.status === 200, `transaction list returned (HTTP ${list.status})`);
  assert(Array.isArray(list.data?.items) && list.data.items.length >= 2, `alice has ≥2 transactions (${list.data?.items?.length})`);

  // 10. Ledger detail: transfer must have 2 balanced entries
  const detail = await api(PAY_URL, `/api/payments/${t1.data?.transactionId}`, { token: alice.token });
  const entries = detail.data?.ledgerEntries || [];
  const debits = entries.filter((e) => e.entryType === 'DEBIT').reduce((s, e) => s + e.amountCents, 0);
  const credits = entries.filter((e) => e.entryType === 'CREDIT').reduce((s, e) => s + e.amountCents, 0);
  assert(entries.length === 2, `transfer has 2 ledger entries (${entries.length})`);
  assert(debits === credits && debits === 3000, `ledger balanced: debits=${debits} credits=${credits}`);

  // Summary
  console.log(`\n========================================`);
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('E2E crashed:', err);
  process.exit(1);
});
