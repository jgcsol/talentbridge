package com.talentbridge.employer;

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

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmployerController.class)
@Import(TestSecurityConfig.class)
class EmployerControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean  private EmployerProfileService employerProfileService;
    @MockBean  private CandidateSearchService candidateSearchService;
    @MockBean  private com.talentbridge.auth.JwtService jwtService; // needed so JwtAuthFilter can be constructed

    private static final UUID USER_ID = UUID.randomUUID();

    private static UsernamePasswordAuthenticationToken employerAuth() {
        return new UsernamePasswordAuthenticationToken(
                USER_ID, null,
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYER")));
    }

    private static EmployerProfile sampleProfile() {
        return EmployerProfile.builder()
                .id(UUID.randomUUID())
                .companyName("Acme Corp")
                .industry("Technology")
                .build();
    }

    // ─── GET /employers/me ────────────────────────────────────────────────────

    @Test
    void getMyProfile_returns200_withProfile() throws Exception {
        EmployerProfile profile = sampleProfile();
        when(employerProfileService.getByUserId(USER_ID)).thenReturn(profile);

        mockMvc.perform(get("/employers/me")
                        .with(authentication(employerAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Acme Corp"));
    }

    // ─── PATCH /employers/me ──────────────────────────────────────────────────

    @Test
    void updateProfile_returns200() throws Exception {
        EmployerProfile profile = sampleProfile();
        when(employerProfileService.updateProfile(eq(USER_ID), any(UpdateEmployerProfileRequest.class)))
                .thenReturn(profile);

        mockMvc.perform(patch("/employers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"companyName\":\"Acme Corp\"}")
                        .with(authentication(employerAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Acme Corp"));
    }

    // ─── GET /employers/candidates/search ────────────────────────────────────

    @Test
    void searchCandidates_returns200_withResults() throws Exception {
        CandidateSearchResult result = new CandidateSearchResult(
                UUID.randomUUID(), "Java Developer", "Remote", "Great dev",
                null, null, com.talentbridge.candidate.CandidateProfile.Visibility.EMPLOYERS_ONLY, null);
        Page<CandidateSearchResult> page = new PageImpl<>(List.of(result));
        when(candidateSearchService.search(any(), any())).thenReturn(page);

        mockMvc.perform(get("/employers/candidates/search")
                        .param("keyword", "Java")
                        .with(authentication(employerAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].headline").value("Java Developer"));
    }

    @Test
    void searchCandidates_returns200_withEmptyResults() throws Exception {
        when(candidateSearchService.search(any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/employers/candidates/search")
                        .with(authentication(employerAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    // ─── GET /employers/candidates/{id} ──────────────────────────────────────

    @Test
    void getCandidateProfile_returns200() throws Exception {
        UUID candidateId = UUID.randomUUID();
        CandidateSearchResult result = new CandidateSearchResult(
                candidateId, "Java Developer", "Remote", "Great dev",
                null, null, com.talentbridge.candidate.CandidateProfile.Visibility.PUBLIC,
                "candidate@example.com");
        when(candidateSearchService.getById(candidateId)).thenReturn(result);

        mockMvc.perform(get("/employers/candidates/{id}", candidateId)
                        .with(authentication(employerAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("candidate@example.com"));
    }

    @Test
    void getCandidateProfile_returns404_forUnknownId() throws Exception {
        UUID candidateId = UUID.randomUUID();
        when(candidateSearchService.getById(candidateId))
                .thenThrow(new IllegalStateException("Candidate not found"));

        mockMvc.perform(get("/employers/candidates/{id}", candidateId)
                        .with(authentication(employerAuth())))
                .andExpect(status().isNotFound());
    }
}
