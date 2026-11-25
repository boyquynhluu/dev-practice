package com.devpractice.javaapi.roadmap;

import com.devpractice.javaapi.common.ApiResponse;
import com.devpractice.javaapi.roadmap.RoadmapDtos.DayDto;
import com.devpractice.javaapi.roadmap.RoadmapDtos.UpdateRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Lộ trình Backend 84 ngày: kế hoạch cố định + phần tự theo dõi (trạng thái, phút thực tế, ghi chú, tự đánh giá). */
@RestController
@RequestMapping("/api/roadmap")
public class RoadmapController {
    private final RoadmapService service;

    public RoadmapController(RoadmapService service) { this.service = service; }

    @GetMapping
    public ApiResponse<List<DayDto>> list() { return ApiResponse.ok(service.list()); }

    @PutMapping("/{day}")
    public ApiResponse<DayDto> update(@PathVariable int day, @Valid @RequestBody UpdateRequest req) {
        return ApiResponse.ok(service.update(day, req));
    }

    @DeleteMapping
    public ApiResponse<Void> reset() {
        service.reset();
        return ApiResponse.ok();
    }
}
