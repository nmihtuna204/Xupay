package com.xupay.user.exception;

/**
 * TooManyLoginAttemptsException
 * Thrown when sign-in is refused because of too many recent failed attempts
 * (see LoginAttemptLimiter). Maps to HTTP 429 TOO_MANY_REQUESTS with a
 * Retry-After header.
 */
public class TooManyLoginAttemptsException extends RuntimeException {

    private final long retryAfterSeconds;

    public TooManyLoginAttemptsException(long retryAfterSeconds) {
        super("Too many failed sign-in attempts. Try again in " + minutes(retryAfterSeconds) + ".");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    private static String minutes(long seconds) {
        long minutes = Math.max(1, (seconds + 59) / 60);
        return minutes == 1 ? "1 minute" : minutes + " minutes";
    }
}
