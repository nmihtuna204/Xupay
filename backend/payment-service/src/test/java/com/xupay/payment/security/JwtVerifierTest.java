package com.xupay.payment.security;

import io.jsonwebtoken.JwtBuilder;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtVerifierTest {

    private static final String SECRET = "payment-test-secret-at-least-256-bits-long-0123456789";
    private static final String ISSUER = "xupay-user-service";

    @Mock
    private RevokedTokens revokedTokens;

    private JwtVerifier verifier;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        verifier = new JwtVerifier(SECRET, ISSUER, revokedTokens);
    }

    private static SecretKey key() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    /** A token as user-service issues it. */
    private JwtBuilder token() {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId.toString())
                .issuer(ISSUER)
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key());
    }

    @Test
    void validToken_yieldsTheUser() {
        assertThat(verifier.verify(token().compact())).isEqualTo(userId);
    }

    @Test
    void signedOutToken_isRefused() {
        when(revokedTokens.isRevoked("signed-out")).thenReturn(true);

        assertThatThrownBy(() -> verifier.verify(token().id("signed-out").compact()))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void tokenWithoutAnId_isRefused_becauseItCouldNeverBeSignedOut() {
        String legacy = Jwts.builder()
                .subject(userId.toString())
                .issuer(ISSUER)
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key())
                .compact();

        assertThatThrownBy(() -> verifier.verify(legacy)).isInstanceOf(UnauthorizedException.class);
        verifyNoInteractions(revokedTokens);
    }

    @Test
    void forgedExpiredOrForeignTokens_areRefused_withoutAskingRedis() {
        SecretKey otherKey = Keys.hmacShaKeyFor(
                "some-other-secret-that-is-also-at-least-256-bits".getBytes(StandardCharsets.UTF_8));
        String forged = token().signWith(otherKey).compact();
        String expired = token().expiration(new Date(System.currentTimeMillis() - 60_000)).compact();
        String foreign = token().issuer("someone-else").compact();

        for (String bad : new String[] {forged, expired, foreign, "not-a-jwt"}) {
            assertThatThrownBy(() -> verifier.verify(bad)).isInstanceOf(UnauthorizedException.class);
        }
        verifyNoInteractions(revokedTokens);
    }
}
