package com.devpractice.javaapi.runner;

import com.devpractice.javaapi.common.ApiException;
import com.devpractice.javaapi.common.ApiResponse;
import com.devpractice.javaapi.lesson.LessonService;
import com.devpractice.javaapi.runner.RunModels.RunRequest;
import com.devpractice.javaapi.runner.RunModels.RunResult;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RunnerController {
    private final JavaRunner runner;
    private final LessonService lessons;

    public RunnerController(JavaRunner runner, LessonService lessons) {
        this.runner = runner;
        this.lessons = lessons;
    }

    @PostMapping("/api/java/run")
    public ApiResponse<RunResult> run(@Valid @RequestBody RunRequest req) {
        boolean testMode = req.mode().equals("test");
        String tests = null;
        if (testMode) {
            if (req.lessonId() == null || req.lessonId().isBlank()) throw ApiException.badRequest("Chấm bài cần lessonId");
            tests = lessons.get(req.lessonId()).tests();
        }
        return ApiResponse.ok(runner.run(req.code(), tests, testMode));
    }
}
