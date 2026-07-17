package com.xupay.payment.grpc;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JwtForwardingFilter
 * Captures the incoming Authorization header into {@link JwtContextHolder}
 * so downstream gRPC calls to the User Service can forward the caller's JWT.
 *
 * The Payment Service itself does not authenticate requests (no user store);
 * it relies on the User Service to validate the token during gRPC calls.
 */
@Component
@Order(1)
public class JwtForwardingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && !authHeader.isBlank()) {
                JwtContextHolder.set(authHeader);
            }
            filterChain.doFilter(request, response);
        } finally {
            JwtContextHolder.clear();
        }
    }
}
