package com.xupay.payment.exception;

/** A dependency (the User Service) could not answer: HTTP 503, safe to retry. */
public class ServiceUnavailableException extends RuntimeException {
    public ServiceUnavailableException(String message) {
        super(message);
    }
}
