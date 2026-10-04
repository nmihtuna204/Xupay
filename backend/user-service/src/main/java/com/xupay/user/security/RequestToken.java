package com.xupay.user.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;

import java.util.Optional;
import java.util.Set;

/**
 * RequestToken
 * The access token a request carries, and where it came from.
 *
 * The web app's token is an HttpOnly cookie, which page scripts (injected
 * ones included) cannot read. Scripts, Postman and other API clients send
 * "Authorization: Bearer"; when a request has both, the header wins.
 *
 * The browser attaches the cookie to every request to this host, including
 * ones made by a page on another origin of the same site: SameSite=Strict
 * only stops other sites. So on a state-changing request the cookie counts
 * only alongside an X-Requested-With header. A page on an origin this API's
 * CORS policy does not allow cannot add that header (it forces a preflight,
 * which is refused); the web app sends it on every request.
 */
public record RequestToken(String value, boolean fromCookie) {

    /** Name of the HttpOnly sign-in cookie. payment-service reads the same cookie. */
    public static final String COOKIE_NAME = "xupay_token";

    static final String CSRF_HEADER = "X-Requested-With";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    public static Optional<RequestToken> from(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length()).trim();
            return token.isEmpty() ? Optional.empty() : Optional.of(new RequestToken(token, false));
        }

        String cookie = cookieValue(request);
        if (cookie == null || cookie.isEmpty()) {
            return Optional.empty();
        }
        if (!SAFE_METHODS.contains(request.getMethod()) && request.getHeader(CSRF_HEADER) == null) {
            return Optional.empty();
        }
        return Optional.of(new RequestToken(cookie, true));
    }

    private static String cookieValue(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
