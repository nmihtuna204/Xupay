package com.xupay.payment.exception;

import com.xupay.payment.security.ForbiddenException;
import com.xupay.payment.security.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * GlobalExceptionHandler
 * Centralized exception handling for REST controllers.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("Illegal argument: {}", ex.getMessage());
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message("Invalid input parameters")
                .validationErrors(errors)
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Unauthorized", ex.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        log.warn("Forbidden: {}", ex.getMessage());
        return error(HttpStatus.FORBIDDEN, "Forbidden", ex.getMessage());
    }

    /**
     * A transfer stopped by a BLOCK fraud rule. It used to fall through to the
     * generic handler, so the user saw "An unexpected error occurred" instead
     * of being told the payment was refused. 422: the request was understood
     * and deliberately declined.
     */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponse> handleFraudBlock(SecurityException ex) {
        log.warn("Transaction declined: {}", ex.getMessage());
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "Transaction Declined", ex.getMessage());
    }

    /** Malformed JSON, a non-UUID path/query value, a missing parameter: client errors, not 500s. */
    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return error(HttpStatus.BAD_REQUEST, "Bad Request", "Malformed request");
    }

    /**
     * A unique constraint lost to a concurrent request - in practice two
     * submissions of the same idempotency key, or two wallets for one user.
     * The client should retry (and will get the stored result).
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleConflict(DataIntegrityViolationException ex) {
        log.warn("Data integrity conflict: {}", ex.getMostSpecificCause().getMessage());
        return error(HttpStatus.CONFLICT, "Conflict", "This request conflicts with one already processed. Retry it.");
    }

    /** The User Service did not answer (down or timed out): 503, retryable, nothing was charged. */
    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleServiceUnavailable(ServiceUnavailableException ex) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "Service Unavailable", ex.getMessage());
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String error, String message) {
        return ResponseEntity.status(status).body(ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .error(error)
                .message(message)
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        // Spring MVC's own exceptions - no such route, wrong HTTP method,
        // unsupported media type - carry their real status. Answering them
        // as a 500 "unexpected error" turned every mistyped URL into a
        // server error with a logged stack trace.
        if (ex instanceof org.springframework.web.ErrorResponse framework) {
            HttpStatus status = HttpStatus.resolve(framework.getStatusCode().value());
            if (status != null && status.is4xxClientError()) {
                log.warn("Client error {}: {}", status.value(), ex.getMessage());
                String detail = framework.getBody().getDetail();
                return ResponseEntity.status(status)
                        .headers(framework.getHeaders())
                        .body(ErrorResponse.builder()
                                .timestamp(Instant.now())
                                .status(status.value())
                                .error(status.getReasonPhrase())
                                .message(detail != null ? detail : status.getReasonPhrase())
                                .build());
            }
        }

        log.error("Unexpected error: ", ex);
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("An unexpected error occurred")
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
