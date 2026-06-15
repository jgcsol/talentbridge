package com.talentbridge.onet;

import java.util.List;

public record OnetOccupation(
        String code,
        String title,
        String description,
        String industry,
        List<RequiredSkill> requiredSkills,
        List<String> tasks,
        String minimumEducation
) {
    public record RequiredSkill(String name, String description, double importance, double level) {}
}
