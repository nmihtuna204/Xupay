package com.xupay.user.security;

import com.xupay.user.entity.enums.UserRole;
import com.xupay.user.repository.UserRepository;
import com.xupay.user.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FilterChain chain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    private final UUID userId = UUID.randomUUID();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private static Authentication authentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    @Test
    void signInCookie_authenticatesTheUser() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.setCookies(new Cookie(RequestToken.COOKIE_NAME, "cookie-token"));
        when(jwtService.validateToken("cookie-token")).thenReturn(true);
        when(jwtService.getUserIdFromToken("cookie-token")).thenReturn(userId);
        when(userRepository.findRoleById(userId)).thenReturn(Optional.of(UserRole.USER));

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertThat(authentication().getName()).isEqualTo(userId.toString());
        assertThat(authentication().getAuthorities()).extracting(Object::toString).containsExactly("ROLE_USER");
        verify(chain).doFilter(any(), any());
    }

    @Test
    void signInCookie_onAPostWithoutXRequestedWith_authenticatesNobody() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/users/me/contacts");
        request.setCookies(new Cookie(RequestToken.COOKIE_NAME, "cookie-token"));

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertThat(authentication()).isNull();
        verifyNoInteractions(jwtService);
        verify(chain).doFilter(any(), any());
    }

    @Test
    void signedOutToken_authenticatesNobody() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer signed-out-token");
        when(jwtService.validateToken("signed-out-token")).thenReturn(false);

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertThat(authentication()).isNull();
        verify(chain).doFilter(any(), any());
    }
}
