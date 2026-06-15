package com.talentbridge.ai;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.talentbridge.application.Application;
import com.talentbridge.candidate.CandidateProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "gap_analyses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GapAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private CandidateProfile candidate;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private Application application;

    @Column(nullable = false)
    private String occupationCode;

    private String occupationTitle;

    private int overallScore;
    private int skillScore;
    private int experienceScore;
    private int educationScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<GapAnalysisResult.Strength> strengths;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<GapAnalysisResult.Gap> gaps;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<GapAnalysisResult.Recommendation> recommendations;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false)
    private Instant generatedAt = Instant.now();
}
