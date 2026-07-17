package com.xupay.payment.grpc;

/**
 * JwtContextHolder
 * Holds the caller's JWT for the duration of a request thread so it can be
 * propagated onto outgoing gRPC calls to the User Service (whose gRPC server
 * requires an Authorization header).
 *
 * The token is captured by {@link JwtForwardingFilter} on the request thread.
 * Async work (e.g. recordTransactionAsync) must capture the token on the
 * request thread and re-seed it on the worker thread — see UserServiceClient.
 */
public final class JwtContextHolder {

    private static final ThreadLocal<String> TOKEN = new ThreadLocal<>();

    private JwtContextHolder() {
    }

    /** Store the full "Bearer &lt;token&gt;" (or raw token) for this thread. */
    public static void set(String bearerToken) {
        TOKEN.set(bearerToken);
    }

    /** @return the caller's Authorization value for this thread, or null. */
    public static String get() {
        return TOKEN.get();
    }

    public static void clear() {
        TOKEN.remove();
    }
}
