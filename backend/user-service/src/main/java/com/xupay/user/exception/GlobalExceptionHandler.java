package com.xupay.user.exception;

import com.xupay.user.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * GlobalExceptionHandler
 * Centralized exception handling for all controllers.
 * Returns standardized ErrorResponse for all exceptions.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle UserNotFoundException -> 404 NOT_FOUND
     */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(
            UserNotFoundException ex, HttpServletRequest request) {
        log.warn("User not found: {}", ex.getMessage());
        
        ErrorResponse error = new ErrorResponse(
            OffsetDateTime.now(),
            HttpStatus.NOT_FOUND.value(),
            HttpStatus.NOT_FOUND.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Handle DuplicateEmailException -> 409 CONFLICT
     */
    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(
            DuplicateEmailException ex, HttpServletRequest request) {
        log.warn("Duplicate email: {}", ex.getMessage());
        
        ErrorResponse error = new ErrorResponse(
            OffsetDateTime.now(),
            HttpStatus.CONFLICT.value(),
            HttpStatus.CONFLICT.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handle DuplicatePhoneException -> 409 CONFLICT
     */
    @ExceptionHandler(DuplicatePhoneException.class)
    public ResponseEntity<ErrorResponse> handleDuplicatePhone(
            DuplicatePhoneException ex, HttpServletRequest request) {
        log.warn("Duplicate phone: {}", ex.getMessage());
        
        ErrorResponse error = new ErrorResponse(
            OffsetDateTime.now(),
            HttpStatus.CONFLICT.value(),
            HttpStatus.CONFLICT.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handle KycDocumentNotFoundException -> 404 NOT_FOUND
     */
    @ExceptionHandler(KycDocumentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleKycDocumentNotFound(
            KycDocumentNotFoundException ex, HttpServletRequest request) {
        log.warn("KYC document not found: {}", ex.getMessage());
        
        ErrorResponse error = new ErrorResponse(
            OffsetDateTime.now(),
            HttpStatus.NOT_FOUND.value(),
            HttpStatus.NOT_FOUND.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Handle InvalidCredentialsException -> 401 UNAUTHORIZED
     */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException ex, HttpServletRequest request) {
        log.warn("Invalid credentials attempt from: {}", request.getRemoteAddr());
        
        ErrorResponse error = new ErrorResponse(
            OffsetDateTime.now(),
            HttpStatus.UNAUTHORIZED.value(),
            HttpStatus.UNAUTHORIZED.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Sign-in blocked after too many failures -> 429, with Retry-After in
     * seconds and the wait in the message for people.
     */
    @ExceptionHandler(TooManyLoginAttemptsException.class)
    public ResponseEntity<ErrorResponse> handleTooManyLoginAttempts(
            TooManyLoginAttemptsException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
            .body(new ErrorResponse(
                OffsetDateTime.now(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
            ));
    }

    /**
     * Handle AccountSuspendedException -> 403 FORBIDDEN
     */
    @ExceptionHandler(AccountSuspendedException.class)
    public ResponseEntity<ErrorResponse> handleAccountSuspended(
            AccountSuspendedException ex, HttpServletRequest request) {
        log.warn("Suspended account login attempt from: {}", request.getRemoteAddr());
        
        ErrorResponse error = new ErrorResponse(
            OffsetDateTime.now(),
            HttpStatus.FORBIDDEN.value(),
            HttpStatus.FORBIDDEN.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Handle validation errors (@Valid) -> 400 BAD_REQUEST
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        String message = "Validation failed: " + errors.toString();
        log.warn("Validation errors: {}", message);
        
        ErrorResponse error = new ErrorResponse(
            OffsetDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            message,
            request.getRequestURI()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * @PreAuthorize denials (the admin-only KYC endpoints) -> 403.
     * They are thrown inside the controller call, so without this they fell
     * through to the catch-all below and a normal user got a 500.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        return error(HttpStatus.FORBIDDEN, "You do not have permission to do that", request);
    }

    /** Contact lookup miss -> 404 (was a bare RuntimeException -> 500). */
    @ExceptionHandler(ContactNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleContactNotFound(
            ContactNotFoundException ex, HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    /** Explicit business-rule rejections (e.g. adding yourself as a contact) -> 400. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /** Malformed JSON, a non-UUID path value, a missing parameter -> 400, not 500. */
    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<ErrorResponse> handleMalformedRequest(
            Exception ex, HttpServletRequest request) {
        log.warn("Malformed request to {}: {}", request.getRequestURI(), ex.getMessage());
        return error(HttpStatus.BAD_REQUEST, "Malformed request", request);
    }

    /**
     * A unique constraint lost to the request - in practice a contact that is
     * already in the list, or a concurrent duplicate signup -> 409.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity conflict on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return error(HttpStatus.CONFLICT, "That already exists", request);
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(new ErrorResponse(
            OffsetDateTime.now(),
            status.value(),
            status.getReasonPhrase(),
            message,
            request.getRequestURI()
        ));
    }

    /**
     * Handle all other exceptions -> 500 INTERNAL_SERVER_ERROR
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, HttpServletRequest request) {
        // Spring MVC's own exceptions - no such route, wrong HTTP method,
        // unsupported media type - carry their real status. Answering them
        // as a 500 "unexpected error" turned every mistyped URL into a
        // server error with a logged stack trace.
        if (ex instanceof org.springframework.web.ErrorResponse framework) {
            HttpStatus status = HttpStatus.resolve(framework.getStatusCode().value());
            if (status != null && status.is4xxClientError()) {
                log.warn("Client error {} on {}: {}", status.value(), request.getRequestURI(), ex.getMessage());
                String detail = framework.getBody().getDetail();
                return ResponseEntity.status(status)
                    .headers(framework.getHeaders())
                    .body(new ErrorResponse(
                        OffsetDateTime.now(),
                        status.value(),
                        status.getReasonPhrase(),
                        detail != null ? detail : status.getReasonPhrase(),
                        request.getRequestURI()
                    ));
            }
        }

        log.error("Unexpected error occurred", ex);
        
        ErrorResponse error = new ErrorResponse(
            OffsetDateTime.now(),
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
            "An unexpected error occurred. Please try again later.",
            request.getRequestURI()
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
