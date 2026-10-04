package com.xupay.user.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevokedTokenStoreTest {

    @Mock
    private StringRedisTemplate redis;

    @Mock
    private ValueOperations<String, String> values;

    @Test
    void revoke_keepsTheTokenIdUntilTheTokenWouldHaveExpired() {
        when(redis.opsForValue()).thenReturn(values);

        new RevokedTokenStore(redis).revoke("jti-1", Instant.now().plus(Duration.ofHours(2)));

        ArgumentCaptor<Duration> ttl = ArgumentCaptor.forClass(Duration.class);
        verify(values).set(eq("xupay:revoked-token:jti-1"), eq("1"), ttl.capture());
        assertThat(ttl.getValue()).isBetween(Duration.ofMinutes(119), Duration.ofHours(2));
    }

    @Test
    void revoke_ofAnAlreadyExpiredToken_storesNothing() {
        new RevokedTokenStore(redis).revoke("jti-1", Instant.now().minusSeconds(5));

        verifyNoInteractions(redis);
    }

    @Test
    void revoke_whenRedisIsDown_isLoggedNotThrown() {
        when(redis.opsForValue()).thenReturn(values);
        doThrow(new RedisConnectionFailureException("Redis is down"))
                .when(values).set(anyString(), anyString(), any(Duration.class));

        assertThatCode(() -> new RevokedTokenStore(redis).revoke("jti-1", Instant.now().plusSeconds(60)))
                .doesNotThrowAnyException();
    }

    @Test
    void isRevoked_answersFromRedis() {
        when(redis.hasKey("xupay:revoked-token:signed-out")).thenReturn(true);
        when(redis.hasKey("xupay:revoked-token:live")).thenReturn(false);
        RevokedTokenStore store = new RevokedTokenStore(redis);

        assertThat(store.isRevoked("signed-out")).isTrue();
        assertThat(store.isRevoked("live")).isFalse();
    }

    @Test
    void isRevoked_whenRedisIsDown_letsTheTokenThrough() {
        when(redis.hasKey(anyString())).thenThrow(new RedisConnectionFailureException("Redis is down"));

        assertThat(new RevokedTokenStore(redis).isRevoked("any")).isFalse();
    }
}
