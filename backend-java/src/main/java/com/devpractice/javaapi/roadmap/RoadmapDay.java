package com.devpractice.javaapi.roadmap;

import java.time.LocalDate;
import java.util.List;

/** Một buổi trong kế hoạch (đọc từ resources/roadmap/backend-84-days.json, không đổi lúc chạy). */
public record RoadmapDay(int day, LocalDate plannedDate, int week, String group, String tech, String topic,
                         String method, int plannedMinutes, List<String> lessons) {
}
