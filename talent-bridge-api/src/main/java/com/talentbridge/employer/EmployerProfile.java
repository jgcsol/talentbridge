package com.talentbridge.employer;

import com.talentbridge.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "employer_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String companyName;
    private String industry;
    private String companySize;
    private String website;
    private String description;
    private String location;

    @UpdateTimestamp
    private Instant updatedAt;
}
