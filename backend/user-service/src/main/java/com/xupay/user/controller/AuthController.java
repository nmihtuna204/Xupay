package com.xupay.user.controller;

import com.xupay.user.dto.request.LoginRequest;
import com.xupay.user.dto.request.RegisterRequest;
import com.xupay.user.dto.response.AuthResponse;
import com.xupay.user.dto.response.UserResponse;
import com.xupay.user.entity.User;
import com.xupay.user.exception.InvalidCredentialsException;
import com.xupay.user.exception.UserNotFoundException;
import com.xupay.user.repository.UserRepository;
import com.xupay.user.security.AuthCookies;
import com.xupay.user.security.LoginAttemptLimiter;
import com.xupay.user.security.RequestToken;
import com.xupay.user.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * AuthController
 * REST API endpoints for authentication operations.
 * Handles user registration, login, and profile retrieval.
 *
 * Register and login return the token in the body (for scripts and API
 * clients, which send it as "Authorization: Bearer") and also set it as an
 * HttpOnly cookie, which is what the web app uses: page scripts never see it.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final AuthCookies authCookies;
    private final LoginAttemptLimiter loginAttemptLimiter;

    /**
     * Register a new user
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request received for email: {}", request.email());
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, sessionCookie(response))
                .body(response);
    }

    /**
     * Login with email and password
     * POST /api/auth/login
     * Too many recent failures for this email from this IP, or from this IP
     * altogether, answer 429 with Retry-After (see LoginAttemptLimiter).
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest) {
        log.info("Login request received for email: {}", request.email());
        String ip = httpRequest.getRemoteAddr();
        loginAttemptLimiter.checkAllowed(request.email(), ip);

        AuthResponse response;
        try {
            response = authService.login(request);
        } catch (InvalidCredentialsException e) {
            loginAttemptLimiter.recordFailure(request.email(), ip);
            throw e;
        }
        loginAttemptLimiter.recordSuccess(request.email(), ip);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sessionCookie(response))
                .body(response);
    }

    /**
     * Sign out this session
     * POST /api/auth/logout
     * Revokes the token the request carries (cookie or Bearer header) until
     * it expires, in both services; the user's other sessions are untouched.
     * Open to everyone and always 204 with the cookie cleared, so signing
     * out also works when the token has already expired.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        log.info("Logout request received");
        RequestToken.from(request).ifPresent(token -> authService.logout(token.value()));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, authCookies.clear().toString())
                .build();
    }

    /**
     * Validate JWT token
     * GET /api/auth/validate
     * Used by API Gateway to validate tokens
     */
    @GetMapping("/validate")
    public ResponseEntity<Void> validate() {
        // If this endpoint is reached, JWT filter already validated the token
        log.debug("Token validation successful");
        return ResponseEntity.ok().build();
    }

    /**
     * Get current authenticated user's profile
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            log.warn("Unauthorized access to /api/auth/me");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID userId = UUID.fromString(authentication.getName());
        log.debug("Fetching profile for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserResponse response = new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getPhone(),
            user.getKycStatus(),
            user.getKycTier(),
            user.getIsActive(),
            user.getCreatedAt().toOffsetDateTime(),
            user.getRole()
        );
        
        return ResponseEntity.ok(response);
    }

    private String sessionCookie(AuthResponse response) {
        return authCookies.issue(response.token(), response.expiresIn()).toString();
    }
}
