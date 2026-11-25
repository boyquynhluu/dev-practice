package com.devpractice.javaapi.progress;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class ProgressDtos {
    private ProgressDtos() {
    }

    /** passed/total chỉ gửi khi vừa chấm bài; chỉ lưu nháp thì chỉ gửi code. */
    public record SaveRequest(
            @NotNull @Pattern(regexp = "fe|java|python", message = "track phải là fe, java hoặc python") String track,
            @Size(max = 100_000, message = "Code quá dài") String code,
            @Min(0) Integer passed,
            @Min(0) Integer total) {
    }

    public record ProgressDto(String lessonId, String track, String status, int passed, int total, int attempts,
                              String code, Instant completedAt, Instant updatedAt) {
        static ProgressDto of(Progress p) {
            return new ProgressDto(p.getLessonId(), p.getTrack(), p.getStatus(), p.getPassed(), p.getTotal(),
                    p.getAttempts(), p.getCode(), p.getCompletedAt(), p.getUpdatedAt());
        }
    }
}
