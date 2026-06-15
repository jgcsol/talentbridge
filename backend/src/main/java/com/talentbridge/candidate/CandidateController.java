package com.talentbridge.candidate;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/candidates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CANDIDATE')")  // Fix #12: restrict all endpoints to candidates
public class CandidateController {

    private final CandidateProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<CandidateProfile> getMyProfile(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(profileService.getByUserId(userId));
    }

    @PatchMapping("/me")
    public ResponseEntity<CandidateProfile> updateProfile(
            @RequestBody UpdateProfileRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(profileService.updateProfile(userId, request));
    }

    @PostMapping("/me/resume")
    public ResponseEntity<CandidateProfile> uploadResume(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(profileService.uploadAndParseResume(userId, file));
    }
}
