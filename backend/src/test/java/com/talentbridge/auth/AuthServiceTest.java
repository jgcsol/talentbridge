package com.talentbridge.auth;

import com.talentbridge.auth.AuthDTOs.AuthResponse;
import com.talentbridge.auth.AuthDTOs.LoginRequest;
import com.talentbridge.auth.AuthDTOs.RegisterRequest;
import com.talentbridge.candidate.CandidateProfileService;
import com.talentbridge.employer.EmployerProfileService;
import com.talentbridge.user.User;
import com.talentbridge.user.UserService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.ses.SesClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserService userService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private CandidateProfileService candidateProfileService;
    @Mock private EmployerProfileService employerProfileService;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private SesClient sesClient;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "fromEmail", "noreply@test.com");
        ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(authService, "resetTokenExpirationMinutes", 30);
    }

    // Helper — mirrors AuthService.hashToken() so tests can pre-hash tokens for mocking
    private static String sha256(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ─── register ────────────────────────────────────────────────────────────

    @Test
    void register_candidate_createsUserAndProfile() {
        var request = new RegisterRequest("new@example.com", "password123", User.Role.CANDIDATE);
        when(userService.existByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");

        User savedUser = User.builder()
                .id(UUID.randomUUID())
                .email("new@example.com")
                .passwordHash("hashed")
                .role(User.Role.CANDIDATE)
                .build();
        when(userService.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any(), any(), any())).thenReturn("refresh-token");

        AuthResponse response = authService.register(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.role()).isEqualTo("CANDIDATE");
        verify(candidateProfileService).createProfile(savedUser);
        verify(employerProfileService, never()).createProfile(any());
    }

    @Test
    void register_employer_createsEmployerProfile() {
        var request = new RegisterRequest("employer@example.com", "password123", User.Role.EMPLOYER);
        when(userService.existByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        User savedUser = User.builder()
                .id(UUID.randomUUID())
                .email("employer@example.com")
                .passwordHash("hashed")
                .role(User.Role.EMPLOYER)
                .build();
        when(userService.save(any())).thenReturn(savedUser);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("access");
        when(jwtService.generateRefreshToken(any(), any(), any())).thenReturn("refresh");

        authService.register(request);

        verify(employerProfileService).createProfile(savedUser);
        verify(candidateProfileService, never()).createProfile(any());
    }

    @Test
    void register_throwsIllegalArgument_whenEmailAlreadyInUse() {
        var request = new RegisterRequest("taken@example.com", "password123", User.Role.CANDIDATE);
        when(userService.existByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already in use");
    }

    // ─── login ───────────────────────────────────────────────────────────────

    @Test
    void login_returnsTokens_forValidCredentials() {
        var request = new LoginRequest("user@example.com", "password123");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .passwordHash("hashed")
                .role(User.Role.CANDIDATE)
                .active(true)
                .build();

        when(userService.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any(), any(), any())).thenReturn("refresh-token");

        AuthResponse response = authService.login(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.email()).isEqualTo("user@example.com");
    }

    @Test
    void login_throws_forUnknownEmail() {
        when(userService.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@example.com", "pw")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_throws_forWrongPassword() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .passwordHash("hashed")
                .role(User.Role.CANDIDATE)
                .active(true)
                .build();
        when(userService.findByEmail(any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "wrong")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_throws_forInactiveAccount() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .passwordHash("hashed")
                .role(User.Role.CANDIDATE)
                .active(false)
                .build();
        when(userService.findByEmail(any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "password")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("disabled");
    }

    // ─── forgotPassword ──────────────────────────────────────────────────────

    @Test
    void forgotPassword_doesNotThrow_forUnknownEmail() {
        when(userService.findByEmail(any())).thenReturn(Optional.empty());

        assertThatCode(() -> authService.forgotPassword("nobody@example.com"))
                .doesNotThrowAnyException();

        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void forgotPassword_savesResetToken_forKnownEmail() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email("user@example.com")
                .role(User.Role.CANDIDATE).build();

        when(userService.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.forgotPassword("user@example.com");

        verify(passwordResetTokenRepository).deleteAllByUserId(userId);
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void forgotPassword_storesHashedToken_notRawToken() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email("user@example.com")
                .role(User.Role.CANDIDATE).build();

        when(userService.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        var tokenCaptor = org.mockito.ArgumentCaptor.forClass(PasswordResetToken.class);
        when(passwordResetTokenRepository.save(tokenCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        authService.forgotPassword("user@example.com");

        PasswordResetToken saved = tokenCaptor.getValue();
        // The stored token must be a 64-char SHA-256 hex string, not a raw UUID
        assertThat(saved.getToken()).hasSize(64);
        assertThat(saved.getToken()).matches("[0-9a-f]{64}");
    }

    // ─── resetPassword ────────────────────────────────────────────────────────

    @Test
    void resetPassword_updatesPassword_forValidToken() {
        // The service hashes the raw token before lookup, so we stub with the hash
        String rawToken = "valid-raw-token";
        String hashedToken = sha256(rawToken);

        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email("user@example.com")
                .role(User.Role.CANDIDATE).passwordHash("old-hash").build();
        PasswordResetToken token = PasswordResetToken.builder()
                .token(hashedToken)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(300))
                .used(false)
                .build();

        when(passwordResetTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newPassword")).thenReturn("new-hash");
        when(userService.save(any())).thenReturn(user);
        when(passwordResetTokenRepository.save(any())).thenReturn(token);

        authService.resetPassword(rawToken, "newPassword");

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        assertThat(token.isUsed()).isTrue();
    }

    @Test
    void resetPassword_throws_forUsedToken() {
        String rawToken = "used-raw-token";
        String hashedToken = sha256(rawToken);

        PasswordResetToken token = PasswordResetToken.builder()
                .token(hashedToken)
                .user(User.builder().id(UUID.randomUUID()).build())
                .expiresAt(Instant.now().plusSeconds(300))
                .used(true)
                .build();

        when(passwordResetTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.resetPassword(rawToken, "newPassword"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    void resetPassword_throws_forExpiredToken() {
        String rawToken = "expired-raw-token";
        String hashedToken = sha256(rawToken);

        PasswordResetToken token = PasswordResetToken.builder()
                .token(hashedToken)
                .user(User.builder().id(UUID.randomUUID()).build())
                .expiresAt(Instant.now().minusSeconds(1))
                .used(false)
                .build();

        when(passwordResetTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.resetPassword(rawToken, "newPassword"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void resetPassword_throws_forUnknownToken() {
        String rawToken = "unknown-token";
        String hashedToken = sha256(rawToken);

        when(passwordResetTokenRepository.findByToken(hashedToken)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword(rawToken, "newPassword"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired");
    }
}
