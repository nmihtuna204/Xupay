package com.xupay.user.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/**
 * RevokedTokenStore
 * Tokens that were signed out before they expired, by token ID (the jti
 * claim). Each entry lives in Redis exactly as long as the token would have,
 * so the set never grows past the tokens still in their 24 hours.
 *
 * payment-service reads the same keys (its RevokedTokens): a token signed out
 * here stops working there too. Keep KEY_PREFIX identical in both services.
 *
 * Best effort by design: if Redis is unreachable, a revocation is logged and
 * lost, and a revoked token is let through, so an outage does not take
 * sign-in or the API down with it.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RevokedTokenStore {

    static final String KEY_PREFIX = "xupay:revoked-token:";

    private final StringRedisTemplate redis;

    /** Rejects the token with this ID until {@code expiresAt}, when it would stop working anyway. */
    public void revoke(String tokenId, Instant expiresAt) {
        Duration remaining = Duration.between(Instant.now(), expiresAt);
        if (remaining.isNegative() || remaining.isZero()) {
            return;
        }
        try {
            redis.opsForValue().set(KEY_PREFIX + tokenId, "1", remaining);
        } catch (Exception e) {
            log.error("Could not revoke token {} (Redis unavailable): it stays valid until {}: {}",
                    tokenId, expiresAt, e.toString());
        }
    }

    public boolean isRevoked(String tokenId) {
        try {
            return Boolean.TRUE.equals(redis.hasKey(KEY_PREFIX + tokenId));
        } catch (Exception e) {
            log.warn("Could not check token revocation (Redis unavailable), allowing the request: {}",
                    e.toString());
            return false;
        }
    }
}
