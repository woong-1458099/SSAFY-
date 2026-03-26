package com.example.gameinfratest.death;

import com.example.gameinfratest.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_death_records")
public class DeathRecord {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "area_id", length = 100)
    private String areaId;

    @Column(name = "scene_id", length = 100)
    private String sceneId;

    @Column(length = 120)
    private String cause;

    @Column(name = "death_count_snapshot", nullable = false)
    private int deathCountSnapshot;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getAreaId() {
        return areaId;
    }

    public void setAreaId(String areaId) {
        this.areaId = areaId;
    }

    public String getSceneId() {
        return sceneId;
    }

    public void setSceneId(String sceneId) {
        this.sceneId = sceneId;
    }

    public String getCause() {
        return cause;
    }

    public void setCause(String cause) {
        this.cause = cause;
    }

    public int getDeathCountSnapshot() {
        return deathCountSnapshot;
    }

    public void setDeathCountSnapshot(int deathCountSnapshot) {
        this.deathCountSnapshot = deathCountSnapshot;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
