package com.talentbridge.candidate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, UUID>,
        JpaSpecificationExecutor<CandidateProfile> {

    @Query("SELECT p FROM CandidateProfile p WHERE p.user.id = :userId")
    Optional<CandidateProfile> findByUserId(UUID userId);
}
