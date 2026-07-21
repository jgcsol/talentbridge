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
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Value("${app.aws.ses.from-email}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.reset-password.expiration-minutes:30}")
    private int resetTokenExpirationMinutes;

    @Value("${app.branding.jgc-logo-url}")
    private String jgcLogoUrl;

    @Value("${app.branding.talentbridge-logo-url}")
    private String talentBridgeLogoUrl;
    
    

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userService.existByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use");
        }


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

    private String createVerificationToken(User user) {
        String rawToken = UUID.randomUUID().toString();
        String hashedToken = hashToken(rawToken);
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .token(hashedToken)
                .user(user)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .build();
        emailVerificationTokenRepository.save(verificationToken);
        return rawToken;
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
    }private void sendVerificationEmail(String toEmail, String token) {
        String verificationLink = frontendUrl + "/verify-email?token=" + token;
        String body = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Verify your TalentBridge account</title>
                </head>
                <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:'Segoe UI', Arial, sans-serif;">

                  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
                    You're one click away from smarter job matching with TalentBridge.
                  </div>

                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:32px 0;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">

                          <tr>
                            <td style="background-color:#101828; padding:24px 32px;">
                              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td align="left">
                                    <img src="%s" alt="JGC Solutions" height="32" style="display:block; border:0;">
                                  </td>
                                  <td align="right">
                                    <img src="%s" alt="TalentBridge" height="32" style="display:block; border:0;">
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:40px 32px 24px 32px;">
                              <h1 style="margin:0 0 16px 0; font-size:22px; color:#101828;">Welcome to TalentBridge 👋</h1>
                              <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#344054;">
                                You've just joined a platform built to close the gap between talent and opportunity.
                                TalentBridge uses AI to read your resume, understand your real skills, and match you
                                to job titles and employers actively looking for what you offer — no more guessing
                                which roles fit, or scrolling through hundreds of irrelevant listings.
                              </p>
                              <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#344055;">
                                Whether you're a candidate looking for your next role or an employer looking for
                                the right hire, TalentBridge is designed to make that connection faster and smarter.
                              </p>
                              <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#344055;">
                                Let's get your account activated so you can start exploring.
                              </p>

                              <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td align="center" style="border-radius:6px; background-color:#2970ff;">
                                    <a href="%s" target="_blank" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:6px;">
                                      Verify My Email
                                    </a>
                                  </td>
                                </tr>
                              </table>

                              <p style="margin:24px 0 0 0; font-size:13px; line-height:1.6; color:#667085;">
                                This link will expire in %d minutes. If the button above doesn't work, copy and paste
                                this URL into your browser:<br>
                                <a href="%s" style="color:#2970ff; word-break:break-all;">%s</a>
                              </p>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:0 32px;">
                              <hr style="border:none; border-top:1px solid #eaecf0; margin:0;">
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:24px 32px 32px 32px;">
                              <p style="margin:0 0 8px 0; font-size:12px; line-height:1.6; color:#98a2b3;">
                                If you did not create a TalentBridge account, you can safely ignore this email —
                                no account will be activated.
                              </p>
                              <p style="margin:0; font-size:12px; line-height:1.6; color:#98a2b3;">
                                &copy; %d JGC Solutions · TalentBridge
                              </p>
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>

                </body>
                </html>
                """.formatted(
                        jgcLogoUrl,
                        talentBridgeLogoUrl,
                        verificationLink,
                        java.time.Year.now().getValue()
                );

        try {
            sesClient.sendEmail(SendEmailRequest.builder()
                    .source(fromEmail)
                    .destination(Destination.builder().toAddresses(toEmail).build())
                    .message(Message.builder()
                            .subject(Content.builder().data("Verify your TalentBridge email").charset("UTF-8").build())
                            .body(Body.builder()
                                    .html(Content.builder().data(body).charset("UTF-8").build())
                                    .build())
                            .build())
                    .build());
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Transactional
    public void verifyEmail(String token) {
        String hashedToken = hashToken(token);
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(hashedToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token"));

        if (verificationToken.isUsed()) {
            throw new IllegalArgumentException("Verification token has already been used");
        }
        if (Instant.now().isAfter(verificationToken.getExpiresAt())) {
            throw new IllegalArgumentException("Verification token has expired");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userService.save(user);

        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        userService.findByEmail(email.toLowerCase()).ifPresent(user -> {
            if (user.isEmailVerified()) {
                return;
            }
            emailVerificationTokenRepository.deleteAllByUserId(user.getId());
            sendVerificationEmail(user.getEmail(), createVerificationToken(user));
        });
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, refreshToken, user.getId(), user.getEmail(), user.getRole().name());
    }


}
