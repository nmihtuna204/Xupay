package com.xupay.payment.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.xupay.payment.dto.TransferResponse;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.resource.Delay;
import org.springframework.boot.autoconfigure.data.redis.ClientResourcesBuilderCustomizer;
import org.springframework.boot.autoconfigure.data.redis.LettuceClientOptionsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * RedisConfig
 * Configuration for Redis caching with custom serialization.
 * 
 * Purpose:
 * - Define RedisTemplate<String, TransferResponse> bean for idempotency caching
 * - Configure Jackson JSON serialization for TransferResponse objects
 * - Enable Java 8 time (LocalDateTime) support
 * 
 * Why This Is Needed:
 * Spring Boot auto-configures RedisTemplate<Object, Object> by default,
 * but we need RedisTemplate<String, TransferResponse> for type safety.
 */
@Configuration
public class RedisConfig {

    /**
     * Every use of Redis here is best effort: the idempotency cache falls back
     * to the database and the signed-out token check lets requests through.
     * By default Lettuce queues commands while it reconnects and fails them
     * only at the command timeout, so an outage would add that delay to every
     * request. Rejecting commands while disconnected makes them fail at once
     * and the fallbacks take over immediately.
     */
    @Bean
    public LettuceClientOptionsBuilderCustomizer rejectCommandsWhileDisconnected() {
        return options -> options.disconnectedBehavior(ClientOptions.DisconnectedBehavior.REJECT_COMMANDS);
    }

    /**
     * Lettuce's default backoff between reconnect attempts grows to 30
     * seconds, so after an outage Redis could be back for half a minute while
     * signed-out tokens were still let through here. Capped at 2 seconds.
     */
    @Bean
    public ClientResourcesBuilderCustomizer reconnectQuickly() {
        return resources -> resources.reconnectDelay(
                Delay.exponential(Duration.ofMillis(100), Duration.ofSeconds(2), 2, TimeUnit.MILLISECONDS));
    }

    /**
     * Create RedisTemplate bean for caching TransferResponse objects.
     * 
     * Serialization Strategy:
     * - Key: String (idempotency key as string)
     * - Value: JSON (TransferResponse serialized as JSON using Jackson)
     * 
     * @param connectionFactory Redis connection factory (auto-configured by Spring Boot)
     * @return RedisTemplate<String, TransferResponse> for idempotency caching
     */
    @Bean
    public RedisTemplate<String, TransferResponse> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, TransferResponse> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Configure ObjectMapper for JSON serialization
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule()); // Support LocalDateTime, Instant, etc.
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // ISO-8601 format

        // Create JSON serializer for TransferResponse
        Jackson2JsonRedisSerializer<TransferResponse> serializer = 
            new Jackson2JsonRedisSerializer<>(TransferResponse.class);
        serializer.setObjectMapper(objectMapper);

        // Set serializers
        template.setKeySerializer(new StringRedisSerializer());         // Keys as plain strings
        template.setValueSerializer(serializer);                        // Values as JSON
        template.setHashKeySerializer(new StringRedisSerializer());     // Hash keys as strings
        template.setHashValueSerializer(serializer);                    // Hash values as JSON

        template.afterPropertiesSet();
        return template;
    }
}
