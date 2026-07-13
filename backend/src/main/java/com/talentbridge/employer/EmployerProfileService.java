
package com.talentbridge.employer;

import com.talentbridge.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployerProfileService {

    private final EmployerProfileRepository employerProfileRepository;

    @Transactional
    public EmployerProfile createProfile(User user) {
        EmployerProfile profile = EmployerProfile.builder().user(user).build();
        return employerProfileRepository.save(profile);
    }

    public EmployerProfile getByUserId(UUID userId) {
        return employerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Employer profile not found"));
    }

    @Transactional
    public EmployerProfile updateProfile(UUID userId, UpdateEmployerProfileRequest request) {
        EmployerProfile profile = getByUserId(userId);
        if (request.companyName() != null) profile.setCompanyName(request.companyName());
        if (request.industry() != null) profile.setIndustry(request.industry());
        if (request.companySize() != null) profile.setCompanySize(request.companySize());
        if (request.website() != null) profile.setWebsite(request.website());
        if (request.description() != null) profile.setDescription(request.description());
        if (request.location() != null) profile.setLocation(request.location());
        return employerProfileRepository.save(profile);
    }
}
