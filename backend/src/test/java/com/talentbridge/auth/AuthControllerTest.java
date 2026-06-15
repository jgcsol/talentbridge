package com.talentbridge.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(TestSecurityConfig.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean  private AuthService authService;
    @MockBean  private JwtService jwtService; // needed so JwtAuthFilter can be constructed

    private static final UUID USER_ID = UUID.randomUUID();
    private static final AuthResponse AUTH_RESPONSE =
            new AuthResponse("access", "refresh", USER_ID, "user@example.com", "CANDIDATE");

    // ─── POST /auth/register ─────────────────────────────────────────────────

    @Test
    void register_returns201_withValidRequest() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(AUTH_RESPONSE);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("user@example.com", "password123", User.Role.CANDIDATE))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("access"))
                .andExpect(jsonPath("$.role").value("CANDIDATE"));
    }

    @Test
    void register_returns400_forInvalidEmail() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\",\"password\":\"password123\",\"role\":\"CANDIDATE\"}"))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any());
    }

    @Test
    void register_returns400_forShortPassword() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"short\",\"role\":\"CANDIDATE\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_returns400_whenEmailAlreadyInUse() throws Exception {
        when(authService.register(any())).thenThrow(new IllegalArgumentException("Email already in use"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("taken@example.com", "password123", User.Role.CANDIDATE))))
                .andExpect(status().isBadRequest());
    }

    // ─── POST /auth/login ────────────────────────────────────────────────────

    @Test
    void login_returns200_withValidCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(AUTH_RESPONSE);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access"))
                .andExpect(jsonPath("$.userId").value(USER_ID.toString()));
    }

    @Test
    void login_returns401_forBadCredentials() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ─── POST /auth/forgot-password ──────────────────────────────────────────

    @Test
    void forgotPassword_returns204_always() throws Exception {
        doNothing().when(authService).forgotPassword(any());

        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void forgotPassword_returns204_forUnknownEmail() throws Exception {
        doNothing().when(authService).forgotPassword(any());

        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"unknown@example.com\"}"))
                .andExpect(status().isNoContent());
    }

    // ─── POST /auth/reset-password ───────────────────────────────────────────

    @Test
    void resetPassword_returns204_forValidToken() throws Exception {
        doNothing().when(authService).resetPassword(any(), any());

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"valid-token\",\"password\":\"newPassword123\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void resetPassword_returns400_forInvalidToken() throws Exception {
        doThrow(new IllegalArgumentException("Invalid or expired reset token"))
                .when(authService).resetPassword(any(), any());

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"bad-token\",\"password\":\"newPassword123\"}"))
                .andExpect(status().isBadRequest());
    }
}
