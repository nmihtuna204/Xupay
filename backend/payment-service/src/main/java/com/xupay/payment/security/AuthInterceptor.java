package com.xupay.payment.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;
import java.util.UUID;

/**
 * AuthInterceptor
 * Requires a valid access token on every /api/** request and exposes the
 * caller's user ID to controllers via {@link CurrentUser}.
 *
 * The token comes from "Authorization: Bearer" (scripts, API clients) or,
 * failing that, from the HttpOnly sign-in cookie user-service sets for the
 * web app (same host, so the browser sends it here too). On a
 * state-changing request the cookie only counts alongside an
 * X-Requested-With header: SameSite=Strict keeps other sites from using it,
 * and the header keeps pages on other origins of the same site out, since
 * adding it forces a CORS preflight they fail (see WebConfig). user-service
 * applies the same rule (its RequestToken).
 *
 * A HandlerInterceptor rather than a servlet Filter on purpose: it runs after
 * Spring MVC's CORS processing, so a 401 still carries the CORS headers and
 * the browser app sees the status (and can send the user to sign in) instead
 * of an opaque CORS failure. Rejections are thrown, so they go through
 * GlobalExceptionHandler and share the API's error body.
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    static final String TOKEN_COOKIE = "xupay_token";
    static final String CSRF_HEADER = "X-Requested-With";
    private static final String BEARER = "Bearer ";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private final JwtVerifier jwtVerifier;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // CORS preflights carry no credentials by design.
        if (CorsUtils.isPreFlightRequest(request)) {
            return true;
        }
        UUID userId = jwtVerifier.verify(token(request));
        request.setAttribute(CurrentUser.ATTRIBUTE, userId);
        return true;
    }

    private static String token(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER)) {
            return header.substring(BEARER.length()).trim();
        }
        String cookie = cookie(request);
        if (cookie == null || cookie.isEmpty()) {
            throw new UnauthorizedException("Missing access token");
        }
        if (!SAFE_METHODS.contains(request.getMethod()) && request.getHeader(CSRF_HEADER) == null) {
            throw new UnauthorizedException("Cookie sign-in needs the " + CSRF_HEADER + " header on this request");
        }
        return cookie;
    }

    private static String cookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (TOKEN_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
