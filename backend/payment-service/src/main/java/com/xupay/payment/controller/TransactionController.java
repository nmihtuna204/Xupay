package com.xupay.payment.controller;

import com.xupay.payment.dto.DepositRequest;
import com.xupay.payment.dto.TransactionDetailResponse;
import com.xupay.payment.dto.TransactionListResponse;
import com.xupay.payment.dto.TransferRequest;
import com.xupay.payment.dto.TransferResponse;
import com.xupay.payment.dto.WithdrawRequest;
import com.xupay.payment.security.CurrentUser;
import com.xupay.payment.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
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
    public ResponseEntity<TransferResponse> processTransfer(@Valid @RequestBody TransferRequest request,
                                                            HttpServletRequest http) {
        // Only the token holder can move money out of their own wallet.
        CurrentUser.requireSelf(http, request.getFromUserId());
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
    public ResponseEntity<TransferResponse> processDeposit(@Valid @RequestBody DepositRequest request,
                                                           HttpServletRequest http) {
        CurrentUser.requireSelf(http, request.getUserId());
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
    public ResponseEntity<TransferResponse> processWithdraw(@Valid @RequestBody WithdrawRequest request,
                                                            HttpServletRequest http) {
        CurrentUser.requireSelf(http, request.getUserId());
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
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest http) {
        // No userId used to mean "every user's transactions". It now means the
        // caller's own; asking for another user's history is refused.
        UUID caller = CurrentUser.id(http);
        if (userId != null) {
            CurrentUser.requireSelf(http, userId);
        }
        log.info("REST request to list transactions: userId={}, page={}, size={}", caller, page, size);
        return ResponseEntity.ok(transactionService.listTransactions(caller, page, size));
    }

    /**
     * Get transaction details with ledger entries.
     * GET /api/transactions/{transactionId}
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionDetailResponse> getTransactionDetail(@PathVariable UUID transactionId,
                                                                          HttpServletRequest http) {
        log.info("REST request to get transaction detail: {}", transactionId);
        TransactionDetailResponse response = transactionService.getTransactionDetail(transactionId);
        CurrentUser.requireParty(http, response.getFromUserId(), response.getToUserId());
        return ResponseEntity.ok(response);
    }

    /**
     * Get transaction by idempotency key (for retry handling).
     * GET /api/transactions/idempotency/{idempotencyKey}
     */
    @GetMapping("/idempotency/{idempotencyKey}")
    public ResponseEntity<TransferResponse> getTransactionByIdempotencyKey(@PathVariable UUID idempotencyKey,
                                                                           HttpServletRequest http) {
        log.info("REST request to get transaction by idempotency key: {}", idempotencyKey);
        TransferResponse response = transactionService.getTransactionByIdempotencyKey(idempotencyKey);
        
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        CurrentUser.requireParty(http, response.getFromUserId(), response.getToUserId());
        return ResponseEntity.ok(response);
    }
}
