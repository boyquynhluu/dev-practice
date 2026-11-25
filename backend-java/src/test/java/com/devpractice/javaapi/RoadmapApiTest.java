package com.devpractice.javaapi;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:roadmaptest;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class RoadmapApiTest {
    @Autowired
    MockMvc mvc;

    @Test
    void servesPlanMergedWithProgress() throws Exception {
        mvc.perform(get("/api/roadmap")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(84))
                .andExpect(jsonPath("$.data[0].day").value(1))
                .andExpect(jsonPath("$.data[0].plannedDate").value("2026-11-17"))
                .andExpect(jsonPath("$.data[0].lessons[0]").value("java-16"))
                .andExpect(jsonPath("$.data[0].lessons[1]").value("java-08"))
                .andExpect(jsonPath("$.data[2].status").value("DONE"))   // seed V2 từ file xlsx
                .andExpect(jsonPath("$.data[3].status").value("TODO"))
                .andExpect(jsonPath("$.data[83].week").value(12));

        mvc.perform(put("/api/roadmap/10").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\",\"actualMinutes\":75,\"note\":\"  github.com/x/ddd  \",\"selfRating\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DONE"))
                .andExpect(jsonPath("$.data.note").value("github.com/x/ddd"))
                .andExpect(jsonPath("$.data.topic").value("Bounded context"));
        mvc.perform(get("/api/roadmap"))
                .andExpect(jsonPath("$.data[9].actualMinutes").value(75))
                .andExpect(jsonPath("$.data[10].status").value("TODO"));

        mvc.perform(delete("/api/roadmap")).andExpect(status().isOk());
        mvc.perform(get("/api/roadmap")).andExpect(jsonPath("$.data[9].status").value("TODO"));
    }

    @Test
    void validatesInput() throws Exception {
        mvc.perform(put("/api/roadmap/5").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"WHATEVER\",\"selfRating\":9,\"actualMinutes\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.status").exists())
                .andExpect(jsonPath("$.fieldErrors.selfRating").exists())
                .andExpect(jsonPath("$.fieldErrors.actualMinutes").exists());
        mvc.perform(put("/api/roadmap/85").contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/roadmap/abc").contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
                .andExpect(status().isBadRequest());
    }
}
