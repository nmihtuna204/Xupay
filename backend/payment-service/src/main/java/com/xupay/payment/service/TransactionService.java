package com.xupay.payment.service;

import com.xupay.payment.dto.DepositRequest;
import com.xupay.payment.dto.TransactionDetailResponse;
import com.xupay.payment.dto.TransactionListResponse;
import com.xupay.payment.dto.TransferRequest;
import com.xupay.payment.dto.TransferResponse;
import com.xupay.payment.dto.WithdrawRequest;

import java.util.UUID;

/**
 * TransactionService
 * Business logic for financial transactions.
 * Implements double-entry bookkeeping for all transactions.
 */
public interface TransactionService {

    /**
     * Process P2P transfer between wallets.
     * Creates balanced ledger entries: From wallet CREDIT, To wallet DEBIT.
     * Enforces idempotency using idempotency_key.
     *
     * @param request Transfer request with idempotency key
     * @return Transfer response with transaction details
     */
    TransferResponse processTransfer(TransferRequest request);

    /**
     * Process deposit (TOPUP) from an external funding source into a user's wallet.
     * Creates balanced ledger entries: User wallet DEBIT (asset up),
     * "User Balances" liability account CREDIT (money owed to users up).
     * Enforces idempotency using idempotency_key.
     *
     * @param request Deposit request with idempotency key
     * @return Transfer response with transaction details
     */
    TransferResponse processDeposit(DepositRequest request);

    /**
     * Process withdrawal from a user's wallet to an external destination.
     * Creates balanced ledger entries: User wallet CREDIT (asset down),
     * "User Balances" liability account DEBIT (money owed to users down).
     * Enforces idempotency using idempotency_key.
     *
     * @param request Withdraw request with idempotency key
     * @return Transfer response with transaction details
     */
    TransferResponse processWithdraw(WithdrawRequest request);

    /**
     * Get transaction details including all ledger entries.
     * 
     * @param transactionId Transaction ID
     * @return Transaction with ledger entries
     */
    TransactionDetailResponse getTransactionDetail(UUID transactionId);

    /**
     * Get transaction by idempotency key (for retry handling).
     *
     * @param idempotencyKey Client-provided idempotency key
     * @return Transaction response if exists, null otherwise
     */
    TransferResponse getTransactionByIdempotencyKey(UUID idempotencyKey);

    /**
     * List transaction history, newest first.
     * When userId is provided, returns transactions where the user is
     * the sender or the receiver.
     *
     * @param userId Optional user filter
     * @param page   Zero-based page index
     * @param size   Page size (1-100)
     * @return Paged transactions without ledger entries
     */
    TransactionListResponse listTransactions(UUID userId, int page, int size);
}
