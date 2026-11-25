package com.devpractice.javaapi.roadmap;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class RoadmapDtos {
    private RoadmapDtos() {
    }

    /** Ghi đè toàn bộ phần theo dõi của một buổi; trường để null nghĩa là xoá giá trị đó. */
    public record UpdateRequest(
            @NotNull @Pattern(regexp = "TODO|IN_PROGRESS|DONE", message = "status phải là TODO, IN_PROGRESS hoặc DONE") String status,
            @Min(value = 0, message = "Số phút không được âm") @Max(value = 1440, message = "Tối đa 1440 phút") Integer actualMinutes,
            @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự") String note,
            @Min(value = 1, message = "Tự đánh giá từ 1 đến 5") @Max(value = 5, message = "Tự đánh giá từ 1 đến 5") Integer selfRating) {
    }

    public record DayDto(int day, LocalDate plannedDate, int week, String group, String tech, String topic,
                         String method, int plannedMinutes, List<String> lessons,
                         String status, Integer actualMinutes, String note, Integer selfRating, Instant updatedAt) {
        static DayDto of(RoadmapDay d, RoadmapProgress p) {
            return p == null
                    ? new DayDto(d.day(), d.plannedDate(), d.week(), d.group(), d.tech(), d.topic(), d.method(),
                    d.plannedMinutes(), d.lessons(), RoadmapProgress.TODO, null, null, null, null)
                    : new DayDto(d.day(), d.plannedDate(), d.week(), d.group(), d.tech(), d.topic(), d.method(),
                    d.plannedMinutes(), d.lessons(), p.getStatus(), p.getActualMinutes(), p.getNote(),
                    p.getSelfRating(), p.getUpdatedAt());
        }
    }
}
