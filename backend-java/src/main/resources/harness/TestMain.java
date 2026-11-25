import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class TestMain {
    public static void main(String[] args) throws Exception {
        System.setOut(new PrintStream(System.out, true, StandardCharsets.UTF_8));
        T t = new T(Long.parseLong(args[1]));
        String setupError = null;
        try {
            Tests.run(t);
        } catch (Throwable e) {
            setupError = T.describe(e);
        }
        StringBuilder sb = new StringBuilder("{\"tests\":[");
        for (int i = 0; i < t.results.size(); i++) {
            T.R r = t.results.get(i);
            if (i > 0) sb.append(',');
            sb.append("{\"name\":").append(q(r.name())).append(",\"pass\":").append(r.pass())
                    .append(",\"message\":").append(q(r.message())).append(",\"ms\":").append(r.ms()).append('}');
        }
        sb.append("],\"error\":").append(setupError == null ? "null" : q(setupError)).append('}');
        Files.writeString(Path.of(args[0]), sb.toString(), StandardCharsets.UTF_8);
        System.out.flush();
        System.exit(0); // dừng cả các thread non-daemon mà bài làm quên tắt
    }

    static String q(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> b.append("\\\"");
                case '\\' -> b.append("\\\\");
                case '\n' -> b.append("\\n");
                case '\r' -> b.append("\\r");
                case '\t' -> b.append("\\t");
                default -> {
                    if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
                    else b.append(c);
                }
            }
        }
        return b.append('"').toString();
    }
}
