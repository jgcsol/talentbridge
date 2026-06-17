package com.talentbridge.candidate;

import java.util.List;

public record ParsedResume(
        String headline,
        String location,
        String summary,
        List<CandidateProfile.Skill> skills,
        List<CandidateProfile.Experience> experiences,
        List<CandidateProfile.Education> educations,
        List<CandidateProfile.Certification> certifications
) {}
