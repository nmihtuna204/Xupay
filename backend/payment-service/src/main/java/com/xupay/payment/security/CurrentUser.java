package com.xupay.payment.security;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Objects;
import java.util.UUID;

/**
 * The authenticated caller of the current request, set by {@link AuthInterceptor}.
 *
 * Every ownership decision in the controllers goes through {@link #requireSelf}:
 * the user a request acts on (a body field, a path variable, the owner of a
 * wallet or transaction) must be the user the token was issued to.
 */
public final class CurrentUser {

    static final String ATTRIBUTE = "xupay.authenticatedUserId";

    private CurrentUser() {
    }

    public static UUID id(HttpServletRequest request) {
        Object value = request.getAttribute(ATTRIBUTE);
        if (value instanceof UUID userId) {
            return userId;
        }
        throw new UnauthorizedException("Not authenticated");
    }

    /** @throws ForbiddenException unless {@code userId} is the caller */
    public static void requireSelf(HttpServletRequest request, UUID userId) {
        if (!Objects.equals(id(request), userId)) {
            throw new ForbiddenException("You can only act on your own wallet");
        }
    }

    /** @throws ForbiddenException unless the caller is one of the two parties */
    public static void requireParty(HttpServletRequest request, UUID fromUserId, UUID toUserId) {
        UUID caller = id(request);
        if (!caller.equals(fromUserId) && !caller.equals(toUserId)) {
            throw new ForbiddenException("You can only view your own transactions");
        }
    }
}
