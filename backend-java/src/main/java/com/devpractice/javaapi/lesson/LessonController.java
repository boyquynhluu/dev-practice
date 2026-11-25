package com.devpractice.javaapi.lesson;

import com.devpractice.javaapi.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/java/lessons")
public class LessonController {
    private final LessonService service;

    public LessonController(LessonService service) { this.service = service; }

    @GetMapping
    public ApiResponse<List<Lesson.Summary>> list() { return ApiResponse.ok(service.list()); }

    @GetMapping("/{id}")
    public ApiResponse<Lesson.Detail> get(@PathVariable String id) {
        return ApiResponse.ok(service.get(id).detail("java"));
    }

    @GetMapping("/{id}/solution")
    public ApiResponse<Map<String, String>> solution(@PathVariable String id) {
        return ApiResponse.ok(Map.of("solution", service.get(id).solution()));
    }
}
