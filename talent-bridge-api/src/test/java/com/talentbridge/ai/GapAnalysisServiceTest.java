package com.talentbridge.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentbridge.candidate.CandidateProfile;
import com.talentbridge.onet.OnetOccupation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GapAnalysisServiceTest {

    @Mock private ChatClient chatClient;
    @Mock private ObjectMapper objectMapper;
    @Mock private GapAnalysisRepository gapAnalysisRepository;

    @InjectMocks
    private GapAnalysisService gapAnalysisService;

    private CandidateProfile sampleCandidate() {
        return CandidateProfile.builder()
                .id(UUID.randomUUID())
                .headline("Java Developer")
                .skills(List.of(new CandidateProfile.Skill("Java", "Language", 3, "ADVANCED")))
                .experiences(List.of())
                .educations(List.of())
                .certifications(List.of())
                .build();
    }

    private OnetOccupation sampleOccupation() {
        return new OnetOccupation(
                "15-1252.00",
                "Software Developer",
                "Develop software applications",
                "Technology",
                List.of(),
                List.of(),
                "Bachelor's degree"
        );
    }

    private GapAnalysisResult sampleResult() {
        return new GapAnalysisResult(
                75, 80, 70, 75,
                List.of(new GapAnalysisResult.Strength("Java", "Strong Java skills")),
                List.of(new GapAnalysisResult.Gap("Cloud", "Limited cloud experience", "MEDIUM")),
                List.of(new GapAnalysisResult.Recommendation("CERTIFICATION", "AWS Certified", "Get AWS cert")),
                "Good candidate with some gaps."
        );
    }

    @Test
    void analyzeAndSave_savesNewAnalysis_whenNoPreviousExists() throws Exception {
        CandidateProfile candidate = sampleCandidate();
        OnetOccupation occupation = sampleOccupation();
        GapAnalysisResult result = sampleResult();

        // Mock the ChatClient chain
        ChatClient.ChatClientRequestSpec requestSpec = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.ChatClientRequestSpec userSpec = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.CallResponseSpec callSpec = mock(ChatClient.CallResponseSpec.class);

        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.system(any(String.class))).thenReturn(userSpec);
        when(userSpec.user(any(String.class))).thenReturn(userSpec);
        when(userSpec.call()).thenReturn(callSpec);
        when(callSpec.content()).thenReturn("{\"overallScore\":75}");

        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(objectMapper.readValue(any(String.class), eq(GapAnalysisResult.class))).thenReturn(result);
        when(gapAnalysisRepository.findByCandidateIdAndOccupationCode(any(), any()))
                .thenReturn(Optional.empty());
        when(gapAnalysisRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        GapAnalysis saved = gapAnalysisService.analyzeAndSave(candidate, occupation);

        assertThat(saved.getOverallScore()).isEqualTo(75);
        assertThat(saved.getOccupationCode()).isEqualTo("15-1252.00");
        assertThat(saved.getOccupationTitle()).isEqualTo("Software Developer");
        verify(gapAnalysisRepository, never()).delete(any());
        verify(gapAnalysisRepository).save(any(GapAnalysis.class));
    }

    @Test
    void analyzeAndSave_deletesExistingBeforeSaving_whenPreviousExists() throws Exception {
        CandidateProfile candidate = sampleCandidate();
        OnetOccupation occupation = sampleOccupation();
        GapAnalysisResult result = sampleResult();

        GapAnalysis existing = GapAnalysis.builder().id(UUID.randomUUID()).build();

        ChatClient.ChatClientRequestSpec requestSpec = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.ChatClientRequestSpec userSpec = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.CallResponseSpec callSpec = mock(ChatClient.CallResponseSpec.class);

        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.system(any(String.class))).thenReturn(userSpec);
        when(userSpec.user(any(String.class))).thenReturn(userSpec);
        when(userSpec.call()).thenReturn(callSpec);
        when(callSpec.content()).thenReturn("{}");

        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(objectMapper.readValue(any(String.class), eq(GapAnalysisResult.class))).thenReturn(result);
        when(gapAnalysisRepository.findByCandidateIdAndOccupationCode(any(), any()))
                .thenReturn(Optional.of(existing));
        when(gapAnalysisRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        gapAnalysisService.analyzeAndSave(candidate, occupation);

        verify(gapAnalysisRepository).delete(existing);
        verify(gapAnalysisRepository).save(any(GapAnalysis.class));
    }
}
