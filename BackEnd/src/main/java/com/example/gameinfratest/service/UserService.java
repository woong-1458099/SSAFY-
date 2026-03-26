package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.support.ApiException;
import com.example.gameinfratest.user.User;
import com.example.gameinfratest.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private static final String PROVIDER = "keycloak";
    private static final Duration DEATH_RECORD_COOLDOWN = Duration.ofSeconds(3);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponse upsertFromJwt(Jwt jwt) {
        JwtIdentity identity = extractIdentity(jwt);
        blockDeletedUser(identity);

        User user = userRepository.findByProviderAndProviderIdAndDeletedAtIsNull(PROVIDER, identity.subject())
                .or(() -> userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(identity.email()))
                .orElseGet(User::new);

        if (user.getId() == null) {
            user.setId(UUID.randomUUID());
        }
        user.setEmail(identity.email());
        user.setUsername(identity.username());
        user.setEmailVerified(identity.emailVerified());
        user.setProvider(PROVIDER);
        user.setProviderId(identity.subject());
        user.setLastLoginAt(Instant.now());

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Jwt jwt) {
        JwtIdentity identity = extractIdentity(jwt);
        blockDeletedUser(identity);
        User user = userRepository.findByProviderAndProviderIdAndDeletedAtIsNull(PROVIDER, identity.subject())
                .or(() -> userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(identity.email()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "user profile not found"));

        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .filter(current -> current.getDeletedAt() == null)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "user profile not found"));

        return UserResponse.from(user);
    }

    @Transactional
    public void softDeleteCurrentUser(Jwt jwt) {
        JwtIdentity identity = extractIdentity(jwt);
        User user = userRepository.findByProviderAndProviderIdAndDeletedAtIsNull(PROVIDER, identity.subject())
                .or(() -> userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(identity.email()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "user profile not found"));

        user.setDeletedAt(Instant.now());
        userRepository.save(user);
    }

    @Transactional
    public void softDeleteCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .filter(current -> current.getDeletedAt() == null)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "user profile not found"));

        user.setDeletedAt(Instant.now());
        userRepository.save(user);
    }

    @Transactional
    public UserResponse recordDeath(UUID userId) {
        User user = userRepository.findByIdAndDeletedAtIsNullForUpdate(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "user profile not found"));

        Instant now = Instant.now();
        Instant lastDeathAt = user.getLastDeathAt();
        if (lastDeathAt != null && lastDeathAt.plus(DEATH_RECORD_COOLDOWN).isAfter(now)) {
            return UserResponse.from(user);
        }

        user.setDeathCount(user.getDeathCount() + 1);
        user.setLastDeathAt(now);

        return UserResponse.from(userRepository.saveAndFlush(user));
    }

    private JwtIdentity extractIdentity(Jwt jwt) {
        if (jwt == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "jwt is required");
        }

        String subject = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        Boolean emailVerified = jwt.getClaimAsBoolean("email_verified");

        if (subject == null || subject.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "token subject is missing");
        }
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMAIL_REQUIRED", "token email claim is missing");
        }

        return new JwtIdentity(
                subject,
                email.trim().toLowerCase(Locale.ROOT),
                username == null || username.isBlank() ? null : username.trim(),
                Boolean.TRUE.equals(emailVerified)
        );
    }

    private void blockDeletedUser(JwtIdentity identity) {
        boolean deleted = userRepository.findByProviderAndProviderId(PROVIDER, identity.subject())
                .filter(user -> user.getDeletedAt() != null)
                .isPresent()
                || userRepository.findByEmailIgnoreCase(identity.email())
                .filter(user -> user.getDeletedAt() != null)
                .isPresent();

        if (deleted) {
            throw new ApiException(HttpStatus.FORBIDDEN, "USER_DELETED", "deleted user cannot access this service");
        }
    }

    private record JwtIdentity(String subject, String email, String username, boolean emailVerified) {
    }
}
