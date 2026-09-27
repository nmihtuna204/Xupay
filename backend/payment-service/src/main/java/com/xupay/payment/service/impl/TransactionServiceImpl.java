package com.xupay.payment.service.impl;

import com.xupay.payment.dto.DepositRequest;
import com.xupay.payment.dto.FraudEvaluationResult;
import com.xupay.payment.dto.TransactionDetailResponse;
import com.xupay.payment.dto.TransactionListResponse;
import com.xupay.payment.dto.TransferRequest;
import com.xupay.payment.dto.TransferResponse;
import com.xupay.payment.dto.WithdrawRequest;
import com.xupay.payment.entity.*;
import com.xupay.payment.entity.enums.EntryType;
import com.xupay.payment.entity.enums.TransactionStatus;
import com.xupay.payment.entity.enums.TransactionType;
import com.xupay.payment.grpc.UserServiceClient;
import com.xupay.payment.repository.*;
import com.xupay.payment.service.FraudDetectionService;
import com.xupay.payment.service.IdempotencyService;
import com.xupay.payment.service.TransactionService;
import com.xupay.user.grpc.ValidateUserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * TransactionServiceImpl
 * Implements double-entry bookkeeping for all financial transactions.
 * 
 * CRITICAL ACCOUNTING RULES:
 * 1. Every transaction creates balanced ledger entries (Debits = Credits)
 * 2. Wallet balances are NEVER stored, only calculated from ledger
 * 3. Ledger entries are IMMUTABLE (never updated, only reversed)
 * 4. Idempotency key prevents duplicate transactions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionServiceImpl implements TransactionService {

    /**
     * GL account 2110 "User Balances" (LIABILITY): money the platform owes to users.
     * Used as the balancing side of deposits (CREDIT) and withdrawals (DEBIT).
     */
    private static final String USER_BALANCES_GL_ACCOUNT = "2110";

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final IdempotencyCacheRepository idempotencyCacheRepository;
    private final UserServiceClient userServiceClient;
    private final FraudDetectionService fraudDetectionService;
    private final IdempotencyService idempotencyService;

    @Override
    @Transactional
    public TransferResponse processTransfer(TransferRequest request) {
        log.info("Processing transfer: idempotencyKey={}, from={}, to={}, amount={}",
                request.getIdempotencyKey(), request.getFromUserId(), request.getToUserId(), request.getAmountCents());

        // Step 1: Check idempotency using Redis cache + database fallback
        var cachedResponse = idempotencyService.getIfExists(request.getIdempotencyKey());
        if (cachedResponse.isPresent()) {
            log.info("Transaction already processed (idempotent): returning cached response");
            return replay(cachedResponse.get(), request.getFromUserId());
        }

        // Step 2: Validate users are different
        if (request.getFromUserId().equals(request.getToUserId())) {
            throw new IllegalArgumentException("Cannot transfer to same user");
        }

        // Step 3: [NEW] Evaluate fraud risk BEFORE user validation
        FraudEvaluationResult fraudResult = fraudDetectionService.evaluateTransaction(
                request,
                request.getFromUserId()
        );
        
        if (fraudResult.isShouldBlock()) {
            log.warn("Transaction BLOCKED by fraud rules: triggeredRules={}, score={}",
                    fraudResult.getTriggeredRules(), fraudResult.getTotalScore());
            throw new SecurityException("Transaction blocked due to fraud risk: " + 
                    String.join(", ", fraudResult.getTriggeredRules()));
        }
        
        if (fraudResult.isShouldFlag()) {
            log.warn("Transaction FLAGGED for review: score={}, triggeredRules={}",
                    fraudResult.getTotalScore(), fraudResult.getTriggeredRules());
        }

        // Step 4: [EXISTING] Validate sender via User Service (KYC + Limits + Account Status)
        try {
            ValidateUserResponse senderValidation = userServiceClient.validateUser(
                    request.getFromUserId(),
                    request.getAmountCents(),
                    "send"
            );
            log.info("Sender validation passed: userId={}, kycStatus={}, kycTier={}",
                    request.getFromUserId(), 
                    senderValidation.getUser().getKycStatus(), 
                    senderValidation.getUser().getKycTier());
        } catch (IllegalArgumentException e) {
            log.warn("Sender validation failed: {}", e.getMessage());
            throw new IllegalArgumentException("Sender validation failed: " + e.getMessage());
        }

        // Step 4: [NEW] Validate receiver via User Service
        try {
            ValidateUserResponse receiverValidation = userServiceClient.validateUser(
                    request.getToUserId(),
                    request.getAmountCents(),
                    "receive"
            );
            log.info("Receiver validation passed: userId={}, kycStatus={}, kycTier={}",
                    request.getToUserId(), 
                    receiverValidation.getUser().getKycStatus(), 
                    receiverValidation.getUser().getKycTier());
        } catch (IllegalArgumentException e) {
            log.warn("Receiver validation failed: {}", e.getMessage());
            throw new IllegalArgumentException("Receiver validation failed: " + e.getMessage());
        }

        // Step 5: Get wallets. The sender's row is locked for the rest of the
        // transaction (see WalletRepository#findByUserIdForUpdate); only the
        // debited side is locked, so two users paying each other cannot deadlock.
        Wallet fromWallet = walletRepository.findByUserIdForUpdate(request.getFromUserId())
                .orElseThrow(() -> new IllegalArgumentException("From wallet not found: " + request.getFromUserId()));

        // A retry with the same key may have committed while we waited for the lock.
        var committedMeanwhile = idempotencyService.getIfExists(request.getIdempotencyKey());
        if (committedMeanwhile.isPresent()) {
            return replay(committedMeanwhile.get(), request.getFromUserId());
        }

        Wallet toWallet = walletRepository.findByUserId(request.getToUserId())
                .orElseThrow(() -> new IllegalArgumentException("To wallet not found: " + request.getToUserId()));

        // Step 6: Validate wallets are active and not frozen
        validateWallet(fromWallet, "From wallet");
        validateWallet(toWallet, "To wallet");

        // Step 7: Check sufficient balance
        Long fromBalance = walletRepository.getBalance(fromWallet.getId());
        if (fromBalance == null) {
            fromBalance = 0L;
        }
        if (fromBalance < request.getAmountCents()) {
            log.warn("Insufficient balance: wallet={}, balance={}, required={}",
                    fromWallet.getId(), fromBalance, request.getAmountCents());
            // No FAILED row is written here: the exception rolls this
            // transaction back, so it would never persist - and if it did, it
            // would claim the idempotency key and make every retry of this
            // key (after a top-up) replay the failure.
            throw new IllegalArgumentException("Insufficient balance");
        }

        // Step 8: Create transaction record with fraud scoring
        Transaction transaction = createTransaction(request, fromWallet, toWallet, TransactionStatus.PROCESSING);
        
        // Apply fraud evaluation results. Rule penalties are summed and can
        // exceed 100 (e.g. 50 + 40 + 30 + 20 + 15 with no BLOCK rule hit), but
        // transactions.fraud_score is CHECKed to 0..100, so an unclamped score
        // failed the insert and turned a legitimate transfer into a 500.
        transaction.setFraudScore(Math.min(100, fraudResult.getTotalScore()));
        transaction.setIsFlagged(fraudResult.isShouldFlag());
        if (fraudResult.isShouldFlag()) {
            transaction.setFraudReason("Triggered rules: " + String.join(", ", fraudResult.getTriggeredRules()));
        }
        
        transaction = transactionRepository.save(transaction);
        log.info("Transaction created: id={}, fraudScore={}, isFlagged={}", 
                transaction.getId(), transaction.getFraudScore(), transaction.getIsFlagged());

        // Step 9: Create balanced ledger entries (Double-Entry Bookkeeping)
        try {
            createLedgerEntries(transaction, fromWallet, toWallet, request.getAmountCents());
            
            // Step 10: Mark transaction as COMPLETED
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setCompletedAt(LocalDateTime.now());
            transaction = transactionRepository.save(transaction);
            log.info("Transaction completed: {}", transaction.getId());

            // Step 11: Record in User Service once the money has actually moved
            recordTransactionInUserService(request.getFromUserId(), request.getAmountCents(), "send", transaction.getId());
            recordTransactionInUserService(request.getToUserId(), request.getAmountCents(), "receive", transaction.getId());

        } catch (Exception e) {
            log.error("Error creating ledger entries: ", e);
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new RuntimeException("Transaction failed: " + e.getMessage(), e);
        }

        // Step 12: Build response and cache it
        TransferResponse response = buildTransferResponse(transaction);
        
        // Cache response for idempotency (24-hour TTL in Redis), after commit
        cacheAfterCommit(request.getIdempotencyKey(), response);
        
        return response;
    }

    @Override
    @Transactional
    public TransferResponse processDeposit(DepositRequest request) {
        log.info("Processing deposit: idempotencyKey={}, user={}, amount={}",
                request.getIdempotencyKey(), request.getUserId(), request.getAmountCents());

        // Step 1: Check idempotency using Redis cache + database fallback
        var cachedResponse = idempotencyService.getIfExists(request.getIdempotencyKey());
        if (cachedResponse.isPresent()) {
            log.info("Deposit already processed (idempotent): returning cached response");
            return replay(cachedResponse.get(), request.getUserId());
        }

        // Step 1b: KYC status + daily receive limit via User Service (throws
        // IllegalArgumentException -> 400 with the reason). Deposits and
        // withdrawals used to skip this, so only transfers were ever limited.
        // Checked before taking the wallet lock: a row lock is never held
        // across a network call.
        userServiceClient.validateUser(request.getUserId(), request.getAmountCents(), "receive");

        // Step 2: Get wallet (locked, so a concurrent retry with the same key
        // waits here instead of racing to the idempotency_key unique index)
        Wallet wallet = walletRepository.findByUserIdForUpdate(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found for user: " + request.getUserId()));
        var committedMeanwhile = idempotencyService.getIfExists(request.getIdempotencyKey());
        if (committedMeanwhile.isPresent()) {
            return replay(committedMeanwhile.get(), request.getUserId());
        }
        validateWallet(wallet, "Wallet");

        // Step 3: Create transaction record (TOPUP: no from side, external source)
        Transaction transaction = new Transaction();
        transaction.setIdempotencyKey(request.getIdempotencyKey());
        transaction.setToWalletId(wallet.getId());
        transaction.setToUserId(request.getUserId());
        transaction.setAmountCents(request.getAmountCents());
        transaction.setCurrency("VND");
        transaction.setType(TransactionType.TOPUP);
        transaction.setStatus(TransactionStatus.PROCESSING);
        transaction.setDescription(request.getDescription());
        transaction.setIpAddress(request.getIpAddress());
        transaction.setUserAgent(request.getUserAgent());
        transaction.setFraudScore(0);
        transaction.setIsFlagged(false);
        transaction.setIsReversed(false);
        transaction = transactionRepository.save(transaction);
        log.info("Deposit transaction created: id={}", transaction.getId());

        // Step 4: Create balanced ledger entries
        // DEBIT user wallet (asset account, balance increases)
        // CREDIT "User Balances" liability (money owed to users increases)
        try {
            LedgerEntry walletEntry = new LedgerEntry();
            walletEntry.setTransactionId(transaction.getId());
            walletEntry.setGlAccountCode(wallet.getGlAccountCode());
            walletEntry.setWalletId(wallet.getId());
            walletEntry.setEntryType(EntryType.DEBIT);
            walletEntry.setAmountCents(request.getAmountCents());
            walletEntry.setDescription("Deposit to user " + request.getUserId());
            walletEntry.setIsReversed(false);
            ledgerEntryRepository.save(walletEntry);

            LedgerEntry liabilityEntry = new LedgerEntry();
            liabilityEntry.setTransactionId(transaction.getId());
            liabilityEntry.setGlAccountCode(USER_BALANCES_GL_ACCOUNT);
            liabilityEntry.setWalletId(null); // System account, no wallet
            liabilityEntry.setEntryType(EntryType.CREDIT);
            liabilityEntry.setAmountCents(request.getAmountCents());
            liabilityEntry.setDescription("User balances liability for deposit " + transaction.getId());
            liabilityEntry.setIsReversed(false);
            ledgerEntryRepository.save(liabilityEntry);

            // Step 5: Mark transaction as COMPLETED
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setCompletedAt(LocalDateTime.now());
            transaction = transactionRepository.save(transaction);
            log.info("Deposit completed: {}", transaction.getId());

            // Step 6: Record in User Service asynchronously (daily usage tracking)
            recordTransactionInUserService(request.getUserId(), request.getAmountCents(), "receive", transaction.getId());

        } catch (Exception e) {
            log.error("Error creating deposit ledger entries: ", e);
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new RuntimeException("Deposit failed: " + e.getMessage(), e);
        }

        // Step 7: Build response and cache it for idempotency (after commit)
        TransferResponse response = buildTransferResponse(transaction);
        cacheAfterCommit(request.getIdempotencyKey(), response);
        return response;
    }

    @Override
    @Transactional
    public TransferResponse processWithdraw(WithdrawRequest request) {
        log.info("Processing withdrawal: idempotencyKey={}, user={}, amount={}",
                request.getIdempotencyKey(), request.getUserId(), request.getAmountCents());

        // Step 1: Check idempotency using Redis cache + database fallback
        var cachedResponse = idempotencyService.getIfExists(request.getIdempotencyKey());
        if (cachedResponse.isPresent()) {
            log.info("Withdrawal already processed (idempotent): returning cached response");
            return replay(cachedResponse.get(), request.getUserId());
        }

        // Step 1b: KYC status + daily send limit via User Service, before the
        // wallet lock (see processDeposit).
        userServiceClient.validateUser(request.getUserId(), request.getAmountCents(), "send");

        // Step 2: Get wallet, locked until commit: the balance check below is
        // only meaningful if no other debit can land between it and our entries.
        Wallet wallet = walletRepository.findByUserIdForUpdate(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found for user: " + request.getUserId()));
        var committedMeanwhile = idempotencyService.getIfExists(request.getIdempotencyKey());
        if (committedMeanwhile.isPresent()) {
            return replay(committedMeanwhile.get(), request.getUserId());
        }
        validateWallet(wallet, "Wallet");

        // Step 3: Check sufficient balance
        Long balance = walletRepository.getBalance(wallet.getId());
        if (balance == null) {
            balance = 0L;
        }
        if (balance < request.getAmountCents()) {
            log.warn("Insufficient balance for withdrawal: wallet={}, balance={}, required={}",
                    wallet.getId(), balance, request.getAmountCents());
            throw new IllegalArgumentException("Insufficient balance");
        }

        // Step 4: Create transaction record (WITHDRAW: no to side, external destination)
        Transaction transaction = new Transaction();
        transaction.setIdempotencyKey(request.getIdempotencyKey());
        transaction.setFromWalletId(wallet.getId());
        transaction.setFromUserId(request.getUserId());
        transaction.setAmountCents(request.getAmountCents());
        transaction.setCurrency("VND");
        transaction.setType(TransactionType.WITHDRAW);
        transaction.setStatus(TransactionStatus.PROCESSING);
        transaction.setDescription(request.getDescription());
        transaction.setIpAddress(request.getIpAddress());
        transaction.setUserAgent(request.getUserAgent());
        transaction.setFraudScore(0);
        transaction.setIsFlagged(false);
        transaction.setIsReversed(false);
        transaction = transactionRepository.save(transaction);
        log.info("Withdrawal transaction created: id={}", transaction.getId());

        // Step 5: Create balanced ledger entries
        // CREDIT user wallet (asset account, balance decreases)
        // DEBIT "User Balances" liability (money owed to users decreases)
        try {
            LedgerEntry walletEntry = new LedgerEntry();
            walletEntry.setTransactionId(transaction.getId());
            walletEntry.setGlAccountCode(wallet.getGlAccountCode());
            walletEntry.setWalletId(wallet.getId());
            walletEntry.setEntryType(EntryType.CREDIT);
            walletEntry.setAmountCents(request.getAmountCents());
            walletEntry.setDescription("Withdrawal by user " + request.getUserId());
            walletEntry.setIsReversed(false);
            ledgerEntryRepository.save(walletEntry);

            LedgerEntry liabilityEntry = new LedgerEntry();
            liabilityEntry.setTransactionId(transaction.getId());
            liabilityEntry.setGlAccountCode(USER_BALANCES_GL_ACCOUNT);
            liabilityEntry.setWalletId(null); // System account, no wallet
            liabilityEntry.setEntryType(EntryType.DEBIT);
            liabilityEntry.setAmountCents(request.getAmountCents());
            liabilityEntry.setDescription("User balances liability for withdrawal " + transaction.getId());
            liabilityEntry.setIsReversed(false);
            ledgerEntryRepository.save(liabilityEntry);

            // Step 6: Mark transaction as COMPLETED
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setCompletedAt(LocalDateTime.now());
            transaction = transactionRepository.save(transaction);
            log.info("Withdrawal completed: {}", transaction.getId());

            // Step 7: Record in User Service asynchronously (daily usage tracking)
            recordTransactionInUserService(request.getUserId(), request.getAmountCents(), "send", transaction.getId());

        } catch (Exception e) {
            log.error("Error creating withdrawal ledger entries: ", e);
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new RuntimeException("Withdrawal failed: " + e.getMessage(), e);
        }

        // Step 8: Build response and cache it for idempotency (after commit)
        TransferResponse response = buildTransferResponse(transaction);
        cacheAfterCommit(request.getIdempotencyKey(), response);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDetailResponse getTransactionDetail(UUID transactionId) {
        log.info("Getting transaction detail: {}", transactionId);

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

        List<LedgerEntry> ledgerEntries = ledgerEntryRepository.findByTransactionId(transactionId);

        List<TransactionDetailResponse.LedgerEntryDetail> entryDetails = ledgerEntries.stream()
                .map(entry -> TransactionDetailResponse.LedgerEntryDetail.builder()
                        .entryId(entry.getId())
                        .glAccountCode(entry.getGlAccountCode())
                        .walletId(entry.getWalletId())
                        .entryType(entry.getEntryType().name())
                        .amountCents(entry.getAmountCents())
                        .description(entry.getDescription())
                        .createdAt(entry.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return TransactionDetailResponse.builder()
                .transactionId(transaction.getId())
                .type(transaction.getType().name())
                .status(transaction.getStatus().name())
                .amountCents(transaction.getAmountCents())
                .currency(transaction.getCurrency())
                .description(transaction.getDescription())
                .fromUserId(transaction.getFromUserId())
                .toUserId(transaction.getToUserId())
                .fromWalletId(transaction.getFromWalletId())
                .toWalletId(transaction.getToWalletId())
                .createdAt(transaction.getCreatedAt())
                .completedAt(transaction.getCompletedAt())
                .ledgerEntries(entryDetails)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TransferResponse getTransactionByIdempotencyKey(UUID idempotencyKey) {
        log.info("Getting transaction by idempotency key: {}", idempotencyKey);

        return transactionRepository.findByIdempotencyKey(idempotencyKey)
                .map(this::buildTransferResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionListResponse listTransactions(UUID userId, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);
        log.info("Listing transactions: userId={}, page={}, size={}", userId, safePage, safeSize);

        Page<Transaction> result = (userId != null)
                ? transactionRepository.findByFromUserIdOrToUserIdOrderByCreatedAtDesc(
                        userId, userId, PageRequest.of(safePage, safeSize))
                : transactionRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(safePage, safeSize));

        List<TransactionDetailResponse> items = result.getContent().stream()
                .map(tx -> TransactionDetailResponse.builder()
                        .transactionId(tx.getId())
                        .type(tx.getType().name())
                        .status(tx.getStatus().name())
                        .amountCents(tx.getAmountCents())
                        .currency(tx.getCurrency())
                        .description(tx.getDescription())
                        .fromUserId(tx.getFromUserId())
                        .toUserId(tx.getToUserId())
                        .fromWalletId(tx.getFromWalletId())
                        .toWalletId(tx.getToWalletId())
                        .createdAt(tx.getCreatedAt())
                        .completedAt(tx.getCompletedAt())
                        .build())
                .collect(Collectors.toList());

        return TransactionListResponse.builder()
                .items(items)
                .total(result.getTotalElements())
                .page(safePage)
                .size(safeSize)
                .build();
    }

    /**
     * Create balanced ledger entries using double-entry bookkeeping.
     * 
     * For P2P Transfer:
     * - From Wallet: CREDIT (decreases asset balance)
     * - To Wallet: DEBIT (increases asset balance)
     * 
     * CRITICAL: Sum(DEBIT) = Sum(CREDIT) always
     */
    private void createLedgerEntries(Transaction transaction, Wallet fromWallet, Wallet toWallet, Long amountCents) {
        log.info("Creating ledger entries: txn={}, amount={}", transaction.getId(), amountCents);

        // Entry 1: CREDIT from wallet (decrease balance)
        LedgerEntry fromEntry = new LedgerEntry();
        fromEntry.setTransactionId(transaction.getId());
        fromEntry.setGlAccountCode(fromWallet.getGlAccountCode());
        fromEntry.setWalletId(fromWallet.getId());
        fromEntry.setEntryType(EntryType.CREDIT);
        fromEntry.setAmountCents(amountCents);
        fromEntry.setDescription("Transfer to user " + toWallet.getUserId());
        fromEntry.setIsReversed(false);
        ledgerEntryRepository.save(fromEntry);

        // Entry 2: DEBIT to wallet (increase balance)
        LedgerEntry toEntry = new LedgerEntry();
        toEntry.setTransactionId(transaction.getId());
        toEntry.setGlAccountCode(toWallet.getGlAccountCode());
        toEntry.setWalletId(toWallet.getId());
        toEntry.setEntryType(EntryType.DEBIT);
        toEntry.setAmountCents(amountCents);
        toEntry.setDescription("Transfer from user " + fromWallet.getUserId());
        toEntry.setIsReversed(false);
        ledgerEntryRepository.save(toEntry);

        log.info("Ledger entries created: from={}, to={}", fromEntry.getId(), toEntry.getId());
    }

    /**
     * Create transaction record.
     */
    private Transaction createTransaction(TransferRequest request, Wallet fromWallet, Wallet toWallet, TransactionStatus status) {
        Transaction transaction = new Transaction();
        transaction.setIdempotencyKey(request.getIdempotencyKey());
        transaction.setFromWalletId(fromWallet.getId());
        transaction.setToWalletId(toWallet.getId());
        transaction.setFromUserId(request.getFromUserId());
        transaction.setToUserId(request.getToUserId());
        transaction.setAmountCents(request.getAmountCents());
        transaction.setCurrency("VND");
        transaction.setType(TransactionType.TRANSFER);
        transaction.setStatus(status);
        transaction.setDescription(request.getDescription());
        transaction.setIpAddress(request.getIpAddress());
        transaction.setUserAgent(request.getUserAgent());
        transaction.setIsFlagged(false);
        transaction.setIsReversed(false);
        return transaction;
    }

    /**
     * Validate wallet is active and not frozen.
     */
    private void validateWallet(Wallet wallet, String label) {
        if (!wallet.getIsActive()) {
            throw new IllegalArgumentException(label + " is not active");
        }
        if (wallet.getIsFrozen()) {
            throw new IllegalArgumentException(label + " is frozen: " + wallet.getFreezeReason());
        }
    }

    /**
     * Idempotent replay: the stored response for a key, but only to a party of
     * that transaction. Keys are client-generated UUIDs, so this should never
     * trip for an honest client; it stops a reused key from returning someone
     * else's transaction.
     */
    private TransferResponse replay(TransferResponse cached, UUID userId) {
        if (!userId.equals(cached.getFromUserId()) && !userId.equals(cached.getToUserId())) {
            throw new IllegalArgumentException("Idempotency key already used by another transaction");
        }
        return cached;
    }

    /**
     * Run once the surrounding transaction has committed, or now if there is
     * none. Side effects outside this database - the Redis idempotency cache,
     * the user-service usage counters - must not happen for a transaction
     * that still rolls back (the balanced-ledger trigger is DEFERRED and only
     * fires at commit). Caching before commit left Redis holding a COMPLETED
     * response for money that never moved, and every retry replayed it.
     */
    private void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    private void cacheAfterCommit(UUID idempotencyKey, TransferResponse response) {
        afterCommit(() -> idempotencyService.cache(idempotencyKey, response));
    }

    /**
     * Record transaction in User Service asynchronously (non-blocking), after
     * commit. Payment confirmation does NOT wait for this call.
     */
    private void recordTransactionInUserService(UUID userId, Long amountCents, String transactionType, UUID transactionId) {
        afterCommit(() -> recordTransactionNow(userId, amountCents, transactionType, transactionId));
    }

    private void recordTransactionNow(UUID userId, Long amountCents, String transactionType, UUID transactionId) {
        userServiceClient.recordTransactionAsync(userId, amountCents, transactionType, transactionId)
                .thenAccept(response -> {
                    if (response.getSuccess()) {
                        log.info("Transaction {} recorded in User Service for user {}", transactionId, userId);
                    } else {
                        log.warn("Failed to record transaction {} in User Service: {}", transactionId, response.getMessage());
                    }
                })
                .exceptionally(ex -> {
                    log.error("Error recording transaction {} in User Service for user {}: {}", 
                            transactionId, userId, ex.getMessage());
                    return null;
                });
    }

    /**
     * Build transfer response from transaction.
     */
    private TransferResponse buildTransferResponse(Transaction transaction) {
        BigDecimal amount = BigDecimal.valueOf(transaction.getAmountCents())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        return TransferResponse.builder()
                .transactionId(transaction.getId())
                .idempotencyKey(transaction.getIdempotencyKey())
                .fromWalletId(transaction.getFromWalletId())
                .toWalletId(transaction.getToWalletId())
                .fromUserId(transaction.getFromUserId())
                .toUserId(transaction.getToUserId())
                .amountCents(transaction.getAmountCents())
                .amount(amount)
                .currency(transaction.getCurrency())
                .type(transaction.getType())
                .status(transaction.getStatus())
                .description(transaction.getDescription())
                .isFlagged(transaction.getIsFlagged())
                .fraudScore(transaction.getFraudScore())
                .createdAt(transaction.getCreatedAt())
                .completedAt(transaction.getCompletedAt())
                .build();
    }
}
