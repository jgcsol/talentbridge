package com.talentbridge.employer;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/employers")
@RequiredArgsConstructor
public class EmployerController {

    private final EmployerProfileService employerProfileService;
    private final CandidateSearchService candidateSearchService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<EmployerProfile> getMyProfile(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(employerProfileService.getByUserId(userId));
    }

    @PatchMapping("/me")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<EmployerProfile> updateProfile(
            @RequestBody UpdateEmployerProfileRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(employerProfileService.updateProfile(userId, request));
    }

    /**
     * Search candidates.
     * Query params:
     *   - keyword         (skill or job title keyword)
     *   - minMatchScore   (0-100, filter by AI match score — not yet persisted, future feature)
     *   - page            (0-indexed)
     *   - size            (default 20)
     */
    @GetMapping("/candidates/search")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<Page<CandidateSearchResult>> searchCandidates(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                candidateSearchService.search(keyword, PageRequest.of(page, size)));
    }

    @GetMapping("/candidates/{candidateId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<CandidateSearchResult> getCandidateProfile(
            @PathVariable UUID candidateId) {
        return ResponseEntity.ok(candidateSearchService.getById(candidateId));
    }
}
