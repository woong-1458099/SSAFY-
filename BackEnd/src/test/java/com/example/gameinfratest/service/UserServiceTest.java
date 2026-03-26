package com.example.gameinfratest.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.support.ApiException;
import com.example.gameinfratest.user.User;
import com.example.gameinfratest.user.UserRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void recordDeathLocksUserRowAndReturnsUpdatedUser() {
        UUID userId = UUID.randomUUID();
        User lockedUser = activeUser(userId, 3, null);
        User savedUser = activeUser(userId, 4, Instant.parse("2026-03-25T03:00:00Z"));

        when(userRepository.findByIdAndDeletedAtIsNullForUpdate(userId)).thenReturn(Optional.of(lockedUser));
        when(userRepository.saveAndFlush(lockedUser)).thenReturn(savedUser);

        UserResponse response = userService.recordDeath(userId);

        assertThat(response.id()).isEqualTo(userId);
        assertThat(response.deathCount()).isEqualTo(4);
        assertThat(response.lastDeathAt()).isEqualTo(Instant.parse("2026-03-25T03:00:00Z"));
        verify(userRepository).findByIdAndDeletedAtIsNullForUpdate(userId);
        verify(userRepository).saveAndFlush(lockedUser);
    }

    @Test
    void recordDeathThrowsNotFoundWhenLockedUserIsMissing() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findByIdAndDeletedAtIsNullForUpdate(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.recordDeath(userId))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(apiException.getCode()).isEqualTo("USER_NOT_FOUND");
                });

        verify(userRepository).findByIdAndDeletedAtIsNullForUpdate(userId);
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    private User activeUser(UUID userId, int deathCount, Instant lastDeathAt) {
        User user = new User();
        user.setId(userId);
        user.setEmail("player@example.com");
        user.setUsername("player");
        user.setEmailVerified(true);
        user.setProvider("keycloak");
        user.setProviderId("provider-id");
        user.setLastLoginAt(Instant.parse("2026-03-16T00:00:00Z"));
        user.setDeathCount(deathCount);
        user.setLastDeathAt(lastDeathAt);
        return user;
    }
}
