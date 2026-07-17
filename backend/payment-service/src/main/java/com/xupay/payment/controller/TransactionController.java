package com.xupay.payment.controller;

import com.xupay.payment.dto.DepositRequest;
import com.xupay.payment.dto.TransactionDetailResponse;
import com.xupay.payment.dto.TransactionListResponse;
import com.xupay.payment.dto.TransferRequest;
import com.xupay.payment.dto.TransferResponse;
import com.xupay.payment.dto.WithdrawRequest;
import com.xupay.payment.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * TransactionController
 * REST endpoints for financial transactions.
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * Process P2P transfer.
     * POST /api/transactions/transfer
     */
    @PostMapping("/transfer")
    public ResponseEntity<TransferResponse> processTransfer(@Valid @RequestBody TransferRequest request) {
        log.info("REST request to process transfer: from={}, to={}, amount={}",
                request.getFromUserId(), request.getToUserId(), request.getAmountCents());
        
        TransferResponse response = transactionService.processTransfer(request);
        
        // Return 201 for new transaction, 200 for idempotent retry
        HttpStatus status = response.getStatus().name().equals("COMPLETED") 
                ? HttpStatus.CREATED 
                : HttpStatus.OK;
        
        return ResponseEntity.status(status).body(response);
    }

    /**
     * Deposit funds into a user's wallet (TOPUP from external source).
     * POST /api/payments/deposit
     */
    @PostMapping("/deposit")
    public ResponseEntity<TransferResponse> processDeposit(@Valid @RequestBody DepositRequest request) {
        log.info("REST request to process deposit: user={}, amount={}",
                request.getUserId(), request.getAmountCents());

        TransferResponse response = transactionService.processDeposit(request);

        HttpStatus status = response.getStatus().name().equals("COMPLETED")
                ? HttpStatus.CREATED
                : HttpStatus.OK;

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Withdraw funds from a user's wallet to an external destination.
     * POST /api/payments/withdraw
     */
    @PostMapping("/withdraw")
    public ResponseEntity<TransferResponse> processWithdraw(@Valid @RequestBody WithdrawRequest request) {
        log.info("REST request to process withdrawal: user={}, amount={}",
                request.getUserId(), request.getAmountCents());

        TransferResponse response = transactionService.processWithdraw(request);

        HttpStatus status = response.getStatus().name().equals("COMPLETED")
                ? HttpStatus.CREATED
                : HttpStatus.OK;

        return ResponseEntity.status(status).body(response);
    }

    /**
     * List transaction history (paged, newest first).
     * GET /api/payments?userId=&page=&size=
     */
    @GetMapping
    public ResponseEntity<TransactionListResponse> listTransactions(
            @RequestParam(required = false) UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("REST request to list transactions: userId={}, page={}, size={}", userId, page, size);
        return ResponseEntity.ok(transactionService.listTransactions(userId, page, size));
    }

    /**
     * Get transaction details with ledger entries.
     * GET /api/transactions/{transactionId}
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionDetailResponse> getTransactionDetail(@PathVariable UUID transactionId) {
        log.info("REST request to get transaction detail: {}", transactionId);
        TransactionDetailResponse response = transactionService.getTransactionDetail(transactionId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get transaction by idempotency key (for retry handling).
     * GET /api/transactions/idempotency/{idempotencyKey}
     */
    @GetMapping("/idempotency/{idempotencyKey}")
    public ResponseEntity<TransferResponse> getTransactionByIdempotencyKey(@PathVariable UUID idempotencyKey) {
        log.info("REST request to get transaction by idempotency key: {}", idempotencyKey);
        TransferResponse response = transactionService.getTransactionByIdempotencyKey(idempotencyKey);
        
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(response);
    }
}
