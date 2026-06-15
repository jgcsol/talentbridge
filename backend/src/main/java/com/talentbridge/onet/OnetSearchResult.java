package com.talentbridge.onet;

import java.util.List;

public record OnetSearchResult(
        int total,
        int start,
        int end,
        List<OnetOccupationSummary> occupation
) {
    public record OnetOccupationSummary(String code, String title, boolean brightOutlook, String zone) {}
}
