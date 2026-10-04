package com.xupay.user.service;

import com.xupay.user.config.JwtConfig;
import com.xupay.user.entity.User;
import com.xupay.user.security.RevokedTokenStore;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * JwtService
 * Handles JWT token generation, validation, and parsing.
 * Uses HMAC-SHA256 (HS256) algorithm for signing.
 *
 * Every token carries a unique ID (the jti claim) so that signing out can
 * revoke that one token (see RevokedTokenStore) without touching the user's
 * other sessions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {

    private final JwtConfig jwtConfig;
    private final RevokedTokenStore revokedTokens;

    /**
     * Generate JWT token for authenticated user
     */
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put("kycStatus", user.getKycStatus().name());
        claims.put("kycTier", user.getKycTier().name());

        return createToken(claims, user.getId().toString());
    }

    /**
     * Create JWT token with claims and subject
     */
    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + jwtConfig.getExpiration());

        return Jwts.builder()
                .claims(claims)
                .subject(subject)  // User ID
                .id(UUID.randomUUID().toString())  // jti: what sign-out revokes
                .issuer(jwtConfig.getIssuer())
                .audience().add(jwtConfig.getAudience()).and()
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validate JWT token
     * Returns true if the token is genuine, not expired and not signed out
     */
    public boolean validateToken(String token) {
        try {
            String tokenId = getClaimsFromToken(token).getId();
            // Tokens from before sign-out could revoke them have no ID, so
            // they could never be signed out: refuse them. Signing in again
            // issues one that has an ID.
            if (tokenId == null) {
                log.warn("JWT token has no ID (jti), refusing it");
                return false;
            }
            if (revokedTokens.isRevoked(tokenId)) {
                log.debug("JWT token {} was signed out", tokenId);
                return false;
            }
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("JWT token is malformed: {}", e.getMessage());
        } catch (JwtException e) {
            // A bad signature is io.jsonwebtoken.security.SignatureException.
            // This caught java.lang.SecurityException, which jjwt never throws,
            // so forged tokens escaped this method as an exception instead of
            // a false.
            log.error("JWT signature validation failed: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Sign a token out: from now until it expires it is refused here and by
     * payment-service. A token that is already invalid (forged, expired,
     * malformed) needs nothing.
     */
    public void revokeToken(String token) {
        Claims claims;
        try {
            claims = getClaimsFromToken(token);
        } catch (JwtException | IllegalArgumentException e) {
            return;
        }
        if (claims.getId() != null) {
            revokedTokens.revoke(claims.getId(), claims.getExpiration().toInstant());
        }
    }

    /**
     * Extract user ID from token
     */
    public UUID getUserIdFromToken(String token) {
        String subject = getClaimsFromToken(token).getSubject();
        return UUID.fromString(subject);
    }

    /**
     * Extract email from token
     */
    public String getEmailFromToken(String token) {
        return getClaimsFromToken(token).get("email", String.class);
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = getClaimsFromToken(token).getExpiration();
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Extract all claims from token
     */
    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Get signing key from configured secret
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
