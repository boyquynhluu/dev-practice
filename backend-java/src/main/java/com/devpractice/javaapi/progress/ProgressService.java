package com.devpractice.javaapi.progress;

import com.devpractice.javaapi.common.ApiException;
import com.devpractice.javaapi.progress.ProgressDtos.ProgressDto;
import com.devpractice.javaapi.progress.ProgressDtos.SaveRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ProgressService {
    private static final Pattern LESSON_ID = Pattern.compile("[a-z]{2,8}-[0-9]{2,3}");
    private final ProgressRepository repo;
    private final Clock clock = Clock.systemUTC();

    public ProgressService(ProgressRepository repo) { this.repo = repo; }

    @Transactional(readOnly = true)
    public List<ProgressDto> list() {
        return repo.findAll().stream().map(ProgressDto::of).toList();
    }

    @Transactional
    public ProgressDto save(String lessonId, SaveRequest req) {
        if (!LESSON_ID.matcher(lessonId).matches()) throw ApiException.badRequest("lessonId không hợp lệ: " + lessonId);
        if ((req.passed() == null) != (req.total() == null)) throw ApiException.badRequest("Phải gửi cả passed và total");
        if (req.passed() != null && req.passed() > req.total()) throw ApiException.badRequest("passed không được lớn hơn total");
        Instant now = clock.instant();
        Progress p = repo.findById(lessonId).orElseGet(() -> new Progress(lessonId, req.track()));
        p.setTrack(req.track());
        if (req.code() != null) p.setCode(req.code());
        if (req.passed() != null) p.recordAttempt(req.passed(), req.total(), now);
        p.touch(now);
        return ProgressDto.of(repo.save(p));
    }

    @Transactional
    public void delete(String lessonId) {
        repo.deleteById(lessonId);
    }

    @Transactional
    public void reset() {
        repo.deleteAllInBatch();
    }
}
