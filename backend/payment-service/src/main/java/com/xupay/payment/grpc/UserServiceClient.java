package com.xupay.payment.grpc;

import com.xupay.payment.exception.ServiceUnavailableException;
import com.xupay.user.grpc.*;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * gRPC Client Wrapper for User Service
 * Provides high-level methods for Payment Service to call User Service
 */
@Service
@Slf4j
public class UserServiceClient {

    /**
     * Upper bound on every call. The stub had no deadline, so a hung
     * user-service hung each payment indefinitely - inside its database
     * transaction, holding a pooled connection the whole time.
     */
    private static final long DEADLINE_SECONDS = 5;

    @GrpcClient("user-service")
    private UserServiceGrpc.UserServiceBlockingStub userServiceStub;

    private UserServiceGrpc.UserServiceBlockingStub stub() {
        return userServiceStub.withDeadlineAfter(DEADLINE_SECONDS, TimeUnit.SECONDS);
    }

    /**
     * A failed call, as the REST layer should report it. The user-service's
     * answers about the request itself (no such user, malformed ID) are the
     * caller's error, so 400 via IllegalArgumentException; anything else
     * (unreachable, timed out, internal error) is 503. These all used to
     * surface as a bare RuntimeException, i.e. a 500 "unexpected error" -
     * including a transfer to a user ID that does not exist.
     */
    private RuntimeException translate(String action, StatusRuntimeException e) {
        switch (e.getStatus().getCode()) {
            case NOT_FOUND:
                return new IllegalArgumentException("User not found");
            case INVALID_ARGUMENT:
                return new IllegalArgumentException(e.getStatus().getDescription() != null
                        ? e.getStatus().getDescription()
                        : "Invalid user ID");
            default:
                log.error("gRPC call to User Service failed ({}): {}", action, e.getMessage(), e);
                return new ServiceUnavailableException(
                        "The user service is unavailable right now. Nothing was charged; try again shortly.");
        }
    }

    /**
     * Validate user for transaction (comprehensive check: KYC, limits, account status)
     *
     * @param userId           User UUID
     * @param amountCents      Transaction amount in cents
     * @param transactionType  "send" or "receive"
     * @return ValidateUserResponse with validation result
     * @throws IllegalArgumentException    if validation fails or the user does not exist
     * @throws ServiceUnavailableException if the user service cannot answer
     */
    public ValidateUserResponse validateUser(UUID userId, Long amountCents, String transactionType) {
        ValidateUserResponse response;
        try {
            log.debug("Validating user {} for {} transaction of {} cents", userId, transactionType, amountCents);

            ValidateUserRequest request = ValidateUserRequest.newBuilder()
                    .setUserId(userId.toString())
                    .setAmountCents(amountCents)
                    .setTransactionType(transactionType)
                    .build();

            response = stub().validateUser(request);
        } catch (StatusRuntimeException e) {
            throw translate("validate user", e);
        }

        if (!response.getIsValid()) {
            log.warn("User validation failed for {}: {}", userId, response.getReason());
            throw new IllegalArgumentException("User validation failed: " + response.getReason());
        }

        log.debug("User {} validated successfully", userId);
        return response;
    }

    /**
     * Get user details by ID
     *
     * @param userId User UUID
     * @return GetUserResponse with user information
     * @throws IllegalArgumentException    if the user does not exist
     * @throws ServiceUnavailableException if the user service cannot answer
     */
    public GetUserResponse getUser(UUID userId) {
        try {
            log.debug("Fetching user details for {}", userId);

            GetUserRequest request = GetUserRequest.newBuilder()
                    .setUserId(userId.toString())
                    .build();

            GetUserResponse response = stub().getUser(request);

            log.debug("User details retrieved for {}", userId);
            return response;

        } catch (StatusRuntimeException e) {
            throw translate("get user", e);
        }
    }

    /**
     * Check if transaction amount is within user's limits
     *
     * @param userId           User UUID
     * @param amountCents      Transaction amount in cents
     * @param transactionType  "send", "receive", or "withdraw"
     * @return CheckLimitResponse with limit check result
     * @throws IllegalArgumentException    if limit exceeded or the user does not exist
     * @throws ServiceUnavailableException if the user service cannot answer
     */
    public CheckLimitResponse checkTransactionLimit(UUID userId, Long amountCents, String transactionType) {
        CheckLimitResponse response;
        try {
            log.debug("Checking transaction limit for user {} (amount: {} cents)", userId, amountCents);

            CheckLimitRequest request = CheckLimitRequest.newBuilder()
                    .setUserId(userId.toString())
                    .setAmountCents(amountCents)
                    .setTransactionType(transactionType)
                    .build();

            response = stub().checkTransactionLimit(request);
        } catch (StatusRuntimeException e) {
            throw translate("check transaction limit", e);
        }

        if (!response.getAllowed()) {
            log.warn("Transaction limit exceeded for {}: {}", userId, response.getReason());
            throw new IllegalArgumentException("Transaction limit exceeded: " + response.getReason());
        }

        log.debug("Transaction limit check passed for {}", userId);
        return response;
    }

    /**
     * Get user's KYC status and tier limits
     *
     * @param userId User UUID
     * @return GetKycStatusResponse with KYC information
     * @throws IllegalArgumentException    if the user does not exist
     * @throws ServiceUnavailableException if the user service cannot answer
     */
    public GetKycStatusResponse getKycStatus(UUID userId) {
        try {
            log.debug("Fetching KYC status for {}", userId);

            GetKycStatusRequest request = GetKycStatusRequest.newBuilder()
                    .setUserId(userId.toString())
                    .build();

            GetKycStatusResponse response = stub().getKycStatus(request);

            log.debug("KYC status retrieved for {}: {}", userId, response.getKycStatus());
            return response;

        } catch (StatusRuntimeException e) {
            throw translate("get KYC status", e);
        }
    }

    /**
     * Record transaction in User Service for daily usage tracking (ASYNC)
     * This method is non-blocking - payment confirmation does not wait for this call
     *
     * @param userId             User UUID
     * @param amountCents        Transaction amount in cents
     * @param transactionType    "send" or "receive"
     * @param transactionId      Transaction UUID for idempotency
     * @param counterpartyUserId The other party of a transfer, or null for a
     *                           deposit/withdrawal; lets the User Service keep
     *                           the sender's contact stats current
     * @return CompletableFuture that completes when recording is done
     */
    public CompletableFuture<RecordTransactionResponse> recordTransactionAsync(
            UUID userId, Long amountCents, String transactionType, UUID transactionId, UUID counterpartyUserId) {

        final RecordTransactionRequest request = buildRecordRequest(
                userId, amountCents, transactionType, transactionId, counterpartyUserId);

        return CompletableFuture.supplyAsync(() -> {
            try {
                log.debug("Recording transaction {} for user {} (async)", transactionId, userId);

                RecordTransactionResponse response = stub().recordTransaction(request);

                log.debug("Transaction {} recorded successfully for user {}", transactionId, userId);
                return response;

            } catch (StatusRuntimeException e) {
                // Log error but don't fail the payment (async operation)
                log.error("Failed to record transaction {} for user {}: {}", transactionId, userId, e.getMessage());
                return RecordTransactionResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage("Recording failed: " + e.getStatus().getDescription())
                        .build();
            }
        });
    }

    /**
     * Record transaction synchronously (for blocking scenarios)
     */
    public RecordTransactionResponse recordTransaction(
            UUID userId, Long amountCents, String transactionType, UUID transactionId, UUID counterpartyUserId) {

        try {
            log.debug("Recording transaction {} for user {} (sync)", transactionId, userId);

            RecordTransactionResponse response = stub().recordTransaction(buildRecordRequest(
                    userId, amountCents, transactionType, transactionId, counterpartyUserId));

            log.debug("Transaction {} recorded successfully for user {}", transactionId, userId);
            return response;

        } catch (StatusRuntimeException e) {
            throw translate("record transaction", e);
        }
    }

    private static RecordTransactionRequest buildRecordRequest(
            UUID userId, Long amountCents, String transactionType, UUID transactionId, UUID counterpartyUserId) {
        RecordTransactionRequest.Builder builder = RecordTransactionRequest.newBuilder()
                .setUserId(userId.toString())
                .setAmountCents(amountCents)
                .setTransactionType(transactionType)
                .setTransactionId(transactionId.toString());
        if (counterpartyUserId != null) {
            builder.setCounterpartyUserId(counterpartyUserId.toString());
        }
        return builder.build();
    }
}
