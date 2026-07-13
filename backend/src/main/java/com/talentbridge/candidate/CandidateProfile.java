package com.talentbridge.candidate;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.talentbridge.user.User;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "candidate_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String headline;
    private String location;
    private String summary;
    @Column(name = "resume_s3_key")
    private String resumeS3Key;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Visibility visibility = Visibility.EMPLOYERS_ONLY;

    // Stored as JSONB for flexibility
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Skill> skills;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Experience> experiences;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Education> educations;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Certification> certifications;

    @Builder.Default
    private boolean profileComplete = false;

    @UpdateTimestamp
    private Instant updatedAt;

    public enum Visibility {
        PUBLIC, EMPLOYERS_ONLY, PRIVATE
    }

    // Embedded value types
    public record Skill(String name, String category, Integer yearsExperience, String proficiency) {}

    public record Experience(String title, String company, String startDate, String endDate,
                             String description, boolean current) {}

    public record Education(String degree, String field, String institution, Integer year) {}

    public record Certification(String name, String issuer, Integer year) {}
}
