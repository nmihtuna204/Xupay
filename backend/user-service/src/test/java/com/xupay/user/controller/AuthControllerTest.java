package com.xupay.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xupay.user.controller.AuthController;
import com.xupay.user.dto.request.LoginRequest;
import com.xupay.user.dto.request.RegisterRequest;
import com.xupay.user.dto.response.AuthResponse;
import com.xupay.user.dto.response.UserResponse;
import com.xupay.user.entity.User;
import com.xupay.user.entity.enums.KycStatus;
import com.xupay.user.entity.enums.KycTier;
import com.xupay.user.entity.enums.UserRole;
import com.xupay.user.exception.InvalidCredentialsException;
import com.xupay.user.exception.TooManyLoginAttemptsException;
import com.xupay.user.mapper.UserMapper;
import com.xupay.user.repository.UserRepository;
import com.xupay.user.security.AuthCookies;
import com.xupay.user.security.LoginAttemptLimiter;
import com.xupay.user.service.AuthService;
import com.xupay.user.service.JwtService;
import jakarta.servlet.http.Cookie;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for AuthController
 * Tests all authentication endpoints: register, login, logout, validate, and me
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(AuthCookies.class)  // the real cookie, so its attributes are tested
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private UserDetailsService userDetailsService; // <--- SecurityConfig needs this!

    @MockBean
    private JwtService jwtService; // <--- SecurityConfig needs this!

    // (Optional) Add this if you use JPA Auditing (CreatedDate, etc.)
    @MockBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @MockBean
    private UserMapper userMapper;

    @MockBean
    private LoginAttemptLimiter loginAttemptLimiter;

    /** MockMvc's default client address. */
    private static final String IP = "127.0.0.1";

    @Test
    @DisplayName("POST /api/auth/register - Should register new user and return token")
    void register_shouldReturnCreatedWithAuthResponse() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest(
            "test@example.com",
            "P@ssword123",
            "John",
            "Doe",
            "+84901234567",
            null
        );

        UserResponse userResponse = new UserResponse(
            UUID.randomUUID(),
            "test@example.com",
            "John",
            "Doe",
            "+84901234567",
            KycStatus.PENDING,
            KycTier.TIER_0,
            true,
            OffsetDateTime.now(),
            UserRole.USER
        );

        AuthResponse authResponse = new AuthResponse(
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            604800L,
            userResponse.id(),
            userResponse.email()
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").value("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."))
            .andExpect(jsonPath("$.email").value("test@example.com"))
            .andExpect(jsonPath("$.userId").exists());
    }

    @Test
    @DisplayName("POST /api/auth/login - Should authenticate user and return token")
    void login_shouldReturnOkWithAuthResponse() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest(
            "test@example.com",
            "P@ssword123"
        );

        UserResponse userResponse = new UserResponse(
            UUID.randomUUID(),
            "test@example.com",
            "John",
            "Doe",
            "+84901234567",
            KycStatus.APPROVED,
            KycTier.TIER_1,
            true,
            OffsetDateTime.now(),
            UserRole.USER
        );

        AuthResponse authResponse = new AuthResponse(
            "login-token-xyz",
            604800L,
            userResponse.id(),
            userResponse.email()
        );

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("login-token-xyz"))
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/logout - Should return no content")
    void logout_shouldReturnNoContent() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/auth/logout")
                .with(csrf()))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("register sets the token as an HttpOnly, SameSite=Strict cookie for the token's lifetime")
    void register_setsHttpOnlySessionCookie() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
            .thenReturn(new AuthResponse("reg-token", 86400L, UUID.randomUUID(), "new@example.com"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest(
                    "new@example.com", "P@ssword123", "New", "User", null, null))))
            .andExpect(status().isCreated())
            .andExpect(header().string(HttpHeaders.SET_COOKIE, allOf(
                startsWith("xupay_token=reg-token;"),
                containsString("Path=/"),
                containsString("Max-Age=86400"),
                containsString("HttpOnly"),
                containsString("SameSite=Strict"),
                not(containsString("Secure")))));  // xupay.auth.cookie-secure defaults to off
    }

    @Test
    @DisplayName("login: a correct password sets the cookie and clears this email's failures")
    void login_success_setsCookieAndRecordsSuccess() throws Exception {
        when(authService.login(any(LoginRequest.class)))
            .thenReturn(new AuthResponse("login-token", 86400L, UUID.randomUUID(), "test@example.com"));

        mockMvc.perform(login("test@example.com", "P@ssword123"))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.SET_COOKIE, startsWith("xupay_token=login-token;")));

        verify(loginAttemptLimiter).checkAllowed("test@example.com", IP);
        verify(loginAttemptLimiter).recordSuccess("test@example.com", IP);
        verify(loginAttemptLimiter, never()).recordFailure(anyString(), anyString());
    }

    @Test
    @DisplayName("login: a wrong password is 401, counts as a failure and sets no cookie")
    void login_wrongPassword_recordsFailure() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenThrow(new InvalidCredentialsException());

        mockMvc.perform(login("test@example.com", "wrong-password"))
            .andExpect(status().isUnauthorized())
            .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));

        verify(loginAttemptLimiter).recordFailure("test@example.com", IP);
        verify(loginAttemptLimiter, never()).recordSuccess(anyString(), anyString());
    }

    @Test
    @DisplayName("login: while blocked it is 429 with Retry-After, and the password is never checked")
    void login_blocked_is429WithRetryAfter() throws Exception {
        doThrow(new TooManyLoginAttemptsException(840))
            .when(loginAttemptLimiter).checkAllowed("test@example.com", IP);

        mockMvc.perform(login("test@example.com", "P@ssword123"))
            .andExpect(status().isTooManyRequests())
            .andExpect(header().string(HttpHeaders.RETRY_AFTER, "840"))
            .andExpect(jsonPath("$.message").value("Too many failed sign-in attempts. Try again in 14 minutes."));

        verify(authService, never()).login(any());
    }

    @Test
    @DisplayName("logout revokes the cookie's token and deletes the cookie")
    void logout_withCookie_revokesTokenAndClearsCookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie("xupay_token", "cookie-token"))
                .header("X-Requested-With", "XMLHttpRequest"))
            .andExpect(status().isNoContent())
            .andExpect(header().string(HttpHeaders.SET_COOKIE, allOf(
                startsWith("xupay_token=;"), containsString("Max-Age=0"), containsString("HttpOnly"))));

        verify(authService).logout("cookie-token");
    }

    @Test
    @DisplayName("logout revokes a Bearer token")
    void logout_withBearerToken_revokesIt() throws Exception {
        mockMvc.perform(post("/api/auth/logout").header("Authorization", "Bearer header-token"))
            .andExpect(status().isNoContent());

        verify(authService).logout("header-token");
    }

    @Test
    @DisplayName("logout without a token still answers 204 and deletes the cookie")
    void logout_withoutToken_stillClearsCookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
            .andExpect(status().isNoContent())
            .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));

        verify(authService, never()).logout(anyString());
    }

    @Test
    @DisplayName("GET /api/auth/validate - Should validate token and return ok")
    @WithMockUser
    void validate_shouldReturnOk() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/validate"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/auth/me - Should return current user profile")
    @WithMockUser(username = "11111111-1111-1111-1111-111111111111")
    void getCurrentUser_shouldReturnUserResponse() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        // 2. Setup the Entity (DB representation)
        User user = User.builder()
            .id(userId)
            .email("test@example.com")
            .firstName("John")
            .lastName("Doe")
            .phone("+84901234567")
            .kycStatus(KycStatus.APPROVED)
            .kycTier(KycTier.TIER_2)
            .isActive(true)
            // FIX: Use ZonedDateTime.now() instead of Instant.now()
            .createdAt(java.time.ZonedDateTime.now()) 
            .updatedAt(java.time.ZonedDateTime.now()) 
            .build();

        // 3. Setup the Response DTO
        UserResponse response = new UserResponse(
            userId, 
            "test@example.com", 
            "John", 
            "Doe", 
            "+84901234567",
            KycStatus.APPROVED, 
            KycTier.TIER_2, 
            true, 
            OffsetDateTime.now(),
            UserRole.USER
        );

        // 4. Mock the REPOSITORY
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // 5. Mock the MAPPER
        // Use any() to ensure it matches even if the ZonedDateTime objects differ slightly in nanoseconds
        when(userMapper.toUserResponse(any(User.class))).thenReturn(response);

        // Act & Assert
        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(userId.toString()))
            .andExpect(jsonPath("$.email").value("test@example.com"))
            .andExpect(jsonPath("$.kycTier").value("TIER_2"));
    }

    private MockHttpServletRequestBuilder login(String email, String password) throws Exception {
        return post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new LoginRequest(email, password)));
    }
}
