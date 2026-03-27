package com.example.gameinfratest.api.dto.death;

import java.util.List;

public record DeathDashboardResponse(
        List<DeathRecordEventResponse> recentDeaths,
        List<DeathRankingResponse> topDeathCounts
) {
}
