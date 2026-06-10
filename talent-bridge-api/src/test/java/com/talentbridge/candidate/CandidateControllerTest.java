package com.talentbridge.candidate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentbridge.auth.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CandidateController.class)
@Import(TestSecurityConfig.class)
class CandidateControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean  private CandidateProfileService profileService;
    @MockBean  private com.talentbridge.auth.JwtService jwtService; // needed so JwtAuthFilter can be constructed

    private static final UUID USER_ID = UUID.randomUUID();

    private static UsernamePasswordAuthenticationToken candidateAuth() {
        return new UsernamePasswordAuthenticationToken(
                USER_ID, null,
                List.of(new SimpleGrantedAuthority("ROLE_CANDIDATE")));
    }

    private static CandidateProfile sampleProfile() {
        return CandidateProfile.builder()
                .id(UUID.randomUUID())
                .headline("Software Engineer")
                .location("New York")
                .visibility(CandidateProfile.Visibility.EMPLOYERS_ONLY)
                .profileComplete(true)
                .build();
    }

    // ─── GET /candidates/me ───────────────────────────────────────────────────

    @Test
    void getMyProfile_returns200_withProfile() throws Exception {
        CandidateProfile profile = sampleProfile();
        when(profileService.getByUserId(USER_ID)).thenReturn(profile);

        mockMvc.perform(get("/candidates/me")
                        .with(authentication(candidateAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("Software Engineer"));
    }

    @Test
    void getMyProfile_returns404_whenProfileNotFound() throws Exception {
        when(profileService.getByUserId(any())).thenThrow(new IllegalStateException("Candidate profile not found"));

        mockMvc.perform(get("/candidates/me")
                        .with(authentication(candidateAuth())))
                .andExpect(status().isNotFound());
    }

    // ─── PATCH /candidates/me ─────────────────────────────────────────────────

    @Test
    void updateProfile_returns200_withUpdatedProfile() throws Exception {
        CandidateProfile profile = sampleProfile();
        when(profileService.updateProfile(eq(USER_ID), any(UpdateProfileRequest.class))).thenReturn(profile);

        String body = "{\"headline\":\"Senior Software Engineer\"}";

        mockMvc.perform(patch("/candidates/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .with(authentication(candidateAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("Software Engineer"));

        verify(profileService).updateProfile(eq(USER_ID), any(UpdateProfileRequest.class));
    }
}
