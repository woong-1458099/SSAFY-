package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.auth.UserResponse;
import com.example.gameinfratest.support.ApiException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {
    private final UserService userService;

    public AuthorizationService(UserService userService) {
        this.userService = userService;
    }

    public UserResponse requireUserAccess(UUID userId, Jwt jwt) {
        UserResponse currentUser = userService.getCurrentUser(jwt);
        if (currentUser.id().equals(userId) || hasSystemAuthority()) {
            return currentUser;
        }

        throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "user resource access denied");
    }

    public void requireSystemAccess() {
        if (!hasSystemAuthority()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "system authority is required");
        }
    }

    private boolean hasSystemAuthority() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_SYSTEM") || authority.equals("ROLE_ADMIN"));
    }
}
