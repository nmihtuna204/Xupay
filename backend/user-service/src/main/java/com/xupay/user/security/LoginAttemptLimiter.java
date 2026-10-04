package com.xupay.user.security;

import com.xupay.user.exception.TooManyLoginAttemptsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

/**
 * LoginAttemptLimiter
 * Slows password guessing to a crawl without letting anyone lock other
 * people out of their accounts.
 *
 * Two counters of failed sign-ins, each over a 15-minute window:
 * - per email and IP: after 5 failures that email is refused from that IP
 *   for 15 minutes (one attacker hammering one account);
 * - per IP: after 20 failures the IP is refused for 15 minutes, whatever
 *   email it tries (one attacker working through many accounts).
 * Accounts themselves are never locked: someone guessing at your email from
 * their IP does not stop you signing in from yours.
 *
 * The counters live in Redis, shared by every instance. If Redis is down the
 * limiter lets sign-ins through and logs it: the API stays usable, without
 * this protection for as long as the outage lasts.
 *
 * The IP is request.getRemoteAddr(). Behind a reverse proxy that is the
 * proxy's address, so there, set server.forward-headers-strategy=native with
 * the proxy as a trusted internal proxy. Never take X-Forwarded-For from
 * clients at face value: a client could then pick a fresh "IP" per attempt.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LoginAttemptLimiter {

    static final int MAX_FAILURES_PER_EMAIL_AND_IP = 5;
    static final int MAX_FAILURES_PER_IP = 20;
    static final Duration WINDOW = Duration.ofMinutes(15);

    static final String EMAIL_IP_KEY_PREFIX = "xupay:login-failures:email-ip:";
    static final String IP_KEY_PREFIX = "xupay:login-failures:ip:";

    /**
     * KEYS: the counters; ARGV: their limits, in the same order. Returns the
     * seconds until the longest block ends, 0 when nothing blocks.
     */
    static final RedisScript<Long> SECONDS_BLOCKED = new DefaultRedisScript<>("""
            local wait = 0
            for i, key in ipairs(KEYS) do
              local failures = tonumber(redis.call('GET', key) or '0')
              if failures >= tonumber(ARGV[i]) then
                local ttl = redis.call('TTL', key)
                if ttl < 1 then ttl = 1 end
                if ttl > wait then wait = ttl end
              end
            end
            return wait
            """, Long.class);

    /**
     * KEYS: the counters; ARGV[1]: the window in seconds, then their limits.
     * A counter's window starts at its first failure. Reaching the limit
     * restarts it, so a block lasts a full window from the failure that
     * triggered it. One script, so a counter can never be left without an
     * expiry between the INCR and the EXPIRE.
     */
    static final RedisScript<Long> RECORD_FAILURE = new DefaultRedisScript<>("""
            for i, key in ipairs(KEYS) do
              local failures = redis.call('INCR', key)
              if failures == 1 or failures == tonumber(ARGV[i + 1]) or redis.call('TTL', key) < 0 then
                redis.call('EXPIRE', key, ARGV[1])
              end
            end
            return 1
            """, Long.class);

    private final StringRedisTemplate redis;

    /**
     * Call before checking the password.
     *
     * @throws TooManyLoginAttemptsException while this email from this IP, or
     *         this IP altogether, is blocked
     */
    public void checkAllowed(String email, String ip) {
        Long secondsBlocked;
        try {
            secondsBlocked = redis.execute(SECONDS_BLOCKED, keys(email, ip),
                    String.valueOf(MAX_FAILURES_PER_EMAIL_AND_IP), String.valueOf(MAX_FAILURES_PER_IP));
        } catch (Exception e) {
            log.warn("Could not check failed sign-ins (Redis unavailable), allowing the attempt: {}", e.toString());
            return;
        }
        if (secondsBlocked != null && secondsBlocked > 0) {
            log.warn("Sign-in for {} from {} refused: too many failed attempts, {}s left",
                    email, ip, secondsBlocked);
            throw new TooManyLoginAttemptsException(secondsBlocked);
        }
    }

    /** A wrong password (or unknown email) from this IP. */
    public void recordFailure(String email, String ip) {
        try {
            redis.execute(RECORD_FAILURE, keys(email, ip), String.valueOf(WINDOW.toSeconds()),
                    String.valueOf(MAX_FAILURES_PER_EMAIL_AND_IP), String.valueOf(MAX_FAILURES_PER_IP));
        } catch (Exception e) {
            log.warn("Could not record a failed sign-in (Redis unavailable): {}", e.toString());
        }
    }

    /**
     * A correct password clears this email's failures from this IP. The IP's
     * own count stands: otherwise signing in to an account of one's own
     * between guesses would reset it.
     */
    public void recordSuccess(String email, String ip) {
        try {
            redis.delete(emailIpKey(email, ip));
        } catch (Exception e) {
            log.warn("Could not clear failed sign-ins (Redis unavailable): {}", e.toString());
        }
    }

    private static List<String> keys(String email, String ip) {
        return List.of(emailIpKey(email, ip), IP_KEY_PREFIX + ip);
    }

    /**
     * Same normalization as sign-in itself, so "A@x.com" and "a@x.com " share
     * one counter. Hashed: a fixed key size whatever the input, and no email
     * addresses sitting in Redis. The IP goes first: it never contains the
     * separator, so no two (ip, email) pairs produce the same string.
     */
    static String emailIpKey(String email, String ip) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        return EMAIL_IP_KEY_PREFIX + sha256Hex(ip + "|" + normalizedEmail);
    }

    private static String sha256Hex(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available", e);
        }
    }
}
