package com.devpractice.javaapi.roadmap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class RoadmapCatalog {
    static final String FILE = "roadmap/backend-84-days.json";
    private final List<RoadmapDay> days;

    public RoadmapCatalog(ObjectMapper mapper) throws IOException {
        try (InputStream in = new ClassPathResource(FILE).getInputStream()) {
            List<RoadmapDay> list = mapper.readValue(in, new TypeReference<List<RoadmapDay>>() { });
            Set<Integer> seen = new HashSet<>();
            for (RoadmapDay d : list) {
                if (!seen.add(d.day())) throw new IllegalStateException("Trùng số buổi trong " + FILE + ": " + d.day());
            }
            this.days = list.stream().sorted(Comparator.comparingInt(RoadmapDay::day)).toList();
        }
    }

    public List<RoadmapDay> days() { return days; }
}
