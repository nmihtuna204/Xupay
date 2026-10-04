package com.xupay.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * TransferRequest
 * Request to transfer funds between wallets (P2P transfer).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferRequest {

    @NotNull(message = "Idempotency key is required")
    private UUID idempotencyKey;  // Client-generated, prevents duplicate charges

    @NotNull(message = "From user ID is required")
    private UUID fromUserId;

    @NotNull(message = "To user ID is required")
    private UUID toUserId;

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
