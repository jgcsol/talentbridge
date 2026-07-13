package com.talentbridge.ai;

import com.talentbridge.candidate.CandidateProfile;
import com.talentbridge.candidate.CandidateProfileRepository;
import com.talentbridge.user.User;
import com.talentbridge.user.UserRepository;

import org.junit.jupiter.api.Test;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test that actually persists a {@link GapAnalysis} through the JPA layer
 * against the in-memory H2 database. Unlike the mocked service tests, this exercises the
 * real entity mapping — which is what catches bugs like a null @CreationTimestamp field
 * violating a NOT NULL column on insert.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GapAnalysisPersistenceTest {

    @PersistenceContext private EntityManager em;
    @Autowired private UserRepository userRepository;
    @Autowired private CandidateProfileRepository profileRepository;
    @Autowired private GapAnalysisRepository gapAnalysisRepository;

    private CandidateProfile persistedCandidate() {
        User user = userRepository.save(User.builder()
                .email("it-" + UUID.randomUUID() + "@example.com")
                .passwordHash("hash")
                .role(User.Role.CANDIDATE)
                .build());

        return profileRepository.save(CandidateProfile.builder()
                .user(user)
                .headline("Java Developer")
                .skills(List.of(new CandidateProfile.Skill("Java", "Language", 3, "ADVANCED")))
                .build());
    }

    private GapAnalysis buildAnalysis(CandidateProfile candidate, String occupationCode) {
        return GapAnalysis.builder()
                .candidate(candidate)
                .occupationCode(occupationCode)
                .occupationTitle("Software Developer")
                .overallScore(80)
                .skillScore(85)
                .experienceScore(75)
                .educationScore(70)
                .strengths(List.of(new GapAnalysisResult.Strength("Java", "Strong Java skills")))
                .gaps(List.of(new GapAnalysisResult.Gap("Cloud", "Limited cloud experience", "MEDIUM")))
                .recommendations(List.of(
                        new GapAnalysisResult.Recommendation("CERTIFICATION", "AWS Certified", "Get AWS cert")))
                .summary("Good candidate with some gaps.")
                .build();
    }

    @Test
    void persistsGapAnalysis_andAutoStampsGeneratedAt() {
        CandidateProfile candidate = persistedCandidate();
        Instant before = Instant.now();

        GapAnalysis saved = gapAnalysisRepository.saveAndFlush(buildAnalysis(candidate, "15-1252.00"));
        em.clear(); // force a real DB read, not the persistence-context cache

        GapAnalysis reloaded = gapAnalysisRepository.findById(saved.getId()).orElseThrow();

        // The bug this test guards: generatedAt must be auto-populated (NOT NULL column).
        assertThat(reloaded.getGeneratedAt()).isNotNull();
        assertThat(reloaded.getGeneratedAt()).isAfterOrEqualTo(before.minusSeconds(1));

        // JSONB round-trips correctly.
        assertThat(reloaded.getOverallScore()).isEqualTo(80);
        assertThat(reloaded.getStrengths()).hasSize(1);
        assertThat(reloaded.getStrengths().get(0).area()).isEqualTo("Java");
        assertThat(reloaded.getGaps().get(0).severity()).isEqualTo("MEDIUM");
        assertThat(reloaded.getRecommendations().get(0).type()).isEqualTo("CERTIFICATION");
    }

    @Test
    void findByCandidateId_returnsAnalysesNewestFirst() throws InterruptedException {
        CandidateProfile candidate = persistedCandidate();

        GapAnalysis first = gapAnalysisRepository.saveAndFlush(buildAnalysis(candidate, "15-1252.00"));
        Thread.sleep(10); // ensure distinct generatedAt timestamps
        GapAnalysis second = gapAnalysisRepository.saveAndFlush(buildAnalysis(candidate, "15-1253.00"));
        em.clear();

        List<GapAnalysis> history = gapAnalysisRepository.findByCandidateId(candidate.getId());

        assertThat(history).hasSize(2);
        // ORDER BY generatedAt DESC — newest first
        assertThat(history.get(0).getId()).isEqualTo(second.getId());
        assertThat(history.get(1).getId()).isEqualTo(first.getId());
    }
}
