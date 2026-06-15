package com.talentbridge.employer;

import com.talentbridge.candidate.CandidateProfile;

import java.util.List;
import java.util.UUID;

/**
 * Redacted view of a candidate profile for employer search results.
 * Email is only included if the candidate's visibility is PUBLIC.
 */
public record CandidateSearchResult(
        UUID id,
        String headline,
        String location,
        String summary,
        List<CandidateProfile.Skill> skills,
        List<CandidateProfile.Education> educations,
        CandidateProfile.Visibility visibility,
        String email   // null unless visibility == PUBLIC
) {}
