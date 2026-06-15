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

        profile.setHeadline(parsed.headline());
        profile.setSummary(parsed.summary());
        profile.setSkills(parsed.skills());
        profile.setExperiences(parsed.experiences());
        profile.setEducations(parsed.educations());
        profile.setCertifications(parsed.certifications());
        profile.setProfileComplete(true);

        log.info("Resume parsed and profile updated for user {}", userId);
        return profileRepository.save(profile);
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
