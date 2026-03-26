package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.auth.DeathRecordTokenResponse;
import com.example.gameinfratest.config.DeathRecordProperties;
import com.example.gameinfratest.support.ApiException;
import jakarta.servlet.http.HttpSession;
import java.io.Serializable;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
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
        Map<String, DeathRecordVerificationState> verificationStates = getVerificationStates(session);

        pruneExpiredTokens(verificationStates);
        verificationStates.put(token, new DeathRecordVerificationState(userId, expiresAt.toEpochMilli()));
        storeVerificationStates(session, verificationStates);

        return new DeathRecordTokenResponse(token, expiresAt);
    }

    public void verifyAndConsume(HttpSession session, UUID userId, String token) {
        String normalizedToken = normalizeToken(token);
        if (normalizedToken.isEmpty()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_REQUIRED", "death record verification is required");
        }

        Map<String, DeathRecordVerificationState> verificationStates = getVerificationStates(session);
        pruneExpiredTokens(verificationStates);

        DeathRecordVerificationState state = verificationStates.get(normalizedToken);
        if (state == null) {
            storeVerificationStates(session, verificationStates);
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_INVALID", "death record verification token is invalid");
        }

        if (state.isExpired()) {
            verificationStates.remove(normalizedToken);
            storeVerificationStates(session, verificationStates);
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_EXPIRED", "death record verification has expired");
        }

        if (!state.userId().equals(userId)) {
            verificationStates.remove(normalizedToken);
            storeVerificationStates(session, verificationStates);
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_INVALID", "death record verification token is invalid");
        }

        verificationStates.remove(normalizedToken);
        storeVerificationStates(session, verificationStates);
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

    @SuppressWarnings("unchecked")
    private Map<String, DeathRecordVerificationState> getVerificationStates(HttpSession session) {
        Object attribute = session.getAttribute(SESSION_KEY);
        if (attribute instanceof Map<?, ?> states) {
            return new HashMap<>((Map<String, DeathRecordVerificationState>) states);
        }
        return new HashMap<>();
    }

    private void storeVerificationStates(HttpSession session, Map<String, DeathRecordVerificationState> verificationStates) {
        if (verificationStates.isEmpty()) {
            session.removeAttribute(SESSION_KEY);
            return;
        }
        session.setAttribute(SESSION_KEY, new HashMap<>(verificationStates));
    }

    private void pruneExpiredTokens(Map<String, DeathRecordVerificationState> verificationStates) {
        Iterator<Map.Entry<String, DeathRecordVerificationState>> iterator = verificationStates.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, DeathRecordVerificationState> entry = iterator.next();
            if (entry.getValue().isExpired()) {
                iterator.remove();
            }
        }
    }

    private record DeathRecordVerificationState(UUID userId, long expiresAtEpochMilli) implements Serializable {
        private boolean isExpired() {
            return Instant.now().toEpochMilli() >= expiresAtEpochMilli;
        }
    }
}
