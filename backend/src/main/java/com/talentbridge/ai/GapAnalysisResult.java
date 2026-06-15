package com.talentbridge.ai;

import java.util.List;

public record GapAnalysisResult(
        int overallScore,
        int skillScore,
        int experienceScore,
        int educationScore,
        List<Strength> strengths,
        List<Gap> gaps,
        List<Recommendation> recommendations,
        String summary
) {
    public record Strength(String area, String detail) {}

    public record Gap(String area, String detail, String severity) {}

    public record Recommendation(String type, String title, String description) {}
}
