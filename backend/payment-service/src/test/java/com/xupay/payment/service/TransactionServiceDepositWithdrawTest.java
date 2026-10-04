package com.xupay.payment.service;

import com.xupay.payment.dto.DepositRequest;
import com.xupay.payment.dto.FraudEvaluationResult;
import com.xupay.payment.dto.TransferRequest;
import com.xupay.payment.dto.TransferResponse;
import com.xupay.payment.dto.WithdrawRequest;
import com.xupay.payment.entity.LedgerEntry;
import com.xupay.payment.entity.Transaction;
import com.xupay.payment.entity.Wallet;
import com.xupay.payment.entity.enums.EntryType;
import com.xupay.payment.entity.enums.TransactionStatus;
import com.xupay.payment.entity.enums.TransactionType;
import com.xupay.payment.grpc.UserServiceClient;
import com.xupay.payment.repository.IdempotencyCacheRepository;
import com.xupay.payment.repository.LedgerEntryRepository;
import com.xupay.payment.repository.TransactionRepository;
import com.xupay.payment.repository.WalletRepository;
import com.xupay.payment.service.impl.TransactionServiceImpl;
import com.xupay.payment.util.TestDataBuilder;
import com.xupay.user.grpc.ValidateUserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for deposit (TOPUP) and withdrawal flows.
 * Verifies double-entry bookkeeping correctness:
 * - Deposit:  DEBIT user wallet / CREDIT 2110 User Balances liability
 * - Withdraw: CREDIT user wallet / DEBIT 2110 User Balances liability
 */
@ExtendWith(MockitoExtension.class)
class TransactionServiceDepositWithdrawTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private LedgerEntryRepository ledgerEntryRepository;
    @Mock private IdempotencyCacheRepository idempotencyCacheRepository;
    @Mock private UserServiceClient userServiceClient;
    @Mock private FraudDetectionService fraudDetectionService;
    @Mock private IdempotencyService idempotencyService;

    private TransactionServiceImpl transactionService;

    private UUID userId;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        transactionService = new TransactionServiceImpl(
                transactionRepository,
                walletRepository,
                ledgerEntryRepository,
                idempotencyCacheRepository,
                userServiceClient,
                fraudDetectionService,
                idempotencyService
        );

        userId = UUID.randomUUID();
        wallet = TestDataBuilder.createTestWallet(userId, "1110");

        // Async user-service recording should never block or fail the flow
        lenient().when(userServiceClient.recordTransactionAsync(any(), any(), anyString(), any(), any()))
                .thenReturn(new CompletableFuture<>());
        // Repository saves return their argument (with an ID for transactions)
        lenient().when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> {
            Transaction t = inv.getArgument(0);
            if (t.getId() == null) {
                t.setId(UUID.randomUUID());
            }
            return t;
        });
        lenient().when(ledgerEntryRepository.save(any(LedgerEntry.class))).thenAnswer(inv -> inv.getArgument(0));
        // A flush INSERTs the row, which is when Hibernate stamps @CreationTimestamp
        lenient().when(transactionRepository.saveAndFlush(any(Transaction.class))).thenAnswer(inv -> {
            Transaction t = inv.getArgument(0);
            if (t.getId() == null) {
                t.setId(UUID.randomUUID());
            }
            if (t.getCreatedAt() == null) {
                t.setCreatedAt(java.time.LocalDateTime.now());
            }
            return t;
        });
    }

    @Test
    @DisplayName("Deposit - the response carries the transaction's creation time (was null)")
    void deposit_responseHasCreatedAt() {
        DepositRequest request = new DepositRequest(UUID.randomUUID(), userId, 50_000L, null, null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));

        TransferResponse response = transactionService.processDeposit(request);

        assertThat(response.getCreatedAt()).isNotNull();
        verify(transactionRepository).saveAndFlush(any(Transaction.class));
    }

    // =========================================================
    // DEPOSIT
    // =========================================================

    @Test
    @DisplayName("Deposit - creates balanced ledger entries (DEBIT wallet, CREDIT 2110)")
    void deposit_createsBalancedLedgerEntries() {
        DepositRequest request = new DepositRequest(UUID.randomUUID(), userId, 50_000L, "Top-up", null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));

        TransferResponse response = transactionService.processDeposit(request);

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(response.getType()).isEqualTo(TransactionType.TOPUP);
        assertThat(response.getAmountCents()).isEqualTo(50_000L);
        assertThat(response.getToWalletId()).isEqualTo(wallet.getId());
        assertThat(response.getFromWalletId()).isNull();

        ArgumentCaptor<LedgerEntry> entryCaptor = ArgumentCaptor.forClass(LedgerEntry.class);
        verify(ledgerEntryRepository, org.mockito.Mockito.times(2)).save(entryCaptor.capture());
        List<LedgerEntry> entries = entryCaptor.getAllValues();

        LedgerEntry walletEntry = entries.stream()
                .filter(e -> wallet.getId().equals(e.getWalletId())).findFirst().orElseThrow();
        LedgerEntry liabilityEntry = entries.stream()
                .filter(e -> e.getWalletId() == null).findFirst().orElseThrow();

        assertThat(walletEntry.getEntryType()).isEqualTo(EntryType.DEBIT);
        assertThat(walletEntry.getGlAccountCode()).isEqualTo("1110");
        assertThat(walletEntry.getAmountCents()).isEqualTo(50_000L);

        assertThat(liabilityEntry.getEntryType()).isEqualTo(EntryType.CREDIT);
        assertThat(liabilityEntry.getGlAccountCode()).isEqualTo("2110");
        assertThat(liabilityEntry.getAmountCents()).isEqualTo(50_000L);

        // Response cached for idempotent retries
        verify(idempotencyService).cache(request.getIdempotencyKey(), response);
    }

    @Test
    @DisplayName("Deposit - returns cached response on idempotent retry")
    void deposit_returnsCachedResponse_onRetry() {
        UUID idempotencyKey = UUID.randomUUID();
        TransferResponse cached = TransferResponse.builder()
                .transactionId(UUID.randomUUID())
                .idempotencyKey(idempotencyKey)
                .toUserId(userId)
                .type(TransactionType.TOPUP)
                .status(TransactionStatus.COMPLETED)
                .build();
        when(idempotencyService.getIfExists(idempotencyKey)).thenReturn(Optional.of(cached));

        DepositRequest request = new DepositRequest(idempotencyKey, userId, 50_000L, null, null, null);
        TransferResponse response = transactionService.processDeposit(request);

        assertThat(response).isSameAs(cached);
        verify(transactionRepository, never()).save(any());
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deposit - fails when wallet is frozen")
    void deposit_fails_whenWalletFrozen() {
        wallet.setIsFrozen(true);
        wallet.setFreezeReason("Fraud investigation");
        DepositRequest request = new DepositRequest(UUID.randomUUID(), userId, 50_000L, null, null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));

        assertThatThrownBy(() -> transactionService.processDeposit(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("frozen");

        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deposit - fails when wallet not found")
    void deposit_fails_whenWalletNotFound() {
        DepositRequest request = new DepositRequest(UUID.randomUUID(), userId, 50_000L, null, null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.processDeposit(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Wallet not found");
    }

    // =========================================================
    // WITHDRAW
    // =========================================================

    @Test
    @DisplayName("Withdraw - creates balanced ledger entries (CREDIT wallet, DEBIT 2110)")
    void withdraw_createsBalancedLedgerEntries() {
        WithdrawRequest request = new WithdrawRequest(UUID.randomUUID(), userId, 30_000L, "Cash out", null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.getBalance(wallet.getId())).thenReturn(100_000L);

        TransferResponse response = transactionService.processWithdraw(request);

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(response.getType()).isEqualTo(TransactionType.WITHDRAW);
        assertThat(response.getFromWalletId()).isEqualTo(wallet.getId());
        assertThat(response.getToWalletId()).isNull();

        ArgumentCaptor<LedgerEntry> entryCaptor = ArgumentCaptor.forClass(LedgerEntry.class);
        verify(ledgerEntryRepository, org.mockito.Mockito.times(2)).save(entryCaptor.capture());
        List<LedgerEntry> entries = entryCaptor.getAllValues();

        LedgerEntry walletEntry = entries.stream()
                .filter(e -> wallet.getId().equals(e.getWalletId())).findFirst().orElseThrow();
        LedgerEntry liabilityEntry = entries.stream()
                .filter(e -> e.getWalletId() == null).findFirst().orElseThrow();

        assertThat(walletEntry.getEntryType()).isEqualTo(EntryType.CREDIT);
        assertThat(liabilityEntry.getEntryType()).isEqualTo(EntryType.DEBIT);
        assertThat(liabilityEntry.getGlAccountCode()).isEqualTo("2110");

        verify(idempotencyService).cache(request.getIdempotencyKey(), response);
    }

    @Test
    @DisplayName("Withdraw - fails on insufficient balance")
    void withdraw_fails_onInsufficientBalance() {
        WithdrawRequest request = new WithdrawRequest(UUID.randomUUID(), userId, 200_000L, null, null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.getBalance(wallet.getId())).thenReturn(100_000L);

        assertThatThrownBy(() -> transactionService.processWithdraw(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient balance");

        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Withdraw - treats null balance as zero")
    void withdraw_fails_whenBalanceNull() {
        WithdrawRequest request = new WithdrawRequest(UUID.randomUUID(), userId, 1_000L, null, null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.getBalance(wallet.getId())).thenReturn(null);

        assertThatThrownBy(() -> transactionService.processWithdraw(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient balance");
    }

    @Test
    @DisplayName("Withdraw - returns cached response on idempotent retry")
    void withdraw_returnsCachedResponse_onRetry() {
        UUID idempotencyKey = UUID.randomUUID();
        TransferResponse cached = TransferResponse.builder()
                .transactionId(UUID.randomUUID())
                .idempotencyKey(idempotencyKey)
                .fromUserId(userId)
                .type(TransactionType.WITHDRAW)
                .status(TransactionStatus.COMPLETED)
                .build();
        when(idempotencyService.getIfExists(idempotencyKey)).thenReturn(Optional.of(cached));

        WithdrawRequest request = new WithdrawRequest(idempotencyKey, userId, 1_000L, null, null, null);
        TransferResponse response = transactionService.processWithdraw(request);

        assertThat(response).isSameAs(cached);
        verify(transactionRepository, never()).save(any());
    }

    // =========================================================
    // CONCURRENCY + IDEMPOTENCY GUARDS
    // =========================================================

    @Test
    @DisplayName("Withdraw - over the KYC daily send limit is refused before any lock or ledger write")
    void withdraw_refused_whenOverLimit() {
        WithdrawRequest request = new WithdrawRequest(UUID.randomUUID(), userId, 5_000_000_00L, null, null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(userServiceClient.validateUser(userId, 5_000_000_00L, "send"))
                .thenThrow(new IllegalArgumentException("User validation failed: Would exceed the daily send limit"));

        assertThatThrownBy(() -> transactionService.processWithdraw(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("daily send limit");
        verify(walletRepository, never()).findByUserIdForUpdate(any());
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deposit - checked against the daily receive limit")
    void deposit_validatesReceiveLimit() {
        DepositRequest request = new DepositRequest(UUID.randomUUID(), userId, 50_000L, null, null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));

        transactionService.processDeposit(request);

        verify(userServiceClient).validateUser(userId, 50_000L, "receive");
    }

    @Test
    @DisplayName("Withdraw - takes the wallet row lock before checking the balance")
    void withdraw_locksWalletBeforeBalanceCheck() {
        WithdrawRequest request = new WithdrawRequest(UUID.randomUUID(), userId, 1_000L, null, null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.getBalance(wallet.getId())).thenReturn(100_000L);

        transactionService.processWithdraw(request);

        org.mockito.InOrder order = org.mockito.Mockito.inOrder(walletRepository);
        order.verify(walletRepository).findByUserIdForUpdate(userId);
        order.verify(walletRepository).getBalance(wallet.getId());
        verify(walletRepository, never()).findByUserId(any());
    }

    @Test
    @DisplayName("Withdraw - a retry that committed while waiting for the lock is replayed, not re-applied")
    void withdraw_replaysResult_committedWhileWaitingForLock() {
        UUID idempotencyKey = UUID.randomUUID();
        TransferResponse committed = TransferResponse.builder()
                .transactionId(UUID.randomUUID())
                .idempotencyKey(idempotencyKey)
                .fromUserId(userId)
                .type(TransactionType.WITHDRAW)
                .status(TransactionStatus.COMPLETED)
                .build();
        // First look: nothing yet. Second look (after the lock): the twin request's result.
        when(idempotencyService.getIfExists(idempotencyKey))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(committed));
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));

        TransferResponse response = transactionService.processWithdraw(
                new WithdrawRequest(idempotencyKey, userId, 1_000L, null, null, null));

        assertThat(response).isSameAs(committed);
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deposit - a key already used for someone else's transaction is refused")
    void deposit_rejectsIdempotencyKeyOfAnotherUser() {
        UUID idempotencyKey = UUID.randomUUID();
        TransferResponse strangers = TransferResponse.builder()
                .transactionId(UUID.randomUUID())
                .idempotencyKey(idempotencyKey)
                .toUserId(UUID.randomUUID())
                .status(TransactionStatus.COMPLETED)
                .build();
        when(idempotencyService.getIfExists(idempotencyKey)).thenReturn(Optional.of(strangers));

        assertThatThrownBy(() -> transactionService.processDeposit(
                new DepositRequest(idempotencyKey, userId, 50_000L, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Idempotency key already used");
    }

    @Test
    @DisplayName("Withdraw - a key already used for a deposit is refused, not reported as a withdrawal")
    void withdraw_rejectsIdempotencyKeyOfADeposit() {
        UUID idempotencyKey = UUID.randomUUID();
        TransferResponse deposit = TransferResponse.builder()
                .transactionId(UUID.randomUUID())
                .idempotencyKey(idempotencyKey)
                .toUserId(userId)
                .type(TransactionType.TOPUP)
                .status(TransactionStatus.COMPLETED)
                .build();
        when(idempotencyService.getIfExists(idempotencyKey)).thenReturn(Optional.of(deposit));

        assertThatThrownBy(() -> transactionService.processWithdraw(
                new WithdrawRequest(idempotencyKey, userId, 1_000L, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Idempotency key already used");
        verify(ledgerEntryRepository, never()).save(any());
    }

    // =========================================================
    // TRANSFER
    // =========================================================

    private UUID recipientId;
    private Wallet recipientWallet;

    private TransferRequest transferOf(long amountCents) {
        recipientId = UUID.randomUUID();
        recipientWallet = TestDataBuilder.createTestWallet(recipientId, "1110");
        TransferRequest request = new TransferRequest(UUID.randomUUID(), userId, recipientId, amountCents, null, null, null);
        when(idempotencyService.getIfExists(request.getIdempotencyKey())).thenReturn(Optional.empty());
        when(fraudDetectionService.evaluateTransaction(any(), any()))
                .thenReturn(FraudEvaluationResult.builder().triggeredRules(List.of()).build());
        when(userServiceClient.validateUser(any(), any(), anyString()))
                .thenReturn(ValidateUserResponse.getDefaultInstance());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.findByUserId(recipientId)).thenReturn(Optional.of(recipientWallet));
        return request;
    }

    @Test
    @DisplayName("Transfer - a frozen recipient is refused without revealing their freeze reason")
    void transfer_frozenRecipient_doesNotLeakFreezeReason() {
        TransferRequest request = transferOf(1_000L);
        recipientWallet.setIsFrozen(true);
        recipientWallet.setFreezeReason("Private: lost my phone at the airport");

        assertThatThrownBy(() -> transactionService.processTransfer(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("can't receive")
                .hasMessageNotContaining("airport");
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Transfer - usage is recorded with the counterparty of each side")
    void transfer_recordsUsageWithCounterparty() {
        TransferRequest request = transferOf(1_000L);
        when(walletRepository.getBalance(wallet.getId())).thenReturn(100_000L);

        TransferResponse response = transactionService.processTransfer(request);

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(userServiceClient).recordTransactionAsync(userId, 1_000L, "send", response.getTransactionId(), recipientId);
        verify(userServiceClient).recordTransactionAsync(recipientId, 1_000L, "receive", response.getTransactionId(), userId);
    }

    @Test
    @DisplayName("Transfer - deposits and withdrawals record usage without a counterparty")
    void depositAndWithdraw_recordUsageWithoutCounterparty() {
        DepositRequest deposit = new DepositRequest(UUID.randomUUID(), userId, 50_000L, null, null, null);
        when(idempotencyService.getIfExists(deposit.getIdempotencyKey())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));

        TransferResponse response = transactionService.processDeposit(deposit);

        verify(userServiceClient).recordTransactionAsync(userId, 50_000L, "receive", response.getTransactionId(), null);
    }
}
