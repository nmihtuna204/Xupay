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
 * call per request. The one lookup is the signed-out check: a token revoked
 * by logging out (user-service records its ID in the shared Redis) is
 * refused here too.
 */
@Component
public class JwtVerifier {

    private final SecretKey key;
    private final String issuer;
    private final RevokedTokens revokedTokens;

    public JwtVerifier(@Value("${jwt.secret}") String secret,
                       @Value("${jwt.issuer:xupay-user-service}") String issuer,
                       RevokedTokens revokedTokens) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("jwt.secret must be at least 256 bits (32 characters)");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.revokedTokens = revokedTokens;
    }

    /**
     * @return the authenticated user's ID
     * @throws UnauthorizedException if the token is missing, forged, expired,
     *         from another issuer, has no usable subject or ID, or was signed out
     */
    public UUID verify(String token) {
        Claims claims;
        UUID userId;
        try {
            claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(issuer)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            userId = UUID.fromString(claims.getSubject());
        } catch (JwtException | IllegalArgumentException | NullPointerException e) {
            throw new UnauthorizedException("Invalid or expired token");
        }
        // Tokens from before logout could revoke them carry no ID, so they
        // could never be signed out: refuse them (signing in again issues one).
        String tokenId = claims.getId();
        if (tokenId == null || revokedTokens.isRevoked(tokenId)) {
            throw new UnauthorizedException("Invalid or expired token");
        }
        return userId;
    }
}
