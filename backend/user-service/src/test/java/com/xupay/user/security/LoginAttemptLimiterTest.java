package com.xupay.user.security;

import com.xupay.user.exception.TooManyLoginAttemptsException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * The Redis side (the two Lua scripts) runs against a real Redis in the live
 * security check; these cover what the limiter asks of Redis and how it
 * reacts to the answers, including Redis being down.
 */
@ExtendWith(MockitoExtension.class)
class LoginAttemptLimiterTest {

    private static final String EMAIL = "victim@example.com";
    private static final String IP = "203.0.113.7";

    @Mock
    private StringRedisTemplate redis;

    private LoginAttemptLimiter limiter() {
        return new LoginAttemptLimiter(redis);
    }

    private static List<String> keys() {
        return List.of(LoginAttemptLimiter.emailIpKey(EMAIL, IP), LoginAttemptLimiter.IP_KEY_PREFIX + IP);
    }

    @Test
    void checkAllowed_passesWhileNothingIsBlocked() {
        when(redis.execute(eq(LoginAttemptLimiter.SECONDS_BLOCKED), eq(keys()), eq("5"), eq("20")))
                .thenReturn(0L);

        assertThatCode(() -> limiter().checkAllowed(EMAIL, IP)).doesNotThrowAnyException();
    }

    @Test
    void checkAllowed_whileBlocked_refusesWithTheRemainingWait() {
        when(redis.execute(eq(LoginAttemptLimiter.SECONDS_BLOCKED), eq(keys()), eq("5"), eq("20")))
                .thenReturn(840L);

        assertThatThrownBy(() -> limiter().checkAllowed(EMAIL, IP))
                .isInstanceOf(TooManyLoginAttemptsException.class)
                .hasMessage("Too many failed sign-in attempts. Try again in 14 minutes.")
                .satisfies(e -> assertThat(((TooManyLoginAttemptsException) e).getRetryAfterSeconds())
                        .isEqualTo(840L));
    }

    @Test
    void checkAllowed_whenRedisIsDown_letsTheAttemptThrough() {
        when(redis.execute(eq(LoginAttemptLimiter.SECONDS_BLOCKED), anyList(), any(Object[].class)))
                .thenThrow(new RedisConnectionFailureException("Redis is down"));

        assertThatCode(() -> limiter().checkAllowed(EMAIL, IP)).doesNotThrowAnyException();
    }

    @Test
    void recordFailure_countsAgainstTheEmailIpPairAndTheIp_over15Minutes() {
        limiter().recordFailure(EMAIL, IP);

        verify(redis).execute(LoginAttemptLimiter.RECORD_FAILURE, keys(), "900", "5", "20");
    }

    @Test
    void recordFailure_whenRedisIsDown_isLoggedNotThrown() {
        when(redis.execute(eq(LoginAttemptLimiter.RECORD_FAILURE), anyList(), any(Object[].class)))
                .thenThrow(new RedisConnectionFailureException("Redis is down"));

        assertThatCode(() -> limiter().recordFailure(EMAIL, IP)).doesNotThrowAnyException();
    }

    @Test
    void recordSuccess_clearsThePairButNotTheIpCount() {
        limiter().recordSuccess(EMAIL, IP);

        verify(redis).delete(LoginAttemptLimiter.emailIpKey(EMAIL, IP));
        verifyNoMoreInteractions(redis);
    }

    @Test
    void emailIpKey_ignoresCaseAndSpacesInTheEmail_butNotTheIp() {
        String key = LoginAttemptLimiter.emailIpKey("victim@example.com", IP);

        assertThat(LoginAttemptLimiter.emailIpKey("  Victim@Example.COM ", IP)).isEqualTo(key);
        assertThat(LoginAttemptLimiter.emailIpKey("victim@example.com", "198.51.100.1")).isNotEqualTo(key);
        assertThat(key).startsWith(LoginAttemptLimiter.EMAIL_IP_KEY_PREFIX).doesNotContain("victim");
    }

    @Test
    void retryMessage_roundsUpToWholeMinutes() {
        assertThat(new TooManyLoginAttemptsException(900)).hasMessageEndingWith("in 15 minutes.");
        assertThat(new TooManyLoginAttemptsException(61)).hasMessageEndingWith("in 2 minutes.");
        assertThat(new TooManyLoginAttemptsException(5)).hasMessageEndingWith("in 1 minute.");
    }
}
