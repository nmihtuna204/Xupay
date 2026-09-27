package com.xupay.payment.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

/**
 * AuthInterceptor
 * Requires a valid Bearer token on every /api/** request and exposes the
 * caller's user ID to controllers via {@link CurrentUser}.
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

    private static final String BEARER = "Bearer ";

    private final JwtVerifier jwtVerifier;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // CORS preflights carry no credentials by design.
        if (CorsUtils.isPreFlightRequest(request)) {
            return true;
        }
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith(BEARER)) {
            throw new UnauthorizedException("Missing bearer token");
        }
        UUID userId = jwtVerifier.verify(header.substring(BEARER.length()).trim());
        request.setAttribute(CurrentUser.ATTRIBUTE, userId);
        return true;
    }
}
