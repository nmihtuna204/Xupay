package com.xupay.user.dto.request;

import com.xupay.user.entity.enums.DocumentType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * UploadKycDocumentRequest
 * Request DTO for uploading a KYC identity document.
 *
 * There is no object storage in the stack, so the web app sends the file
 * itself as a base64 data URL in {@code fileUrl}. The field used to be capped
 * at 500 characters, which rejected every real photo or PDF (a 50 KB image is
 * already ~68,000 characters), so KYC could not be submitted from the app at
 * all. It now fits the app's 5 MB limit, and only accepts the forms a file can
 * legitimately take - an https link or a data URL of an accepted type - so an
 * admin's "Open file" can never be pointed at javascript: or an arbitrary page.
 */
public record UploadKycDocumentRequest(

    @NotNull(message = "Document type is required")
    DocumentType documentType,

    @Size(max = 100, message = "Document number must not exceed 100 characters")
    String documentNumber,

    @Size(min = 3, max = 3, message = "Document country must be 3-character ISO code")
    String documentCountry,

    @NotBlank(message = "File URL is required")
    @Size(max = UploadKycDocumentRequest.MAX_FILE_URL_LENGTH, message = "File must be 5 MB or smaller")
    @Pattern(
        regexp = "^(https://|data:(image/jpeg|image/png|image/webp|application/pdf);base64,).*",
        flags = Pattern.Flag.DOTALL,
        message = "File must be a JPG, PNG, WEBP or PDF upload, or an https link"
    )
    String fileUrl,

    @NotBlank(message = "MIME type is required")
    @Pattern(
        regexp = "^(image/jpeg|image/png|image/webp|application/pdf)$",
        message = "Use a JPG, PNG, WEBP or PDF file"
    )
    String mimeType,

    @NotNull(message = "File size is required")
    @Positive(message = "File size must be positive")
    @Max(value = UploadKycDocumentRequest.MAX_FILE_BYTES, message = "File must be 5 MB or smaller")
    Long fileSizeBytes
) {
    /** The web app's upload limit (KycUploader.schema.ts). */
    public static final long MAX_FILE_BYTES = 5L * 1024 * 1024;

    /** A MAX_FILE_BYTES file as a base64 data URL (4/3 of the bytes) plus its "data:...;base64," prefix. */
    public static final int MAX_FILE_URL_LENGTH = 7_000_000;
}
