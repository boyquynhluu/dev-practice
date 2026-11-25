package com.devpractice.javaapi;

import com.devpractice.javaapi.lesson.Lesson;
import com.devpractice.javaapi.lesson.LessonService;
import com.devpractice.javaapi.runner.JavaRunner;
import com.devpractice.javaapi.runner.RunModels.RunResult;
import com.devpractice.javaapi.runner.RunnerProperties;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Bài có code: lời giải phải qua hết test, code khởi đầu phải biên dịch được nhưng chưa qua hết.
 * Bài chỉ quiz (không có tests): phải có lý thuyết và ít nhất 4 câu hỏi, không có starter/solution.
 */
class LessonSolutionsTest {
    private final JavaRunner runner = new JavaRunner(
            new RunnerProperties("target/runner-lib", 30, 8, 4, 65536, 60000));

    @TestFactory
    Stream<DynamicTest> everyLesson() throws Exception {
        LessonService lessons = new LessonService();
        assertFalse(lessons.all().isEmpty());
        return lessons.all().stream().flatMap(l -> l.quizOnly()
                ? Stream.of(DynamicTest.dynamicTest(l.id() + " quiz-only", () -> checkQuizOnly(l)))
                : Stream.of(
                DynamicTest.dynamicTest(l.id() + " solution", () -> checkSolution(l)),
                DynamicTest.dynamicTest(l.id() + " starter", () -> checkStarter(l))));
    }

    private void checkSolution(Lesson l) {
        RunResult r = runner.run(l.solution(), l.tests(), true);
        assertTrue(r.compiled(), () -> "không biên dịch: " + r.diagnostics());
        assertTrue(r.total() > 0, "không có test nào. error=" + r.error() + " stderr=" + r.stderr());
        assertEquals(r.total(), r.passed(), () -> "fail: " + r.tests().stream().filter(t -> !t.pass()).toList()
                + " error=" + r.error() + " stderr=" + r.stderr());
    }

    private void checkQuizOnly(Lesson l) {
        assertFalse(l.theory().isBlank(), "thiếu lý thuyết");
        assertTrue(l.quiz().size() >= 4, "bài chỉ quiz cần ít nhất 4 câu hỏi, có " + l.quiz().size());
        assertTrue(l.starter().isBlank() && l.solution().isBlank(), "bài chỉ quiz không được có starter/solution");
    }

    private void checkStarter(Lesson l) {
        RunResult r = runner.run(l.starter(), l.tests(), true);
        assertTrue(r.compiled(), () -> "starter không biên dịch: " + r.diagnostics());
        assertTrue(r.passed() < r.total(), "starter đã qua hết test");
    }
}
