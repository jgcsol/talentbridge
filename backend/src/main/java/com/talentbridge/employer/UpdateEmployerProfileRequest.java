package com.talentbridge.employer;

public record UpdateEmployerProfileRequest(
        String companyName,
        String industry,
        String companySize,
        String website,
        String description,
        String location
) {}
