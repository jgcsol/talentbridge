package com.talentbridge.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GapAnalysisRepository extends JpaRepository<GapAnalysis, UUID> {

    @Query("SELECT g FROM GapAnalysis g WHERE g.candidate.id = :candidateId ORDER BY g.generatedAt DESC")
    List<GapAnalysis> findByCandidateId(UUID candidateId);

    @Query("SELECT g FROM GapAnalysis g WHERE g.candidate.id = :candidateId AND g.occupationCode = :code")
    Optional<GapAnalysis> findByCandidateIdAndOccupationCode(UUID candidateId, String code);
}
