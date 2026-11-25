package com.devpractice.javaapi.lesson;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Đọc file .lesson. Mỗi phần bắt đầu bằng dòng "%%% tên":
 * meta (key: value), theory (markdown), quiz, hints (- ...), starter, tests, solution.
 * Quiz: "? câu hỏi", "- sai", "* đúng", "> giải thích".
 */
public final class LessonParser {
    private LessonParser() {
    }

    public static Lesson parse(String source, String fileName) {
        Map<String, StringBuilder> sections = new LinkedHashMap<>();
        StringBuilder cur = null;
        for (String line : source.replace("\r\n", "\n").split("\n", -1)) {
            if (line.startsWith("%%% ")) {
                cur = new StringBuilder();
                sections.put(line.substring(4).trim(), cur);
            } else if (cur != null) {
                cur.append(line).append('\n');
            }
        }
        Map<String, String> meta = new HashMap<>();
        for (String l : text(sections, "meta").split("\n")) {
            int i = l.indexOf(':');
            if (i > 0) meta.put(l.substring(0, i).trim(), l.substring(i + 1).trim());
        }
        String id = require(meta, "id", fileName);
        List<Lesson.QuizItem> quiz = parseQuiz(text(sections, "quiz"));
        for (Lesson.QuizItem q : quiz) {
            if (q.answer() < 0 || q.options().size() < 2) {
                throw new IllegalStateException(fileName + ": câu quiz cần ít nhất 2 đáp án và 1 đáp án đúng (*): " + q.question());
            }
        }
        return new Lesson(id, require(meta, "title", fileName), meta.getOrDefault("level", "core"),
                meta.getOrDefault("topic", ""), Integer.parseInt(meta.getOrDefault("order", "0")),
                text(sections, "theory"), quiz, parseHints(text(sections, "hints")),
                text(sections, "starter"), text(sections, "tests"), text(sections, "solution"));
    }

    private static String text(Map<String, StringBuilder> s, String key) {
        StringBuilder b = s.get(key);
        return b == null ? "" : b.toString().strip() + (key.equals("meta") ? "" : "\n");
    }

    private static String require(Map<String, String> meta, String key, String file) {
        String v = meta.get(key);
        if (v == null || v.isBlank()) throw new IllegalStateException(file + ": thiếu meta '" + key + "'");
        return v;
    }

    private static List<String> parseHints(String t) {
        List<String> out = new ArrayList<>();
        for (String l : t.split("\n")) if (l.startsWith("- ")) out.add(l.substring(2).trim());
        return out;
    }

    static List<Lesson.QuizItem> parseQuiz(String t) {
        List<Lesson.QuizItem> out = new ArrayList<>();
        String q = null, explain = "";
        List<String> opts = new ArrayList<>();
        int ans = -1;
        for (String l : (t + "\n? ").split("\n")) {
            if (l.startsWith("? ")) {
                if (q != null) out.add(new Lesson.QuizItem(q, List.copyOf(opts), ans, explain));
                q = l.substring(2).trim();
                opts = new ArrayList<>();
                ans = -1;
                explain = "";
            } else if (l.startsWith("* ") || l.startsWith("- ")) {
                if (l.startsWith("* ")) ans = opts.size();
                opts.add(l.substring(2).trim());
            } else if (l.startsWith("> ")) {
                explain = (explain + " " + l.substring(2).trim()).trim();
            }
        }
        return out;
    }
}
