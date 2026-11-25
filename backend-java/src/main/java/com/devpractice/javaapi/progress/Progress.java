package com.devpractice.javaapi.progress;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "progress")
public class Progress {
    public static final String DONE = "DONE";
    public static final String IN_PROGRESS = "IN_PROGRESS";

    @Id
    @Column(name = "lesson_id")
    private String lessonId;
    private String track;
    private String status;
    private int passed;
    private int total;
    private int attempts;
    @Lob
    private String code;
    @Column(name = "completed_at")
    private Instant completedAt;
    @Column(name = "updated_at")
    private Instant updatedAt;

    protected Progress() {
    }

    public Progress(String lessonId, String track) {
        this.lessonId = lessonId;
        this.track = track;
        this.status = IN_PROGRESS;
    }

    /** Ghi một lần chấm. Đã DONE thì giữ DONE, kể cả khi lần sau làm hỏng. */
    public void recordAttempt(int passed, int total, Instant now) {
        this.attempts++;
        this.passed = passed;
        this.total = total;
        if (total > 0 && passed == total && !DONE.equals(status)) {
            this.status = DONE;
            this.completedAt = now;
        }
    }

    public void touch(Instant now) { this.updatedAt = now; }

    public void setCode(String code) { this.code = code; }

    public void setTrack(String track) { this.track = track; }

    public String getLessonId() { return lessonId; }

    public String getTrack() { return track; }

    public String getStatus() { return status; }

    public int getPassed() { return passed; }

    public int getTotal() { return total; }

    public int getAttempts() { return attempts; }

    public String getCode() { return code; }

    public Instant getCompletedAt() { return completedAt; }

    public Instant getUpdatedAt() { return updatedAt; }
}
