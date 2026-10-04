package com.xupay.payment.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthInterceptorTest {

    @Mock
    private JwtVerifier jwtVerifier;

    @InjectMocks
    private AuthInterceptor interceptor;

    private final UUID userId = UUID.randomUUID();

    private static MockHttpServletRequest request(String method) {
        return new MockHttpServletRequest(method, "/api/payments/transfer");
    }

    private boolean handle(MockHttpServletRequest request) {
        return interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
    }

    @Test
    void bearerHeader_authenticates() {
        MockHttpServletRequest request = request("POST");
        request.addHeader("Authorization", "Bearer header-token");
        when(jwtVerifier.verify("header-token")).thenReturn(userId);

        assertThat(handle(request)).isTrue();
        assertThat(CurrentUser.id(request)).isEqualTo(userId);
    }

    @Test
    void bearerHeader_winsOverTheCookie() {
        MockHttpServletRequest request = request("GET");
        request.addHeader("Authorization", "Bearer header-token");
        request.setCookies(new Cookie(AuthInterceptor.TOKEN_COOKIE, "cookie-token"));
        when(jwtVerifier.verify("header-token")).thenReturn(userId);

        assertThat(handle(request)).isTrue();
    }

    @Test
    void signInCookie_authenticatesReads() {
        MockHttpServletRequest request = request("GET");
        request.setCookies(new Cookie(AuthInterceptor.TOKEN_COOKIE, "cookie-token"));
        when(jwtVerifier.verify("cookie-token")).thenReturn(userId);

        assertThat(handle(request)).isTrue();
        assertThat(CurrentUser.id(request)).isEqualTo(userId);
    }

    @Test
    void signInCookie_onAStateChangingRequest_needsXRequestedWith() {
        MockHttpServletRequest request = request("POST");
        request.setCookies(new Cookie(AuthInterceptor.TOKEN_COOKIE, "cookie-token"));

        assertThatThrownBy(() -> handle(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("X-Requested-With");
        verifyNoInteractions(jwtVerifier);

        request.addHeader("X-Requested-With", "XMLHttpRequest");
        when(jwtVerifier.verify("cookie-token")).thenReturn(userId);
        assertThat(handle(request)).isTrue();
    }

    @Test
    void noToken_isRefused() {
        assertThatThrownBy(() -> handle(request("GET")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Missing access token");
    }

    @Test
    void corsPreflight_passesWithoutCredentials() {
        MockHttpServletRequest preflight = request("OPTIONS");
        preflight.addHeader("Origin", "http://localhost:3000");
        preflight.addHeader("Access-Control-Request-Method", "POST");

        assertThat(handle(preflight)).isTrue();
        verifyNoInteractions(jwtVerifier);
    }
}
