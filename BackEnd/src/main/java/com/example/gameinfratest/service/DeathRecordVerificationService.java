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
    private static final String FAILURE_SESSION_KEY = "user.death-record.verification.failures";

    private final DeathRecordProperties deathRecordProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public DeathRecordVerificationService(DeathRecordProperties deathRecordProperties) {
        this.deathRecordProperties = deathRecordProperties;
    }

    public DeathRecordTokenResponse issueToken(HttpSession session, UUID userId) {
        Instant expiresAt = Instant.now().plus(deathRecordProperties.getTokenTtl());
        String token = normalizeToken(generateToken());
        Map<String, DeathRecordVerificationState> verificationStates = getVerificationStates(session);

        pruneExpiredTokens(verificationStates);
        evictOverflowTokens(verificationStates);
        verificationStates.put(token, new DeathRecordVerificationState(userId, expiresAt.toEpochMilli()));
        storeVerificationStates(session, verificationStates);

        return new DeathRecordTokenResponse(token, expiresAt);
    }

    public void verifyAndConsume(HttpSession session, UUID userId, String token) {
        VerificationFailureState failureState = getFailureState(session);
        if (failureState.isLocked()) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "DEATH_RECORD_VERIFICATION_LOCKED", "death record verification is temporarily locked");
        }

        String normalizedToken = normalizeToken(token);
        if (normalizedToken.isEmpty()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_REQUIRED", "death record verification is required");
        }

        Map<String, DeathRecordVerificationState> verificationStates = getVerificationStates(session);
        pruneExpiredTokens(verificationStates);

        DeathRecordVerificationState state = verificationStates.get(normalizedToken);
        if (state == null) {
            storeVerificationStates(session, verificationStates);
            recordFailure(session, failureState);
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_INVALID", "death record verification token is invalid");
        }

        if (state.isExpired()) {
            verificationStates.remove(normalizedToken);
            storeVerificationStates(session, verificationStates);
            recordFailure(session, failureState);
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_EXPIRED", "death record verification has expired");
        }

        if (!state.userId().equals(userId)) {
            verificationStates.remove(normalizedToken);
            storeVerificationStates(session, verificationStates);
            recordFailure(session, failureState);
            throw new ApiException(HttpStatus.FORBIDDEN, "DEATH_RECORD_VERIFICATION_INVALID", "death record verification token is invalid");
        }

        verificationStates.remove(normalizedToken);
        storeVerificationStates(session, verificationStates);
        clearFailureState(session);
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

    private void evictOverflowTokens(Map<String, DeathRecordVerificationState> verificationStates) {
        int maxActiveTokens = Math.max(1, deathRecordProperties.getMaxActiveTokens());
        while (verificationStates.size() >= maxActiveTokens) {
            String oldestToken = null;
            long oldestExpiry = Long.MAX_VALUE;

            for (Map.Entry<String, DeathRecordVerificationState> entry : verificationStates.entrySet()) {
                long expiresAtEpochMilli = entry.getValue().expiresAtEpochMilli();
                if (expiresAtEpochMilli < oldestExpiry) {
                    oldestExpiry = expiresAtEpochMilli;
                    oldestToken = entry.getKey();
                }
            }

            if (oldestToken == null) {
                return;
            }
            verificationStates.remove(oldestToken);
        }
    }

    private VerificationFailureState getFailureState(HttpSession session) {
        Object attribute = session.getAttribute(FAILURE_SESSION_KEY);
        if (attribute instanceof VerificationFailureState state) {
            if (state.isLocked()) {
                return state;
            }
            if (state.lockedUntilEpochMilli() > 0) {
                clearFailureState(session);
                return VerificationFailureState.empty();
            }
            return state;
        }
        return VerificationFailureState.empty();
    }

    private void recordFailure(HttpSession session, VerificationFailureState currentState) {
        int failureCount = currentState.failureCount() + 1;
        long lockedUntilEpochMilli = 0L;
        if (failureCount >= deathRecordProperties.getMaxFailureAttempts()) {
            lockedUntilEpochMilli = Instant.now().plus(deathRecordProperties.getFailureLockout()).toEpochMilli();
        }
        session.setAttribute(FAILURE_SESSION_KEY, new VerificationFailureState(failureCount, lockedUntilEpochMilli));
    }

    private void clearFailureState(HttpSession session) {
        session.removeAttribute(FAILURE_SESSION_KEY);
    }

    private record DeathRecordVerificationState(UUID userId, long expiresAtEpochMilli) implements Serializable {
        private boolean isExpired() {
            return Instant.now().toEpochMilli() >= expiresAtEpochMilli;
        }
    }

    private record VerificationFailureState(int failureCount, long lockedUntilEpochMilli) implements Serializable {
        private static VerificationFailureState empty() {
            return new VerificationFailureState(0, 0L);
        }

        private boolean isLocked() {
            return lockedUntilEpochMilli > 0 && Instant.now().toEpochMilli() < lockedUntilEpochMilli;
        }
    }
}
