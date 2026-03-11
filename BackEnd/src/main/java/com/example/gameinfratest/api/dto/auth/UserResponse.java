package com.example.gameinfratest.api.dto.auth;

import com.example.gameinfratest.user.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String phone,
        LocalDate birthday,
        String provider,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getPhone(),
                user.getBirthday(),
                user.getProvider(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
