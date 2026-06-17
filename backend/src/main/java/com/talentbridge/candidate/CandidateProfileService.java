package com.talentbridge.candidate;

import com.talentbridge.auth.User;
import com.talentbridge.storage.S3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateProfileService {

    private final CandidateProfileRepository profileRepository;
    private final S3Service s3Service;
    private final ResumeParserService resumeParserService;

    @Transactional
    public CandidateProfile createProfile(User user) {
        CandidateProfile profile = CandidateProfile.builder()
                .user(user)
                .build();
        return profileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public CandidateProfile getByUserId(UUID userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Candidate profile not found"));
    }

    @Transactional
    public CandidateProfile uploadAndParseResume(UUID userId, MultipartFile file) {
        CandidateProfile profile = getByUserId(userId);

        // Upload to S3
        String s3Key = "resumes/%s/%s".formatted(userId, file.getOriginalFilename());
        s3Service.upload(s3Key, file);
        profile.setResumeS3Key(s3Key);

        // Extract text and parse with AI
        ParsedResume parsed = resumeParserService.parse(file);

        // Only overwrite a field when the parse actually produced data for it, so a
        // partial/failed parse never wipes out information the user already entered.
        if (parsed.headline() != null) profile.setHeadline(parsed.headline());
        if (parsed.location() != null) profile.setLocation(parsed.location());
        if (parsed.summary() != null) profile.setSummary(parsed.summary());
        if (isNotEmpty(parsed.skills())) profile.setSkills(parsed.skills());
        if (isNotEmpty(parsed.experiences())) profile.setExperiences(parsed.experiences());
        if (isNotEmpty(parsed.educations())) profile.setEducations(parsed.educations());
        if (isNotEmpty(parsed.certifications())) profile.setCertifications(parsed.certifications());

        // A profile is "complete" when the resume yielded the core of a profile: a headline
        // plus at least one of skills or experience. A lone headline is not a profile.
        boolean hasHeadline = profile.getHeadline() != null;
        boolean hasCoreData = isNotEmpty(profile.getSkills()) || isNotEmpty(profile.getExperiences());
        boolean profileComplete = hasHeadline && hasCoreData;
        profile.setProfileComplete(profileComplete);

        if (profileComplete) {
            log.info("Resume parsed and profile updated for user {}", userId);
        } else {
            log.warn("Resume uploaded for user {} but parsing produced insufficient data — "
                    + "profile marked incomplete", userId);
        }

        return profileRepository.save(profile);
    }

    private static boolean isNotEmpty(java.util.List<?> list) {
        return list != null && !list.isEmpty();
    }

    @Transactional
    public CandidateProfile updateProfile(UUID userId, UpdateProfileRequest request) {
        CandidateProfile profile = getByUserId(userId);

        if (request.headline() != null) profile.setHeadline(request.headline());
        if (request.location() != null) profile.setLocation(request.location());
        if (request.summary() != null) profile.setSummary(request.summary());
        if (request.visibility() != null) profile.setVisibility(request.visibility());
        if (request.skills() != null) profile.setSkills(request.skills());
        if (request.experiences() != null) profile.setExperiences(request.experiences());
        if (request.educations() != null) profile.setEducations(request.educations());
        if (request.certifications() != null) profile.setCertifications(request.certifications());

        return profileRepository.save(profile);
    }
}
