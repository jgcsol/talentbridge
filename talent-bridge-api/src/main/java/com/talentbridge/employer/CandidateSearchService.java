package com.talentbridge.employer;

import com.talentbridge.candidate.CandidateProfile;
import com.talentbridge.candidate.CandidateProfileRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CandidateSearchService {

    private final CandidateProfileRepository profileRepository;

    public Page<CandidateSearchResult> search(String keyword, Pageable pageable) {
        Specification<CandidateProfile> spec = buildSpec(keyword);
        return profileRepository.findAll(spec, pageable).map(this::toSearchResult);
    }

    public CandidateSearchResult getById(UUID candidateId) {
        CandidateProfile profile = profileRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalStateException("Candidate not found"));

        if (profile.getVisibility() == CandidateProfile.Visibility.PRIVATE) {
            throw new IllegalStateException("Candidate profile is private");
        }

        return toSearchResult(profile);
    }

    private Specification<CandidateProfile> buildSpec(String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Only show non-private profiles to employers
            predicates.add(cb.notEqual(root.get("visibility"), CandidateProfile.Visibility.PRIVATE));

            // Only show complete profiles
            predicates.add(cb.isTrue(root.get("profileComplete")));

            // Keyword search on headline (skills JSONB search handled at DB level via GIN index)
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("headline")), pattern),
                        cb.like(cb.lower(root.get("summary")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private CandidateSearchResult toSearchResult(CandidateProfile profile) {
        boolean isPublic = profile.getVisibility() == CandidateProfile.Visibility.PUBLIC;
        String email = isPublic ? profile.getUser().getEmail() : null;

        return new CandidateSearchResult(
                profile.getId(),
                profile.getHeadline(),
                profile.getLocation(),
                profile.getSummary(),
                profile.getSkills(),
                profile.getEducations(),
                profile.getVisibility(),
                email
        );
    }
}
