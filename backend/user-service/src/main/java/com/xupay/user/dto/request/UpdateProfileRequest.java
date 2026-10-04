package com.xupay.user.dto.request;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Locale;

/**
 * UpdateProfileRequest
 * Request DTO for updating user profile information.
 */
public record UpdateProfileRequest(

    @Size(min = 1, max = 100, message = "First name must be between 1 and 100 characters")
    String firstName,

    @Size(min = 1, max = 100, message = "Last name must be between 1 and 100 characters")
    String lastName,

    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Phone must be in E.164 format (+1234567890)")
    String phone,

    @Past(message = "Date of birth must be in the past")
    LocalDate dateOfBirth,

    // The settings form has always sent this, but the field was missing here,
    // so the value was silently dropped and the form came back empty after
    // "Profile updated". users.nationality is ISO 3166-1 alpha-3.
    @Pattern(regexp = "^[A-Za-z]{3}$", message = "Nationality must be a 3-letter ISO code, e.g. VNM")
    String nationality
) {
    public UpdateProfileRequest {
        if (nationality != null) {
            nationality = nationality.toUpperCase(Locale.ROOT);
        }
    }
}
