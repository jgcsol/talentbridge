package com.talentbridge.user;

import java.util.Optional;
import java.util.UUID;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

     private final UserRepository users;

    @Override
    public UserDetails loadUserByUsername(String email) {
        return (UserDetails) users.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));
    }

    public Boolean exitstByEmail(String email){
        return users.existsByEmail(email);
    }

    public User save(User user) {
        return users.save(user);
    }

    public Optional<User> findByEmail(String email){
        return users.findByEmail(email);
    }

    public Optional<User> findById(UUID userId) {
        return users.findById(userId);
    }
    
}
