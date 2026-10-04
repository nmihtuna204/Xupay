package com.xupay.user.security;

import com.xupay.user.service.JwtService;
import com.xupay.user.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

/**
 * JwtAuthenticationFilter
 * Intercepts every request, extracts the JWT (Authorization header, else the
 * sign-in cookie - see RequestToken), validates it (signature, expiry, not
 * signed out) and sets the Spring Security context.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Authentication is attempted in isolation, and the chain runs exactly
        // once, outside it. The chain used to run inside this try for
        // anonymous and rejected requests, so anything the rest of the chain
        // threw (a client hanging up mid-response, an error the controllers
        // did not handle) landed in the catch below - logged as an auth
        // failure - and then the whole request ran a second time.
        try {
            authenticate(request);
        } catch (Exception e) {
            log.error("Cannot set user authentication in SecurityContext", e);
        }

        filterChain.doFilter(request, response);
    }

    /** Sets the SecurityContext from a valid token; leaves it empty otherwise. */
    private void authenticate(HttpServletRequest request) {
        // Extract JWT token from the Authorization header or the cookie
        String token = RequestToken.from(request).map(RequestToken::value).orElse(null);

        // If no token found, continue without authentication
        if (token == null) {
            return;
        }

        // Validate token
        if (!jwtService.validateToken(token)) {
            log.warn("Invalid JWT token for request: {}", request.getRequestURI());
            return;
        }

        // Extract user information from token
        UUID userId = jwtService.getUserIdFromToken(token);
        String email = jwtService.getEmailFromToken(token);

        // Set authentication in SecurityContext
        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // The role is read from the database rather than a token claim,
            // so promoting or demoting an admin takes effect on the next
            // request instead of when the 24h token expires. A token for a
            // user that no longer exists authenticates nobody.
            var role = userRepository.findRoleById(userId);
            if (role.isEmpty()) {
                return;
            }
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    userId.toString(),   // Principal (user ID as string for Principal#getName())
                    token,               // Credentials (token for downstream use)
                    List.of(new SimpleGrantedAuthority("ROLE_" + role.get().name()))
                );

            // Set request details
            authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
            );

            // Set authentication in SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("Authenticated user {} for request: {}", email, request.getRequestURI());
        }
    }
}
