package com.xupay.payment.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * JwtVerifier
 * Verifies the access tokens user-service issues and returns the caller's
 * user ID (the token subject).
 *
 * The payment API used to accept every request unauthenticated and take the
 * acting user from the request body, so anyone could deposit into, withdraw
 * from or read any wallet. Tokens are HS256 with a secret shared with
 * user-service (jwt.secret), so they are verified locally without a network
 * call per request.
 */
@Component
public class JwtVerifier {

    private final SecretKey key;
    private final String issuer;

    public JwtVerifier(@Value("${jwt.secret}") String secret,
                       @Value("${jwt.issuer:xupay-user-service}") String issuer) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("jwt.secret must be at least 256 bits (32 characters)");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
    }

    /**
     * @return the authenticated user's ID
     * @throws UnauthorizedException if the token is missing, forged, expired,
     *         from another issuer, or has no usable subject
     */
    public UUID verify(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(issuer)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return UUID.fromString(claims.getSubject());
        } catch (JwtException | IllegalArgumentException | NullPointerException e) {
            throw new UnauthorizedException("Invalid or expired token");
        }
    }
}
