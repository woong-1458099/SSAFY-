package com.example.gameinfratest.api.dto.auth;

import com.example.gameinfratest.user.User;
import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String username,
        boolean emailVerified,
        String phone,
        LocalDate birthday,
        String provider,
        Instant lastLoginAt,
        int deathCount,
        Instant lastDeathAt,
        Instant createdAt,
        Instant updatedAt
) implements Serializable {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.isEmailVerified(),
                user.getPhone(),
                user.getBirthday(),
                user.getProvider(),
                user.getLastLoginAt(),
                user.getDeathCount(),
                user.getLastDeathAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
