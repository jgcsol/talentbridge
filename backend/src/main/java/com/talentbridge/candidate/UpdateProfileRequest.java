package com.talentbridge.candidate;

import java.util.List;

public record UpdateProfileRequest(
        String headline,
        String location,
        String summary,
        CandidateProfile.Visibility visibility,
        List<CandidateProfile.Skill> skills,
        List<CandidateProfile.Experience> experiences,
        List<CandidateProfile.Education> educations,
        List<CandidateProfile.Certification> certifications
) {}
