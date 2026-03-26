package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.auth.DeathRecordTokenResponse;
import com.example.gameinfratest.config.DeathRecordProperties;
import com.example.gameinfratest.support.ApiException;
import jakarta.servlet.http.HttpSession;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class DeathRecordVerificationService {
    private static final String SESSION_KEY = "user.death-record.verification";

    private final DeathRecordProperties deathRecordProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public DeathRecordVerificationService(DeathRecordProperties deathRecordProperties) {
        this.deathRecordProperties = deathRecordProperties;
    }

    public DeathRecordTokenResponse issueToken(HttpSession session, UUID userId) {
        Instant expiresAt = Instant.now().plus(deathRecordProperties.getTokenTtl());
        String token = generateToken();

        session.setAttribute(SESSION_KEY, new DeathRecordVerificationState(userId, token, expiresAt.toEpochMilli()));
        return new DeathRecordTokenResponse(token, expiresAt);
    }

    public void verifyAndConsume(HttpSession session, UUID userId, String token) {
        Object attribute = session.getAttribute(SESSION_KEY);
        if (!(attribute instanceof DeathRecordVerificationState state)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_REQUIRED", "death record verification is required");
        }

        if (state.isExpired() || !state.userId().equals(userId)) {
            session.removeAttribute(SESSION_KEY);
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_EXPIRED", "death record verification has expired");
        }

        byte[] expected = state.token().getBytes(StandardCharsets.UTF_8);
        byte[] provided = normalizeToken(token).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, provided)) {
            session.removeAttribute(SESSION_KEY);
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_INVALID", "death record verification token is invalid");
        }

        session.removeAttribute(SESSION_KEY);
    }

    private String generateToken() {
        byte[] buffer = new byte[32];
        secureRandom.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    private String normalizeToken(String token) {
        if (token == null || token.isBlank()) {
            return "";
        }
        return token.trim();
    }

    private record DeathRecordVerificationState(UUID userId, String token, long expiresAtEpochMilli) implements Serializable {
        private boolean isExpired() {
            return Instant.now().toEpochMilli() >= expiresAtEpochMilli;
        }
    }
}
