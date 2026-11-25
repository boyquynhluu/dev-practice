package com.devpractice.javaapi.lesson;

import com.devpractice.javaapi.common.ApiException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class LessonService {
    private final Map<String, Lesson> lessons = new LinkedHashMap<>();

    public LessonService() throws IOException {
        Resource[] files = new PathMatchingResourcePatternResolver().getResources("classpath*:lessons/*.lesson");
        List<Lesson> list = new java.util.ArrayList<>();
        for (Resource r : files) {
            list.add(LessonParser.parse(r.getContentAsString(StandardCharsets.UTF_8), r.getFilename()));
        }
        list.sort(Comparator.comparingInt(Lesson::order));
        for (Lesson l : list) {
            if (lessons.put(l.id(), l) != null) throw new IllegalStateException("Trùng id bài: " + l.id());
        }
    }

    public List<Lesson.Summary> list() {
        return lessons.values().stream().map(Lesson::summary).toList();
    }

    public Lesson get(String id) {
        Lesson l = lessons.get(id);
        if (l == null) throw ApiException.notFound("Không có bài " + id);
        return l;
    }

    public List<Lesson> all() { return List.copyOf(lessons.values()); }
}
