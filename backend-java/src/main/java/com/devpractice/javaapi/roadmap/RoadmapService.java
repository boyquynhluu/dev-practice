package com.devpractice.javaapi.roadmap;

import com.devpractice.javaapi.common.ApiException;
import com.devpractice.javaapi.roadmap.RoadmapDtos.DayDto;
import com.devpractice.javaapi.roadmap.RoadmapDtos.UpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RoadmapService {
    private final RoadmapCatalog catalog;
    private final RoadmapProgressRepository repo;
    private final Clock clock = Clock.systemUTC();

    public RoadmapService(RoadmapCatalog catalog, RoadmapProgressRepository repo) {
        this.catalog = catalog;
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<DayDto> list() {
        Map<Integer, RoadmapProgress> byDay = repo.findAll().stream()
                .collect(Collectors.toMap(RoadmapProgress::getDay, Function.identity()));
        return catalog.days().stream().map(d -> DayDto.of(d, byDay.get(d.day()))).toList();
    }

    @Transactional
    public DayDto update(int day, UpdateRequest req) {
        RoadmapDay plan = catalog.days().stream().filter(d -> d.day() == day).findFirst()
                .orElseThrow(() -> ApiException.notFound("Không có buổi số " + day));
        RoadmapProgress p = repo.findById(day).orElseGet(() -> new RoadmapProgress(day));
        p.update(req.status(), req.actualMinutes(), req.note(), req.selfRating(), clock.instant());
        return DayDto.of(plan, repo.save(p));
    }

    @Transactional
    public void reset() {
        repo.deleteAllInBatch();
    }
}
