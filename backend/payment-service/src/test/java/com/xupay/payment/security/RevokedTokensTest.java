package com.xupay.payment.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevokedTokensTest {

    @Mock
    private StringRedisTemplate redis;

    @Test
    void readsTheKeysUserServiceWritesOnLogout() {
        when(redis.hasKey("xupay:revoked-token:signed-out")).thenReturn(true);
        when(redis.hasKey("xupay:revoked-token:live")).thenReturn(false);
        RevokedTokens revoked = new RevokedTokens(redis);

        assertThat(revoked.isRevoked("signed-out")).isTrue();
        assertThat(revoked.isRevoked("live")).isFalse();
    }

    @Test
    void whenRedisIsDown_theTokenIsLetThrough() {
        when(redis.hasKey(anyString())).thenThrow(new RedisConnectionFailureException("Redis is down"));

        assertThat(new RevokedTokens(redis).isRevoked("any")).isFalse();
    }
}
