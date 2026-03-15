package com.example.gameinfratest.service;

import com.example.gameinfratest.api.dto.challenge.AssignUserChallengeRequest;
import com.example.gameinfratest.api.dto.challenge.ChallengeResponse;
import com.example.gameinfratest.api.dto.challenge.UpdateUserChallengeRequest;
import com.example.gameinfratest.api.dto.challenge.UserChallengeResponse;
import com.example.gameinfratest.challenge.Challenge;
import com.example.gameinfratest.challenge.ChallengeRepository;
import com.example.gameinfratest.challenge.UserChallenge;
import com.example.gameinfratest.challenge.UserChallengeRepository;
import com.example.gameinfratest.support.ApiException;
import com.example.gameinfratest.user.User;
import com.example.gameinfratest.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChallengeService {
    private final ChallengeRepository challengeRepository;
    private final UserChallengeRepository userChallengeRepository;
    private final UserRepository userRepository;

    public ChallengeService(
            ChallengeRepository challengeRepository,
            UserChallengeRepository userChallengeRepository,
            UserRepository userRepository
    ) {
        this.challengeRepository = challengeRepository;
        this.userChallengeRepository = userChallengeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ChallengeResponse> getChallenges() {
        return challengeRepository.findAll().stream()
                .map(ChallengeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserChallengeResponse> getUserChallenges(UUID userId) {
        ensureUserExists(userId);
        return userChallengeRepository.findByUser_IdOrderByAssignedAtDesc(userId).stream()
                .map(UserChallengeResponse::from)
                .toList();
    }

    @Transactional
    public UserChallengeResponse assignUserChallenge(UUID userId, AssignUserChallengeRequest request) {
        User user = ensureUserExists(userId);
        Challenge challenge = challengeRepository.findById(request.challengeId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CHALLENGE_NOT_FOUND", "challenge not found"));

        userChallengeRepository.findByUser_IdAndChallenge_Id(userId, challenge.getId())
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "USER_CHALLENGE_EXISTS", "challenge already assigned");
                });

        UserChallenge userChallenge = new UserChallenge();
        userChallenge.setId(UUID.randomUUID());
        userChallenge.setUser(user);
        userChallenge.setChallenge(challenge);
        userChallenge.setProgress(request.initialProgress());

        int targetProgress = request.targetProgress() == null ? challenge.getTargetProgress() : request.targetProgress();
        userChallenge.setTargetProgress(targetProgress);
        userChallenge.setStatus(resolveStatus(request.initialProgress(), targetProgress, null));
        if (request.initialProgress() >= targetProgress) {
            userChallenge.setAchievedAt(Instant.now());
        }

        return UserChallengeResponse.from(userChallengeRepository.save(userChallenge));
    }

    @Transactional
    public UserChallengeResponse updateUserChallenge(UUID userChallengeId, UpdateUserChallengeRequest request) {
        UserChallenge userChallenge = userChallengeRepository.findById(userChallengeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_CHALLENGE_NOT_FOUND", "user challenge not found"));

        int targetProgress = request.targetProgress() == null ? userChallenge.getTargetProgress() : request.targetProgress();
        userChallenge.setTargetProgress(targetProgress);
        userChallenge.setProgress(request.progress());
        String status = resolveStatus(request.progress(), targetProgress, request.status());
        userChallenge.setStatus(status);
        if ("COMPLETED".equals(status)) {
            userChallenge.setAchievedAt(userChallenge.getAchievedAt() == null ? Instant.now() : userChallenge.getAchievedAt());
        } else {
            userChallenge.setAchievedAt(null);
        }

        return UserChallengeResponse.from(userChallengeRepository.save(userChallenge));
    }

    private User ensureUserExists(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "user not found"));
    }

    private String resolveStatus(int progress, int targetProgress, String requestedStatus) {
        if (requestedStatus != null && !requestedStatus.isBlank()) {
            return requestedStatus.trim().toUpperCase(Locale.ROOT);
        }
        return progress >= targetProgress ? "COMPLETED" : "ASSIGNED";
    }
}
