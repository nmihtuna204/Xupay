package com.xupay.payment.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * RevokedTokens
 * Whether a token was signed out before it expired. user-service writes the
 * entries on logout (its RevokedTokenStore) into the shared Redis, keyed by
 * the token's ID (jti) and expiring when the token would; this service only
 * reads them. Keep KEY_PREFIX identical in both services.
 *
 * Best effort by design: if Redis is unreachable the token is let through
 * and the failure logged, so an outage does not take payments down.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RevokedTokens {

    static final String KEY_PREFIX = "xupay:revoked-token:";

    private final StringRedisTemplate redis;

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
