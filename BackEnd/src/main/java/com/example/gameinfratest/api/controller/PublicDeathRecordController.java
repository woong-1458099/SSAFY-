package com.example.gameinfratest.api.controller;

import com.example.gameinfratest.api.dto.ApiResponse;
import com.example.gameinfratest.api.dto.death.DeathDashboardResponse;
import com.example.gameinfratest.api.dto.death.DeathRankingResponse;
import com.example.gameinfratest.api.dto.death.DeathRecordEventResponse;
import com.example.gameinfratest.service.DeathRecordService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/deaths")
public class PublicDeathRecordController {
    private final DeathRecordService deathRecordService;

    public PublicDeathRecordController(DeathRecordService deathRecordService) {
        this.deathRecordService = deathRecordService;
    }

    @GetMapping("/recent")
    public ApiResponse<List<DeathRecordEventResponse>> recentDeaths(
            @RequestParam(value = "limit", required = false) Integer limit
    ) {
        return ApiResponse.ok("public recent death list fetch success", deathRecordService.getRecentDeaths(limit));
    }

    @GetMapping("/ranking")
    public ApiResponse<List<DeathRankingResponse>> deathRanking(
            @RequestParam(value = "limit", required = false) Integer limit
    ) {
        return ApiResponse.ok("public death ranking fetch success", deathRecordService.getDeathRanking(limit));
    }

    @GetMapping("/dashboard")
    public ApiResponse<DeathDashboardResponse> deathDashboard(
            @RequestParam(value = "recentLimit", required = false) Integer recentLimit,
            @RequestParam(value = "rankingLimit", required = false) Integer rankingLimit
    ) {
        return ApiResponse.ok(
                "public death dashboard fetch success",
                deathRecordService.getDeathDashboard(recentLimit, rankingLimit)
        );
    }
}
