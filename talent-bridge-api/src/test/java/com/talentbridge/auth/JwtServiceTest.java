package com.talentbridge.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    private static final String SECRET =
            "test-secret-key-that-is-long-enough-for-hmac-sha256-algorithm-needs";
    private static final long EXPIRATION_MS = 3_600_000L;         // 1 hour
    private static final long REFRESH_EXPIRATION_MS = 86_400_000L; // 24 hours

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS, REFRESH_EXPIRATION_MS);
    }

    @Test
    void generateToken_producesValidToken() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateToken(userId, "user@example.com", "CANDIDATE");

        assertThat(token).isNotBlank();
        assertThat(jwtService.isValid(token)).isTrue();
    }

    @Test
    void generateRefreshToken_producesValidToken() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateRefreshToken(userId, "user@example.com", "EMPLOYER");

        assertThat(token).isNotBlank();
        assertThat(jwtService.isValid(token)).isTrue();
    }

    @Test
    void parseToken_returnsCorrectClaims() {
        UUID userId = UUID.randomUUID();
        String email = "claims@example.com";
        String role = "CANDIDATE";

        String token = jwtService.generateToken(userId, email, role);
        var claims = jwtService.parseToken(token);

        assertThat(claims.getSubject()).isEqualTo(userId.toString());
        assertThat(claims.get("email", String.class)).isEqualTo(email);
        assertThat(claims.get("role", String.class)).isEqualTo(role);
    }

    @Test
    void isValid_returnsFalse_forExpiredToken() {
        // Token that expired 1 ms ago
        JwtService shortLivedService = new JwtService(SECRET, -1L, -1L);
        UUID userId = UUID.randomUUID();
        String token = shortLivedService.generateToken(userId, "user@example.com", "CANDIDATE");

        assertThat(jwtService.isValid(token)).isFalse();
    }

    @Test
    void isValid_returnsFalse_forGarbledToken() {
        assertThat(jwtService.isValid("not.a.jwt.token")).isFalse();
    }

    @Test
    void isValid_returnsFalse_forEmptyToken() {
        assertThat(jwtService.isValid("")).isFalse();
    }

    @Test
    void isValid_returnsFalse_forTokenSignedWithDifferentKey() {
        JwtService otherService = new JwtService(
                "completely-different-secret-key-for-testing-purposes-only",
                EXPIRATION_MS, REFRESH_EXPIRATION_MS);
        String token = otherService.generateToken(UUID.randomUUID(), "x@y.com", "CANDIDATE");

        assertThat(jwtService.isValid(token)).isFalse();
    }

    @Test
    void generateToken_and_generateRefreshToken_produceDifferentTokens() {
        UUID userId = UUID.randomUUID();
        String access = jwtService.generateToken(userId, "a@b.com", "CANDIDATE");
        String refresh = jwtService.generateRefreshToken(userId, "a@b.com", "CANDIDATE");

        assertThat(access).isNotEqualTo(refresh);
    }
}
