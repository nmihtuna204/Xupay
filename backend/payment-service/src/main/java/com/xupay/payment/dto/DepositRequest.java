package com.xupay.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DepositRequest
 * Request to add funds to a user's wallet (TOPUP from external source).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepositRequest {

    @NotNull(message = "Idempotency key is required")
    private UUID idempotencyKey;  // Client-generated, prevents duplicate deposits

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be greater than 0")
    private Long amountCents;  // Amount in cents

    private String description;

    // transactions.ip_address is VARCHAR(50); a longer value failed the insert
    // and came back as a 409 "retry it" that could never succeed.
    @Size(max = 50, message = "IP address must be at most 50 characters")
    private String ipAddress;

    private String userAgent;
}
