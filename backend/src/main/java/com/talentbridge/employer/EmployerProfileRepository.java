package com.talentbridge.employer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface EmployerProfileRepository extends JpaRepository<EmployerProfile, UUID> {
    @Query("SELECT p FROM EmployerProfile p WHERE p.user.id = :userId")
    Optional<EmployerProfile> findByUserId(UUID userId);
}
