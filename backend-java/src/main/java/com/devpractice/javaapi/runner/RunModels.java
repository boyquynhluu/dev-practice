package com.devpractice.javaapi.runner;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public final class RunModels {
    private RunModels() {
    }

    public record RunRequest(String lessonId,
                             @NotBlank(message = "Chưa có code") String code,
                             @NotNull @Pattern(regexp = "run|test", message = "mode phải là run hoặc test") String mode) {
    }

    public record Diagnostic(String file, long line, long column, String message) {
    }

    public record TestResult(String name, boolean pass, String message, long ms) {
    }

    public record RunResult(boolean compiled, List<Diagnostic> diagnostics, List<TestResult> tests,
                            int passed, int total, String stdout, String stderr,
                            boolean timedOut, long timeMs, String error) {
    }
}
