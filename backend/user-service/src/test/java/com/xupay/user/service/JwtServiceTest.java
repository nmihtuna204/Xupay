package com.xupay.user.service;

import com.xupay.user.config.JwtConfig;
import com.xupay.user.entity.User;
import com.xupay.user.entity.enums.KycStatus;
import com.xupay.user.entity.enums.KycTier;
import com.xupay.user.security.RevokedTokenStore;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    private static final String SECRET = "test-secret-key-minimum-256-bits-for-junit-testing-purposes-only";

    @Mock
    private RevokedTokenStore revokedTokens;

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtConfig config = new JwtConfig();
        config.setSecret(SECRET);
        config.setExpiration(3_600_000L);
        config.setIssuer("xupay-test");
        config.setAudience("xupay-test-client");
        jwtService = new JwtService(config, revokedTokens);
    }

    private static User user() {
        return User.builder()
                .id(UUID.randomUUID())
                .email("someone@example.com")
                .firstName("Some")
                .lastName("One")
                .kycStatus(KycStatus.PENDING)
                .kycTier(KycTier.TIER_0)
                .build();
    }

    private static SecretKey key() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    private static Claims claims(String token) {
        return Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();
    }

    private static Date inOneMinute() {
        return new Date(System.currentTimeMillis() + 60_000);
    }

    @Test
    void everyToken_getsItsOwnId() {
        User user = user();

        String first = jwtService.generateToken(user);
        String second = jwtService.generateToken(user);

        assertThat(claims(first).getId()).isNotBlank().isNotEqualTo(claims(second).getId());
    }

    @Test
    void validateToken_acceptsAFreshToken() {
        assertThat(jwtService.validateToken(jwtService.generateToken(user()))).isTrue();
    }

    @Test
    void validateToken_refusesASignedOutToken() {
        String token = jwtService.generateToken(user());
        when(revokedTokens.isRevoked(claims(token).getId())).thenReturn(true);

        assertThat(jwtService.validateToken(token)).isFalse();
    }

    @Test
    void validateToken_refusesATokenWithoutAnId_whichCouldNeverBeSignedOut() {
        String legacy = Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .expiration(inOneMinute())
                .signWith(key())
                .compact();

        assertThat(jwtService.validateToken(legacy)).isFalse();
        verifyNoInteractions(revokedTokens);
    }

    @Test
    void validateToken_refusesForgedAndExpiredTokens() {
        SecretKey otherKey = Keys.hmacShaKeyFor(
                "a-different-secret-that-is-also-at-least-256-bits".getBytes(StandardCharsets.UTF_8));
        String forged = Jwts.builder().id("forged").subject(UUID.randomUUID().toString())
                .expiration(inOneMinute()).signWith(otherKey).compact();
        String expired = Jwts.builder().id("expired").subject(UUID.randomUUID().toString())
                .expiration(new Date(System.currentTimeMillis() - 60_000)).signWith(key()).compact();

        assertThat(jwtService.validateToken(forged)).isFalse();
        assertThat(jwtService.validateToken(expired)).isFalse();
    }

    @Test
    void revokeToken_recordsTheIdUntilTheTokenExpires() {
        String token = jwtService.generateToken(user());
        Claims claims = claims(token);

        jwtService.revokeToken(token);

        verify(revokedTokens).revoke(claims.getId(), claims.getExpiration().toInstant());
    }

    @Test
    void revokeToken_ignoresATokenThatIsNotValidAnyway() {
        jwtService.revokeToken("not-a-jwt");

        verifyNoInteractions(revokedTokens);
    }
}
