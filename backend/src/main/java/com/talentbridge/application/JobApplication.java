package com.talentbridge.application;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.talentbridge.candidate.CandidateProfile;
import com.talentbridge.employer.JobPosting;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "applications",
    uniqueConstraints = @UniqueConstraint(columnNames = {"job_posting_id", "candidate_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private CandidateProfile candidate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.APPLIED;

    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    @CreationTimestamp
    private Instant appliedAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public enum Status {
        APPLIED, REVIEWING, SHORTLISTED, REJECTED, OFFER_EXTENDED, WITHDRAWN
    }
}
