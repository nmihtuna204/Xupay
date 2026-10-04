package com.xupay.user.config;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.resource.Delay;
import org.springframework.boot.autoconfigure.data.redis.ClientResourcesBuilderCustomizer;
import org.springframework.boot.autoconfigure.data.redis.LettuceClientOptionsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Redis client settings.
 *
 * Everything this service keeps in Redis is best effort (revoked tokens,
 * failed sign-in counters): when Redis is unreachable the callers log and
 * carry on. By default Lettuce queues commands while it reconnects and fails
 * them only at the command timeout, so an outage would add that delay to
 * every authenticated request. Rejecting commands while disconnected makes
 * them fail at once and the fallbacks take over immediately.
 */
@Configuration
public class RedisConfig {

    @Bean
    public LettuceClientOptionsBuilderCustomizer rejectCommandsWhileDisconnected() {
        return options -> options.disconnectedBehavior(ClientOptions.DisconnectedBehavior.REJECT_COMMANDS);
    }

    /**
     * Lettuce's default backoff between reconnect attempts grows to 30
     * seconds, so after an outage Redis could be back for half a minute while
     * sign-outs here were still being dropped. Capped at 2 seconds instead.
     */
    @Bean
    public ClientResourcesBuilderCustomizer reconnectQuickly() {
        return resources -> resources.reconnectDelay(
                Delay.exponential(Duration.ofMillis(100), Duration.ofSeconds(2), 2, TimeUnit.MILLISECONDS));
    }
}
