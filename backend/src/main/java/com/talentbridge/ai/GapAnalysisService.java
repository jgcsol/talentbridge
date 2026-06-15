package com.talentbridge.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentbridge.candidate.CandidateProfile;
import com.talentbridge.onet.OnetOccupation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GapAnalysisService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final GapAnalysisRepository gapAnalysisRepository;

    private static final String SYSTEM_PROMPT = """
            You are a career intelligence engine. Compare a candidate's profile to a job role's requirements.
            Return ONLY valid JSON — no markdown, no explanation — matching this exact schema:
            {
              "overallScore": number (0-100),
              "skillScore": number (0-100),
              "experienceScore": number (0-100),
              "educationScore": number (0-100),
              "strengths": [
                { "area": "string", "detail": "string" }
              ],
              "gaps": [
                { "area": "string", "detail": "string", "severity": "LOW|MEDIUM|HIGH" }
              ],
              "recommendations": [
                { "type": "TRAINING|CERTIFICATION|EXPERIENCE|EDUCATION", "title": "string", "description": "string" }
              ],
              "summary": "string (2-3 sentence overall assessment)"
            }

            Scoring rubric:
            - skillScore: % of required O*NET skills the candidate possesses (weighted by importance)
            - experienceScore: relevance and depth of work experience to the role
            - educationScore: how well education meets the role's requirements
            - overallScore: weighted average (skills 40%, experience 40%, education 20%)
            """;

    @Transactional
    public GapAnalysis analyzeAndSave(CandidateProfile candidate, OnetOccupation occupation) {
        GapAnalysisResult result = analyze(candidate, occupation);

        // Fix #6: Use deleteAndFlush() so the DELETE is sent to the DB before the INSERT,
        // preventing a unique constraint violation within the same transaction.
        gapAnalysisRepository.findByCandidateIdAndOccupationCode(candidate.getId(), occupation.code())
                .ifPresent(gapAnalysisRepository::deleteAndFlush);

        GapAnalysis entity = GapAnalysis.builder()
                .candidate(candidate)
                .occupationCode(occupation.code())
                .occupationTitle(occupation.title())
                .overallScore(result.overallScore())
                .skillScore(result.skillScore())
                .experienceScore(result.experienceScore())
                .educationScore(result.educationScore())
                .strengths(result.strengths())
                .gaps(result.gaps())
                .recommendations(result.recommendations())
                .summary(result.summary())
                .build();

        return gapAnalysisRepository.save(entity);
    }

    public GapAnalysisResult analyze(CandidateProfile candidate, OnetOccupation occupation) {
        try {
            String candidateJson = objectMapper.writeValueAsString(buildCandidateSummary(candidate));
            String occupationJson = objectMapper.writeValueAsString(occupation);

            String userMessage = """
                    CANDIDATE PROFILE:
                    %s

                    TARGET ROLE (O*NET):
                    %s

                    Analyze the gap between this candidate and this role.
                    """.formatted(candidateJson, occupationJson);

            String json = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(userMessage)
                    .call()
                    .content();

            return objectMapper.readValue(json, GapAnalysisResult.class);

        } catch (Exception e) {
            log.error("Gap analysis failed for candidate {} and occupation {}", candidate.getId(), occupation.code(), e);
            throw new RuntimeException("Gap analysis failed: " + e.getMessage(), e);
        }
    }

    private record CandidateSummary(
            String headline,
            String summary,
            Object skills,
            Object experiences,
            Object educations,
            Object certifications
    ) {}

    private CandidateSummary buildCandidateSummary(CandidateProfile profile) {
        return new CandidateSummary(
                profile.getHeadline(),
                profile.getSummary(),
                profile.getSkills(),
                profile.getExperiences(),
                profile.getEducations(),
                profile.getCertifications()
        );
    }
}
