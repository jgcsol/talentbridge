package com.talentbridge.auth;

import com.talentbridge.auth.AuthDTOs.AuthResponse;
import com.talentbridge.auth.AuthDTOs.LoginRequest;
import com.talentbridge.auth.AuthDTOs.RegisterRequest;
import com.talentbridge.candidate.CandidateProfileService;
import com.talentbridge.employer.EmployerProfileService;
import com.talentbridge.user.User;
import com.talentbridge.user.UserService;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CandidateProfileService candidateProfileService;
    private final EmployerProfileService employerProfileService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SesClient sesClient;

    @Value("${app.aws.ses.from-email}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.reset-password.expiration-minutes:30}")
    private int resetTokenExpirationMinutes;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userService.existByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use");
        }

        // Fix #8: Restrict self-registration to CANDIDATE or EMPLOYER only
        if (request.role() != User.Role.CANDIDATE && request.role() != User.Role.EMPLOYER) {
            throw new IllegalArgumentException("Invalid role for registration");
        }

        User user = User.builder()
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(request.role())
                .build();

        user = userService.save(user);

        if (user.getRole() == User.Role.CANDIDATE) {
            candidateProfileService.createProfile(user);
        } else {
            employerProfileService.createProfile(user);
        }

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userService.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is disabled");
        }

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isValid(refreshToken)) {
            throw new BadCredentialsException("Invalid refresh token");
        }
        Claims claims = jwtService.parseToken(refreshToken);
        UUID userId = UUID.fromString(claims.getSubject());
        User user = userService.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        return buildAuthResponse(user);
    }

    @Transactional
    public void forgotPassword(String email) {
        // Always return silently — never reveal whether the email exists
        userService.findByEmail(email.toLowerCase()).ifPresent(user -> {
            passwordResetTokenRepository.deleteAllByUserId(user.getId());

            // Fix #11: Hash the token before storing so a DB breach doesn't expose active tokens
            String rawToken = UUID.randomUUID().toString();
            String hashedToken = hashToken(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(hashedToken)
                    .user(user)
                    .expiresAt(Instant.now().plus(resetTokenExpirationMinutes, ChronoUnit.MINUTES))
                    .build();
            passwordResetTokenRepository.save(resetToken);

            // Send the raw token in the email; store only the hash
            sendResetEmail(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Fix #11: Look up by hashed token
        String hashedToken = hashToken(token);
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(hashedToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Reset token has already been used");
        }
        if (Instant.now().isAfter(resetToken.getExpiresAt())) {
            throw new IllegalArgumentException("Reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userService.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    // Fix #11: SHA-256 hash of the raw token for safe storage
    private String hashToken(String rawToken) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private void sendResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String body = """
                <p>You requested a password reset for your TalentBridge account.</p>
                <p>Click the link below to reset your password. This link expires in %d minutes.</p>
                <p><a href="%s">Reset my password</a></p>
                <p>If you did not request this, you can safely ignore this email.</p>
                """.formatted(resetTokenExpirationMinutes, resetLink);

        try {
            sesClient.sendEmail(SendEmailRequest.builder()
                    .source(fromEmail)
                    .destination(Destination.builder().toAddresses(toEmail).build())
                    .message(Message.builder()
                            .subject(Content.builder().data("Reset your TalentBridge password").charset("UTF-8").build())
                            .body(Body.builder()
                                    .html(Content.builder().data(body).charset("UTF-8").build())
                                    .build())
                            .build())
                    .build());
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            // Don't rethrow — caller must not know whether email was sent
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, refreshToken, user.getId(), user.getEmail(), user.getRole().name());
    }
}
