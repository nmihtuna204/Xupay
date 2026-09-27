package com.xupay.payment.security;

/** Authenticated, but acting on someone else's wallet or transaction: HTTP 403. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
