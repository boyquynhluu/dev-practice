package com.devpractice.javaapi.lesson;

import java.util.List;

/** Một bài học: lý thuyết + câu hỏi nhanh + bài tập có test (bài không có tests là bài chỉ có lý thuyết + quiz). */
public record Lesson(String id, String title, String level, String topic, int order,
                     String theory, List<QuizItem> quiz, List<String> hints,
                     String starter, String tests, String solution) {

    public record QuizItem(String question, List<String> options, int answer, String explain) {
    }

    public record Summary(String id, String title, String level, String topic, int order, boolean quizOnly) {
    }

    /** Không có lời giải; lời giải lấy riêng qua /solution. */
    public record Detail(String id, String title, String level, String topic, int order, String language,
                         String theory, List<QuizItem> quiz, List<String> hints, String starter, String tests,
                         boolean quizOnly) {
    }

    /** Bài chỉ có lý thuyết + quiz: hoàn thành khi trả lời đúng hết quiz, không có editor. */
    public boolean quizOnly() { return tests.isBlank(); }

    public Summary summary() { return new Summary(id, title, level, topic, order, quizOnly()); }

    public Detail detail(String language) {
        return new Detail(id, title, level, topic, order, language, theory, quiz, hints, starter, tests, quizOnly());
    }
}
