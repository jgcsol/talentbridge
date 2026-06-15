package com.talentbridge.ai;

import com.talentbridge.candidate.CandidateProfile;
import com.talentbridge.candidate.CandidateProfileService;
import com.talentbridge.onet.OnetClient;
import com.talentbridge.onet.OnetOccupation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/gap-analysis")
@RequiredArgsConstructor
public class GapAnalysisController {

    private final GapAnalysisService gapAnalysisService;
    private final CandidateProfileService candidateProfileService;
    private final OnetClient onetClient;
    private final GapAnalysisRepository gapAnalysisRepository;

    /**
     * Run (or re-run) a gap analysis for the authenticated candidate.
     * POST /api/gap-analysis?occupationCode=15-1252.00
     */
    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<GapAnalysis> analyze(
            @RequestParam String occupationCode,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        CandidateProfile profile = candidateProfileService.getByUserId(userId);
        OnetOccupation occupation = onetClient.getOccupation(occupationCode);

        GapAnalysis saved = gapAnalysisService.analyzeAndSave(profile, occupation);
        return ResponseEntity.ok(saved);
    }

    /**
     * Get all past gap analyses for the authenticated candidate.
     * GET /api/gap-analysis/history
     */
    @GetMapping("/history")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<List<GapAnalysis>> getHistory(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        CandidateProfile profile = candidateProfileService.getByUserId(userId);
        return ResponseEntity.ok(gapAnalysisRepository.findByCandidateId(profile.getId()));
    }
}
