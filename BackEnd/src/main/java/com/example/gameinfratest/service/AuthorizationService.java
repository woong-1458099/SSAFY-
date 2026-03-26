package com.example.gameinfratest.service;

import com.example.gameinfratest.auth.BffSessionState;
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

    public UserResponse requireAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "authentication is required");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof BffSessionState sessionState) {
            return userService.getCurrentUser(sessionState.user().id());
        }
        if (principal instanceof Jwt jwt) {
            return userService.getCurrentUser(jwt);
        }

        throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "unsupported authentication principal");
    }

    public UserResponse requireAuthenticatedSessionUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "authentication is required");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof BffSessionState sessionState) {
            return userService.getCurrentUser(sessionState.user().id());
        }

        throw new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_AUTH_REQUIRED", "session authentication is required");
    }

    public UserResponse requireUserAccess(UUID userId) {
        UserResponse currentUser = requireAuthenticatedUser();
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
