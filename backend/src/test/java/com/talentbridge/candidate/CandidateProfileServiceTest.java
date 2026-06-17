package com.talentbridge.candidate;

import com.talentbridge.auth.User;
import com.talentbridge.storage.S3Service;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateProfileServiceTest {

    @Mock private CandidateProfileRepository profileRepository;
    @Mock private S3Service s3Service;
    @Mock private ResumeParserService resumeParserService;

    @InjectMocks
    private CandidateProfileService candidateProfileService;

    // ─── createProfile ────────────────────────────────────────────────────────

    @Test
    void createProfile_savesNewProfile() {
        User user = User.builder().id(UUID.randomUUID()).email("u@example.com")
                .role(User.Role.CANDIDATE).build();
        CandidateProfile profile = CandidateProfile.builder().id(UUID.randomUUID()).user(user).build();
        when(profileRepository.save(any())).thenReturn(profile);

        CandidateProfile result = candidateProfileService.createProfile(user);

        assertThat(result).isEqualTo(profile);
        verify(profileRepository).save(any(CandidateProfile.class));
    }

    // ─── getByUserId ─────────────────────────────────────────────────────────

    @Test
    void getByUserId_returnsProfile_whenFound() {
        UUID userId = UUID.randomUUID();
        CandidateProfile profile = CandidateProfile.builder().id(UUID.randomUUID()).build();
        when(profileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));

        CandidateProfile result = candidateProfileService.getByUserId(userId);

        assertThat(result).isEqualTo(profile);
    }

    @Test
    void getByUserId_throws_whenNotFound() {
        UUID userId = UUID.randomUUID();
        when(profileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidateProfileService.getByUserId(userId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not found");
    }

    // ─── updateProfile ────────────────────────────────────────────────────────

    @Test
    void updateProfile_updatesOnlyNonNullFields() {
        UUID userId = UUID.randomUUID();
        CandidateProfile profile = CandidateProfile.builder()
                .id(UUID.randomUUID())
                .headline("Old Headline")
                .location("Old City")
                .build();
        when(profileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "New Headline", null, null, null, null, null, null, null);

        CandidateProfile updated = candidateProfileService.updateProfile(userId, request);

        assertThat(updated.getHeadline()).isEqualTo("New Headline");
        assertThat(updated.getLocation()).isEqualTo("Old City"); // unchanged
    }

    @Test
    void updateProfile_updatesAllFields_whenProvided() {
        UUID userId = UUID.randomUUID();
        CandidateProfile profile = CandidateProfile.builder().id(UUID.randomUUID()).build();
        when(profileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<CandidateProfile.Skill> skills = List.of(
                new CandidateProfile.Skill("Java", "Language", 3, "ADVANCED"));
        UpdateProfileRequest request = new UpdateProfileRequest(
                "Senior Engineer", "New York", "Great developer",
                CandidateProfile.Visibility.PUBLIC, skills, null, null, null);

        CandidateProfile updated = candidateProfileService.updateProfile(userId, request);

        assertThat(updated.getHeadline()).isEqualTo("Senior Engineer");
        assertThat(updated.getLocation()).isEqualTo("New York");
        assertThat(updated.getVisibility()).isEqualTo(CandidateProfile.Visibility.PUBLIC);
        assertThat(updated.getSkills()).hasSize(1);
    }

    // ─── uploadAndParseResume ─────────────────────────────────────────────────

    @Test
    void uploadAndParseResume_uploadsAndUpdatesProfile_whenParseSucceeds() {
        UUID userId = UUID.randomUUID();
        CandidateProfile profile = CandidateProfile.builder().id(UUID.randomUUID()).build();
        when(profileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ParsedResume parsed = new ParsedResume(
                "Software Engineer",
                "Austin, TX",
                "Experienced developer",
                List.of(new CandidateProfile.Skill("Java", "Language", 3, "ADVANCED")),
                null, null, null);
        when(resumeParserService.parse(any())).thenReturn(parsed);

        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "pdf content".getBytes());

        CandidateProfile result = candidateProfileService.uploadAndParseResume(userId, file);

        assertThat(result.getHeadline()).isEqualTo("Software Engineer");
        assertThat(result.getLocation()).isEqualTo("Austin, TX");
        assertThat(result.getSummary()).isEqualTo("Experienced developer");
        assertThat(result.getSkills()).hasSize(1);
        // Complete: has a headline AND core data (skills)
        assertThat(result.isProfileComplete()).isTrue();
        verify(s3Service).upload(eq("resumes/%s/resume.pdf".formatted(userId)), eq(file));
    }

    @Test
    void uploadAndParseResume_incomplete_whenHeadlineButNoCoreData() {
        // A lone headline (no skills, no experience) is not a complete profile.
        UUID userId = UUID.randomUUID();
        CandidateProfile profile = CandidateProfile.builder().id(UUID.randomUUID()).build();
        when(profileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ParsedResume parsed = new ParsedResume(
                "Software Engineer", null, "A summary",
                List.of(), List.of(), List.of(), List.of());
        when(resumeParserService.parse(any())).thenReturn(parsed);

        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "pdf content".getBytes());

        CandidateProfile result = candidateProfileService.uploadAndParseResume(userId, file);

        assertThat(result.getHeadline()).isEqualTo("Software Engineer");
        assertThat(result.isProfileComplete()).isFalse();
    }

    @Test
    void uploadAndParseResume_doesNotOverwriteExistingDataWithEmptyParse() {
        // A failed/empty parse must not wipe out data the user already had.
        UUID userId = UUID.randomUUID();
        CandidateProfile profile = CandidateProfile.builder()
                .id(UUID.randomUUID())
                .headline("Existing Headline")
                .location("Existing City")
                .skills(List.of(new CandidateProfile.Skill("Java", "Language", 3, "ADVANCED")))
                .build();
        when(profileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ParsedResume emptyParsed = new ParsedResume(null, null, null, List.of(), List.of(), List.of(), List.of());
        when(resumeParserService.parse(any())).thenReturn(emptyParsed);

        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "pdf content".getBytes());

        CandidateProfile result = candidateProfileService.uploadAndParseResume(userId, file);

        assertThat(result.getHeadline()).isEqualTo("Existing Headline");
        assertThat(result.getLocation()).isEqualTo("Existing City");
        assertThat(result.getSkills()).hasSize(1);
    }

    @Test
    void uploadAndParseResume_leavesProfileIncomplete_whenParseFails() {
        // Fix #9: When Tika/AI fails, the parser returns an empty ParsedResume (null headline).
        // The service must NOT mark profileComplete=true in this case.
        UUID userId = UUID.randomUUID();
        CandidateProfile profile = CandidateProfile.builder().id(UUID.randomUUID()).build();
        when(profileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Simulate failed parse — emptyParsedResume() returns null headline
        ParsedResume emptyParsed = new ParsedResume(null, null, null, List.of(), List.of(), List.of(), List.of());
        when(resumeParserService.parse(any())).thenReturn(emptyParsed);

        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "pdf content".getBytes());

        CandidateProfile result = candidateProfileService.uploadAndParseResume(userId, file);

        assertThat(result.getHeadline()).isNull();
        assertThat(result.isProfileComplete()).isFalse();
        // S3 upload should still have happened
        verify(s3Service).upload(any(), eq(file));
    }
}
