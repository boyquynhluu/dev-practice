package com.devpractice.javaapi.roadmap;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "roadmap_progress")
public class RoadmapProgress {
    public static final String TODO = "TODO";

    @Id
    @Column(name = "day_no")
    private int day;
    private String status;
    @Column(name = "actual_minutes")
    private Integer actualMinutes;
    private String note;
    @Column(name = "self_rating")
    private Integer selfRating;
    @Column(name = "updated_at")
    private Instant updatedAt;

    protected RoadmapProgress() {
    }

    public RoadmapProgress(int day) {
        this.day = day;
        this.status = TODO;
    }

    public void update(String status, Integer actualMinutes, String note, Integer selfRating, Instant now) {
        this.status = status;
        this.actualMinutes = actualMinutes;
        this.note = note == null || note.isBlank() ? null : note.strip();
        this.selfRating = selfRating;
        this.updatedAt = now;
    }

    public int getDay() { return day; }

    public String getStatus() { return status; }

    public Integer getActualMinutes() { return actualMinutes; }

    public String getNote() { return note; }

    public Integer getSelfRating() { return selfRating; }

    public Instant getUpdatedAt() { return updatedAt; }
}
