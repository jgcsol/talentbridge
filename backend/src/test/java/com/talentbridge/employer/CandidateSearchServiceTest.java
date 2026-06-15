package com.talentbridge.employer;

import com.talentbridge.auth.User;
import com.talentbridge.candidate.CandidateProfile;
import com.talentbridge.candidate.CandidateProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class CandidateSearchServiceTest {

    @Mock private CandidateProfileRepository profileRepository;

    @InjectMocks
    private CandidateSearchService candidateSearchService;

    private CandidateProfile buildProfile(CandidateProfile.Visibility visibility) {
        User user = User.builder()
                .email("candidate@example.com")
                .build();
        return CandidateProfile.builder()
                .id(UUID.randomUUID())
                .user(user)
                .headline("Java Developer")
                .location("Remote")
                .summary("Experienced developer")
                .skills(List.of(new CandidateProfile.Skill("Java", "Language", 3, "ADVANCED")))
                .visibility(visibility)
                .profileComplete(true)
                .build();
    }

    // ─── search ───────────────────────────────────────────────────────────────

    @Test
    void search_returnsPageOfResults() {
        CandidateProfile profile = buildProfile(CandidateProfile.Visibility.EMPLOYERS_ONLY);
        Page<CandidateProfile> page = new PageImpl<>(List.of(profile));
        when(profileRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(page);

        Page<CandidateSearchResult> results =
                candidateSearchService.search("Java", PageRequest.of(0, 20));

        assertThat(results.getContent()).hasSize(1);
        assertThat(results.getContent().get(0).headline()).isEqualTo("Java Developer");
    }

    @Test
    void search_withNullKeyword_returnsResults() {
        Page<CandidateProfile> page = new PageImpl<>(List.of());
        when(profileRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(page);

        Page<CandidateSearchResult> results =
                candidateSearchService.search(null, PageRequest.of(0, 20));

        assertThat(results.getContent()).isEmpty();
    }

    // ─── getById ─────────────────────────────────────────────────────────────

    @Test
    void getById_returnsResult_forPublicProfile() {
        UUID profileId = UUID.randomUUID();
        CandidateProfile profile = buildProfile(CandidateProfile.Visibility.PUBLIC);
        when(profileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        CandidateSearchResult result = candidateSearchService.getById(profileId);

        assertThat(result.headline()).isEqualTo("Java Developer");
        assertThat(result.email()).isEqualTo("candidate@example.com"); // PUBLIC exposes email
    }

    @Test
    void getById_returnsResult_forEmployersOnlyProfile() {
        UUID profileId = UUID.randomUUID();
        CandidateProfile profile = buildProfile(CandidateProfile.Visibility.EMPLOYERS_ONLY);
        when(profileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        CandidateSearchResult result = candidateSearchService.getById(profileId);

        assertThat(result).isNotNull();
        assertThat(result.email()).isNull(); // Not PUBLIC so email not exposed
    }

    @Test
    void getById_throws_forPrivateProfile() {
        UUID profileId = UUID.randomUUID();
        CandidateProfile profile = buildProfile(CandidateProfile.Visibility.PRIVATE);
        when(profileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> candidateSearchService.getById(profileId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("private");
    }

    @Test
    void getById_throws_forUnknownId() {
        UUID profileId = UUID.randomUUID();
        when(profileRepository.findById(profileId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidateSearchService.getById(profileId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not found");
    }

    // ─── email visibility ─────────────────────────────────────────────────────

    @Test
    void search_exposesEmail_forPublicProfile() {
        CandidateProfile profile = buildProfile(CandidateProfile.Visibility.PUBLIC);
        // Set a user with email on the profile
        com.talentbridge.auth.User user = com.talentbridge.auth.User.builder()
                .id(UUID.randomUUID()).email("candidate@example.com")
                .role(com.talentbridge.auth.User.Role.CANDIDATE).build();
        profile.setUser(user);

        Page<CandidateProfile> page = new PageImpl<>(List.of(profile));
        when(profileRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(page);

        Page<CandidateSearchResult> results =
                candidateSearchService.search(null, PageRequest.of(0, 20));

        assertThat(results.getContent().get(0).email()).isEqualTo("candidate@example.com");
    }
}
