package com.example.gameinfratest.auth;

import com.example.gameinfratest.support.ApiException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class AuthSessionTicketStore {
    private static final long TICKET_TTL_SECONDS = 120;

    private final Map<String, StoredTicket> tickets = new ConcurrentHashMap<>();

    public String issue(AuthSessionPayload payload) {
        cleanupExpiredTickets();
        String ticket = UUID.randomUUID().toString();
        tickets.put(ticket, new StoredTicket(payload, Instant.now().plusSeconds(TICKET_TTL_SECONDS)));
        return ticket;
    }

    public AuthSessionPayload consume(String ticket) {
        cleanupExpiredTickets();
        StoredTicket storedTicket = tickets.remove(ticket);
        if (storedTicket == null || storedTicket.expiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_TICKET_INVALID", "authentication ticket is invalid or expired");
        }
        return storedTicket.payload();
    }

    private void cleanupExpiredTickets() {
        Instant now = Instant.now();
        tickets.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private record StoredTicket(AuthSessionPayload payload, Instant expiresAt) {
    }
}
