package com.devpractice.javaapi;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:apitest;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired
    MockMvc mvc;

    @Test
    void lessonsAndSolutionAreServedSeparately() throws Exception {
        mvc.perform(get("/api/java/lessons")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(39));
        mvc.perform(get("/api/java/lessons/java-01")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.solution").doesNotExist())
                .andExpect(jsonPath("$.data.tests").isNotEmpty());
        mvc.perform(get("/api/java/lessons/java-01/solution")).andExpect(jsonPath("$.data.solution").isNotEmpty());
        mvc.perform(get("/api/java/lessons/nope")).andExpect(status().isNotFound());
        mvc.perform(get("/api/java/lessons/java-22")).andExpect(jsonPath("$.data.quizOnly").value(true))
                .andExpect(jsonPath("$.data.quiz.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(4)));
        mvc.perform(get("/api/java/lessons/java-16")).andExpect(jsonPath("$.data.quizOnly").value(false));
    }

    @Test
    void progressKeepsDoneAfterLaterFailure() throws Exception {
        mvc.perform(delete("/api/progress")).andExpect(status().isOk());
        mvc.perform(put("/api/progress/java-02").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"track\":\"java\",\"code\":\"x\",\"passed\":3,\"total\":3}"))
                .andExpect(jsonPath("$.data.status").value("DONE"));
        mvc.perform(put("/api/progress/java-02").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"track\":\"java\",\"passed\":1,\"total\":3}"))
                .andExpect(jsonPath("$.data.status").value("DONE"))
                .andExpect(jsonPath("$.data.attempts").value(2))
                .andExpect(jsonPath("$.data.code").value("x"));
        mvc.perform(put("/api/progress/java-02").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"track\":\"java\",\"passed\":4,\"total\":3}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/progress/bad id").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"track\":\"java\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void runValidatesRequest() throws Exception {
        mvc.perform(post("/api/java/run").contentType(MediaType.APPLICATION_JSON).content("{\"mode\":\"test\",\"code\":\"class A{}\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/java/run").contentType(MediaType.APPLICATION_JSON).content("{\"mode\":\"x\",\"code\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.code").exists());
        mvc.perform(post("/api/java/run").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mode\":\"run\",\"code\":\"class Main { public static void main(String[] a) { System.out.println(6*7); } }\"}"))
                .andExpect(jsonPath("$.data.stdout").value(org.hamcrest.Matchers.startsWith("42")));
    }
}
