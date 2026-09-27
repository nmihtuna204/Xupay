package com.xupay.user.config;

import com.xupay.user.entity.User;
import com.xupay.user.entity.enums.UserRole;
import com.xupay.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * AdminBootstrap
 * Makes sure one KYC reviewer exists, so documents can actually be approved.
 *
 * Driven by two settings (env XUPAY_ADMIN_EMAIL / XUPAY_ADMIN_PASSWORD):
 *  - email set, account exists  -> that account is promoted to ADMIN
 *  - email + password set, none -> an ADMIN account is created
 *  - email unset                -> nothing happens (production default)
 *
 * It never demotes anyone and never changes an existing password.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${xupay.admin.email:}")
    private String adminEmail;

    @Value("${xupay.admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank()) {
            return;
        }
        String email = adminEmail.trim().toLowerCase();

        userRepository.findByEmail(email).ifPresentOrElse(user -> {
            if (user.getRole() != UserRole.ADMIN) {
                user.setRole(UserRole.ADMIN);
                userRepository.save(user);
                log.info("Promoted {} to ADMIN", email);
            }
        }, () -> {
            if (adminPassword == null || adminPassword.length() < 8) {
                log.warn("xupay.admin.email is set but no account exists and xupay.admin.password is missing "
                        + "or shorter than 8 characters; no admin was created");
                return;
            }
            userRepository.save(User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .firstName("XuPay")
                    .lastName("Admin")
                    .role(UserRole.ADMIN)
                    .build());
            log.info("Created ADMIN account {}", email);
        });
    }
}
