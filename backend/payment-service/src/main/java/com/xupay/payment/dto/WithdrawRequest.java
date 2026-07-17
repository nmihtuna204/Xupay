package com.xupay.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * WithdrawRequest
 * Request to withdraw funds from a user's wallet to an external destination.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawRequest {

    @NotNull(message = "Idempotency key is required")
    private UUID idempotencyKey;  // Client-generated, prevents duplicate withdrawals

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be greater than 0")
    private Long amountCents;  // Amount in cents

    private String description;

    private String ipAddress;

    private String userAgent;
}
