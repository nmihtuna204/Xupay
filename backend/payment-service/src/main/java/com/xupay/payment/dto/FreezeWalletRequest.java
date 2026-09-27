package com.xupay.payment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * FreezeWalletRequest
 * Request to freeze or unfreeze a wallet.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FreezeWalletRequest {

    @NotNull(message = "freeze is required")
    private Boolean freeze;  // true to freeze, false to unfreeze

    /**
     * Optional. It was @NotBlank on every request, including UNFREEZE, while
     * the app treats it as optional and never sends one to unfreeze: a frozen
     * wallet could not be unfrozen from the UI at all.
     */
    @Size(max = 500, message = "Reason must be at most 500 characters")
    private String reason;
}
