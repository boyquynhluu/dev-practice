package com.devpractice.javaapi.progress;

import com.devpractice.javaapi.common.ApiResponse;
import com.devpractice.javaapi.progress.ProgressDtos.ProgressDto;
import com.devpractice.javaapi.progress.ProgressDtos.SaveRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {
    private final ProgressService service;

    public ProgressController(ProgressService service) { this.service = service; }

    @GetMapping
    public ApiResponse<List<ProgressDto>> list() { return ApiResponse.ok(service.list()); }

    @PutMapping("/{lessonId}")
    public ApiResponse<ProgressDto> save(@PathVariable String lessonId, @Valid @RequestBody SaveRequest req) {
        return ApiResponse.ok(service.save(lessonId, req));
    }

    @DeleteMapping("/{lessonId}")
    public ApiResponse<Void> delete(@PathVariable String lessonId) {
        service.delete(lessonId);
        return ApiResponse.ok();
    }

    @DeleteMapping
    public ApiResponse<Void> reset() {
        service.reset();
        return ApiResponse.ok();
    }
}
