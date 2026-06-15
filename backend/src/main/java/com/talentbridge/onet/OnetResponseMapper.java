package com.talentbridge.onet;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Maps raw O*NET API JSON responses to our domain records.
 * O*NET returns nested structures that need flattening.
 */
public class OnetResponseMapper {

    @SuppressWarnings("unchecked")
    public static OnetOccupation toOccupation(String code, Map<String, Object> details, Map<String, Object> skillsResponse) {
        String title = Objects.toString(details.get("title"), "");
        String description = Objects.toString(details.get("description"), "");

        List<OnetOccupation.RequiredSkill> skills = Collections.emptyList();
        if (skillsResponse != null && skillsResponse.containsKey("element")) {
            List<Map<String, Object>> elements = (List<Map<String, Object>>) skillsResponse.get("element");
            skills = elements.stream()
                    .map(OnetResponseMapper::toSkill)
                    .toList();
        }

        return new OnetOccupation(code, title, description, null, skills, Collections.emptyList(), null);
    }

    @SuppressWarnings("unchecked")
    private static OnetOccupation.RequiredSkill toSkill(Map<String, Object> element) {
        String name = Objects.toString(element.get("name"), "");
        String description = Objects.toString(element.get("description"), "");

        Map<String, Object> score = (Map<String, Object>) element.getOrDefault("score", Map.of());
        double importance = toDouble(score.getOrDefault("value", 0));

        return new OnetOccupation.RequiredSkill(name, description, importance, 0);
    }

    private static double toDouble(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        return 0;
    }
}
