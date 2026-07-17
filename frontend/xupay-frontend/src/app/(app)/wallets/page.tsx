'use client'

/* ============================================
   MY WALLET — fully wired to the real backend
   Create wallet → balance → deposit/withdraw →
   P2P transfer → live transaction history.
   ============================================ */

import { useState } from 'react'
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Copy, Check, Snowflake } from 'lucide-react'
import { NeoCard } from '@/components/ui/NeoCard'
import { TransferForm } from '@/components/TransferForm'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { useAuth } from '@/providers/AuthProvider'
import { useUserWallet, useCreateWallet } from '@/hooks/api/useWallets.new'
import { useDeposit, useWithdraw } from '@/hooks/api/useTransactions.new'
import { Skeleton } from '@/components/ui/skeleton'

function formatVnd(cents: number): string {
  return (cents / 100).toLocaleString('vi-VN') + ' ₫'
}

// ---------- Cash in/out form (shared by deposit & withdraw) ----------

interface CashFormProps {
  label: string
  action: 'deposit' | 'withdraw'
  userId: string
}

function CashForm({ label, action, userId }: CashFormProps) {
  const [amount, setAmount] = useState('')
  const deposit = useDeposit()
  const withdraw = useWithdraw()
  const mutation = action === 'deposit' ? deposit : withdraw

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountCents = Math.round(parseFloat(amount) * 100)
    if (!amountCents || amountCents <= 0) return
    mutation.mutate(
      { userId, amountCents, description: `${label} via web` },
      { onSuccess: () => setAmount('') }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid={`${action}-form`}>
      <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl border border-white/10 focus-within:border-emerald-500/50 transition-colors">
        <span className="text-gray-400">₫</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-transparent border-none outline-none text-white w-full font-mono"
          data-testid={`${action}-amount`}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !amount}
          className="bg-emerald-500 text-black text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
          data-testid={`${action}-submit`}
        >
          {mutation.isPending ? '...' : label}
        </button>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-400" data-testid={`${action}-error`}>
          {(mutation.error as Error)?.message || `${label} failed`}
        </p>
      )}
      {mutation.isSuccess && (
        <p className="text-xs text-emerald-400" data-testid={`${action}-success`}>
          {label} completed ✓
        </p>
      )}
    </form>
  )
}

// ---------- Page ----------

export default function WalletsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const userId = user?.id ?? ''

  const walletQuery = useUserWallet(userId)
  const createWallet = useCreateWallet()
  const [copied, setCopied] = useState(false)

  const wallet = walletQuery.data
  const hasWallet = !!wallet && !walletQuery.isError

  const copyUserId = async () => {
    await navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ----- Loading -----
  if (isAuthLoading || (userId && walletQuery.isLoading)) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500" data-testid="wallet-loading">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl max-md:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          My Wallet
        </h1>
        <p className="text-gray-400 mt-1">
          Real-time balance calculated from the double-entry ledger.
        </p>
      </div>

      {/* No wallet yet → create */}
      {!hasWallet && (
        <NeoCard className="p-8 text-center space-y-4" data-testid="create-wallet-card">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
            <WalletIcon className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">No wallet yet</h2>
          <p className="text-gray-400 text-sm">
            Create your personal wallet to start sending and receiving money.
          </p>
          <button
            onClick={() =>
              createWallet.mutate({ userId, walletType: 'PERSONAL', currency: 'VND' })
            }
            disabled={createWallet.isPending || !userId}
            className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
            data-testid="create-wallet-button"
          >
            {createWallet.isPending ? 'Creating...' : 'Create Wallet'}
          </button>
          {createWallet.isError && (
            <p className="text-xs text-red-400" data-testid="create-wallet-error">
              {(createWallet.error as Error)?.message || 'Could not create wallet'}
            </p>
          )}
        </NeoCard>
      )}

      {/* Wallet exists → balance + actions */}
      {hasWallet && (
        <>
          <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-8">
            {/* Balance card */}
            <NeoCard className="col-span-2 max-lg:col-span-1 p-8 bg-gradient-to-br from-emerald-900/20 to-black/40" data-testid="wallet-balance-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">Available balance</p>
                  <p className="text-4xl font-bold font-mono text-white mt-2" data-testid="wallet-balance">
                    {formatVnd(wallet.balanceCents)}
                  </p>
                </div>
                {wallet.isFrozen && (
                  <span className="flex items-center gap-1 text-xs text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full" data-testid="wallet-frozen-badge">
                    <Snowflake size={12} /> Frozen
                  </span>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 max-md:grid-cols-1 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Wallet ID</p>
                  <p className="font-mono text-gray-300 truncate">{wallet.walletId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Your User ID (share to receive money)</p>
                  <button
                    onClick={copyUserId}
                    className="flex items-center gap-2 font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                    data-testid="copy-user-id"
                  >
                    <span className="truncate">{userId}</span>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </NeoCard>

            {/* Cash in / out */}
            <div className="space-y-8">
              <NeoCard className="p-6">
                <h3 className="flex items-center gap-2 font-semibold text-white mb-4">
                  <ArrowDownLeft size={18} className="text-emerald-400" /> Deposit
                </h3>
                <CashForm label="Deposit" action="deposit" userId={userId} />
              </NeoCard>

              <NeoCard className="p-6">
                <h3 className="flex items-center gap-2 font-semibold text-white mb-4">
                  <ArrowUpRight size={18} className="text-gray-300" /> Withdraw
                </h3>
                <CashForm label="Withdraw" action="withdraw" userId={userId} />
              </NeoCard>
            </div>
          </div>

          <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-8">
            {/* P2P transfer */}
            <NeoCard className="p-6" data-testid="transfer-card">
              <h3 className="font-semibold text-white mb-1">Send money</h3>
              <p className="text-xs text-gray-500 mb-4">
                P2P transfer — protected by an idempotency key.
              </p>
              <div className="[&_label]:text-xs [&_label]:text-gray-500 [&_label]:uppercase [&_input]:w-full [&_input]:mt-1 [&_input]:mb-3 [&_input]:p-3 [&_input]:bg-black/40 [&_input]:rounded-xl [&_input]:border [&_input]:border-white/10 [&_input]:text-white [&_input]:font-mono [&_input]:outline-none focus-within:[&_input]:border-emerald-500/50 [&_button]:bg-emerald-500 [&_button]:text-black [&_button]:text-xs [&_button]:font-bold [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-lg [&_button]:mt-2">
                <TransferForm defaultFromUserId={userId} />
              </div>
            </NeoCard>

            {/* Live transaction history */}
            <div className="col-span-2 max-lg:col-span-1">
              <RecentTransactions userId={userId} limit={8} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
