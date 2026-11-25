package com.devpractice.javaapi.runner;

import com.devpractice.javaapi.common.ApiException;
import com.devpractice.javaapi.runner.RunModels.Diagnostic;
import com.devpractice.javaapi.runner.RunModels.RunResult;
import com.devpractice.javaapi.runner.RunModels.TestResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Biên dịch code người học bằng javac trong process, rồi chạy ở một JVM con
 * có giới hạn heap và thời gian. Mỗi lần chạy dùng thư mục tạm riêng và xoá sau đó.
 */
@Service
public class JavaRunner {
    private static final Pattern PUBLIC_TYPE = Pattern.compile(
            "^\\s*public\\s+(?:final\\s+|abstract\\s+|sealed\\s+|non-sealed\\s+)*(?:class|interface|record|enum)\\s+(\\w+)",
            Pattern.MULTILINE);
    private static final Pattern ANY_TYPE = Pattern.compile(
            "\\b(?:class|interface|record|enum)\\s+(\\w+)");

    private final RunnerProperties props;
    private final Semaphore slots;
    private final JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    private final ObjectMapper json = new ObjectMapper();

    public JavaRunner(RunnerProperties props) {
        this.props = props;
        this.slots = new Semaphore(props.maxConcurrent());
        if (compiler == null) throw new IllegalStateException("Cần chạy bằng JDK (không phải JRE) để có javac");
    }

    public RunResult run(String code, String tests, boolean testMode) {
        if (code.length() > props.maxCodeChars()) throw ApiException.badRequest("Code quá dài (tối đa " + props.maxCodeChars() + " ký tự)");
        boolean acquired;
        try {
            acquired = slots.tryAcquire(15, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw ApiException.tooMany("Bị ngắt khi chờ lượt chạy");
        }
        if (!acquired) throw ApiException.tooMany("Máy chấm đang bận, thử lại sau vài giây");
        Path dir = null;
        long start = System.currentTimeMillis();
        try {
            dir = Files.createTempDirectory("jrun");
            return execute(dir, code, tests, testMode, start);
        } catch (IOException e) {
            throw new IllegalStateException("Lỗi I/O khi chạy code", e);
        } finally {
            slots.release();
            deleteQuietly(dir);
        }
    }

    private RunResult execute(Path dir, String code, String tests, boolean testMode, long start) throws IOException {
        Path src = Files.createDirectories(dir.resolve("src"));
        Path out = Files.createDirectories(dir.resolve("out"));
        Matcher pub = PUBLIC_TYPE.matcher(code);
        String userFile = (pub.find() ? pub.group(1) : "Solution") + ".java";

        List<Path> files = new ArrayList<>();
        files.add(write(src.resolve(userFile), code));
        if (testMode) {
            files.add(write(src.resolve("Tests.java"), tests));
            files.add(write(src.resolve("T.java"), harness("T.java")));
            files.add(write(src.resolve("TestMain.java"), harness("TestMain.java")));
        } else {
            files.add(write(src.resolve("RunMain.java"), harness("RunMain.java")));
        }

        List<Diagnostic> diags = compile(files, out);
        if (!diags.isEmpty()) {
            return new RunResult(false, diags, List.of(), 0, 0, "", "", false, System.currentTimeMillis() - start, null);
        }

        Path results = dir.resolve("results.json");
        List<String> cmd = new ArrayList<>(List.of(javaBin(), "-Xmx256m", "-Xss4m", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1",
                "-Dfile.encoding=UTF-8", "-Dstdout.encoding=UTF-8", "-Dstderr.encoding=UTF-8", "-Duser.language=en",
                "-cp", classpath(out)));
        if (testMode) {
            cmd.addAll(List.of("TestMain", results.toString(), String.valueOf(props.testTimeoutSeconds() * 1000L)));
        } else {
            cmd.add("RunMain");
            cmd.addAll(mainCandidates(code));
        }
        Path stdoutFile = dir.resolve("stdout.txt"), stderrFile = dir.resolve("stderr.txt");
        Process p = new ProcessBuilder(cmd).directory(dir.toFile())
                .redirectOutput(stdoutFile.toFile()).redirectError(stderrFile.toFile()).start();
        boolean finished;
        try {
            finished = p.waitFor(props.timeoutSeconds(), TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            finished = false;
        }
        if (!finished) {
            p.descendants().forEach(ProcessHandle::destroyForcibly);
            p.destroyForcibly();
            try {
                p.waitFor(5, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        String stdout = readCapped(stdoutFile), stderr = readCapped(stderrFile);
        long ms = System.currentTimeMillis() - start;

        if (!testMode) {
            return new RunResult(true, List.of(), List.of(), 0, 0, stdout, stderr, !finished, ms,
                    finished ? null : "Quá thời gian " + props.timeoutSeconds() + "s, đã dừng chương trình");
        }
        List<TestResult> testResults = new ArrayList<>();
        String error = finished ? null : "Quá thời gian " + props.timeoutSeconds() + "s, đã dừng chương trình";
        if (Files.exists(results)) {
            JsonNode root = json.readTree(results.toFile());
            for (JsonNode t : root.path("tests")) {
                testResults.add(new TestResult(t.path("name").asText(), t.path("pass").asBoolean(),
                        t.path("message").asText(), t.path("ms").asLong()));
            }
            if (!root.path("error").isNull()) error = "Lỗi khi chạy bộ test: " + root.path("error").asText();
        } else if (error == null) {
            error = "Chương trình dừng trước khi chấm xong (xem stderr)";
        }
        int passed = (int) testResults.stream().filter(TestResult::pass).count();
        return new RunResult(true, List.of(), testResults, passed, testResults.size(), stdout, stderr, !finished, ms, error);
    }

    private List<Diagnostic> compile(List<Path> files, Path out) throws IOException {
        DiagnosticCollector<JavaFileObject> collector = new DiagnosticCollector<>();
        try (StandardJavaFileManager fm = compiler.getStandardFileManager(collector, Locale.ROOT, StandardCharsets.UTF_8)) {
            Iterable<? extends JavaFileObject> units = fm.getJavaFileObjectsFromPaths(files);
            List<String> options = List.of("-d", out.toString(), "-encoding", "UTF-8", "-g", "-proc:none",
                    "-nowarn", "-Xlint:none", "-cp", classpath(null));
            StringWriter sink = new StringWriter();
            compiler.getTask(sink, fm, collector, options, null, units).call();
        }
        List<Diagnostic> diags = new ArrayList<>();
        for (javax.tools.Diagnostic<? extends JavaFileObject> d : collector.getDiagnostics()) {
            if (d.getKind() != javax.tools.Diagnostic.Kind.ERROR) continue;
            String file = d.getSource() == null ? "" : Path.of(d.getSource().toUri()).getFileName().toString();
            diags.add(new Diagnostic(file, d.getLineNumber(), d.getColumnNumber(), d.getMessage(Locale.ROOT)));
        }
        return diags;
    }

    /** Class có tên Main được thử trước, sau đó theo thứ tự khai báo. */
    private static List<String> mainCandidates(String code) {
        Set<String> names = new LinkedHashSet<>();
        Matcher m = ANY_TYPE.matcher(code);
        List<String> found = new ArrayList<>();
        while (m.find()) found.add(m.group(1));
        if (found.contains("Main")) names.add("Main");
        names.addAll(found);
        return new ArrayList<>(names);
    }

    private String classpath(Path out) {
        List<String> parts = new ArrayList<>();
        if (out != null) parts.add(out.toString());
        Path lib = Path.of(props.libDir());
        if (Files.isDirectory(lib)) parts.add(lib.toAbsolutePath() + File.separator + "*");
        return parts.isEmpty() ? "." : String.join(File.pathSeparator, parts);
    }

    private static String javaBin() {
        return Path.of(System.getProperty("java.home"), "bin", "java").toString();
    }

    private String readCapped(Path f) throws IOException {
        if (!Files.exists(f)) return "";
        byte[] all;
        try (InputStream in = Files.newInputStream(f)) {
            all = in.readNBytes(props.maxOutputBytes() + 1);
        }
        String s = new String(all, 0, Math.min(all.length, props.maxOutputBytes()), StandardCharsets.UTF_8);
        return all.length > props.maxOutputBytes() ? s + "\n… (output bị cắt bớt)" : s;
    }

    private static Path write(Path p, String content) throws IOException {
        return Files.writeString(p, content, StandardCharsets.UTF_8);
    }

    private static String harness(String name) throws IOException {
        return new ClassPathResource("harness/" + name).getContentAsString(StandardCharsets.UTF_8);
    }

    private static void deleteQuietly(Path dir) {
        if (dir == null) return;
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
        } catch (IOException ignored) {
            // thư mục tạm, hệ điều hành sẽ dọn sau
        }
    }
}
