import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

/** Bộ test tí hon dùng để chấm bài. Bài tập gọi t.test("tên", () -> { ... T.eq(mong_đợi, thực_tế); }). */
public final class T {
    public interface Body {
        void run() throws Throwable;
    }

    record R(String name, boolean pass, String message, long ms) {
    }

    final List<R> results = new ArrayList<>();
    private final long timeoutMs;

    T(long timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public void test(String name, Body body) {
        long start = System.nanoTime();
        Throwable[] err = new Throwable[1];
        Thread th = new Thread(() -> {
            try {
                body.run();
            } catch (Throwable e) {
                err[0] = e;
            }
        }, "test-" + results.size());
        th.setDaemon(true);
        th.start();
        try {
            th.join(timeoutMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        long ms = (System.nanoTime() - start) / 1_000_000;
        if (th.isAlive()) {
            results.add(new R(name, false, "Quá thời gian " + timeoutMs / 1000 + "s (vòng lặp vô hạn hoặc deadlock?)", ms));
        } else if (err[0] == null) {
            results.add(new R(name, true, "", ms));
        } else {
            results.add(new R(name, false, describe(err[0]), ms));
        }
    }

    static String describe(Throwable e) {
        if (e instanceof AssertionError && e.getMessage() != null) return e.getMessage();
        StringBuilder sb = new StringBuilder(e.getClass().getSimpleName());
        if (e.getMessage() != null) sb.append(": ").append(e.getMessage());
        for (StackTraceElement f : e.getStackTrace()) {
            String file = f.getFileName();
            if (file != null && !file.equals("T.java") && !file.equals("TestMain.java") && !file.equals("Tests.java")
                    && !f.getClassName().startsWith("java.") && !f.getClassName().startsWith("jdk.")) {
                sb.append("\n    tại ").append(file).append(":").append(f.getLineNumber()).append(" (").append(f.getMethodName()).append(")");
                break;
            }
        }
        if (e.getCause() != null && e.getCause() != e) sb.append("\n    nguyên nhân: ").append(e.getCause());
        return sb.toString();
    }

    // ---------- assertion ----------
    public static void eq(Object expected, Object actual) {
        eq(null, expected, actual);
    }

    public static void eq(String label, Object expected, Object actual) {
        if (!same(expected, actual)) {
            throw new AssertionError((label == null ? "" : label + "\n") + "Mong đợi: " + show(expected) + "\nNhận được: " + show(actual));
        }
    }

    public static void near(double expected, double actual, double eps) {
        if (Math.abs(expected - actual) > eps) {
            throw new AssertionError("Mong đợi ≈ " + expected + " (±" + eps + ")\nNhận được: " + actual);
        }
    }

    public static void ok(boolean cond, String message) {
        if (!cond) throw new AssertionError(message);
    }

    public static void fail(String message) {
        throw new AssertionError(message);
    }

    @SuppressWarnings("unchecked")
    public static <E extends Throwable> E throwsEx(Class<E> type, Body body) {
        try {
            body.run();
        } catch (Throwable e) {
            if (type.isInstance(e)) return (E) e;
            throw new AssertionError("Mong đợi ném " + type.getSimpleName() + " nhưng ném " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
        throw new AssertionError("Mong đợi ném " + type.getSimpleName() + " nhưng không có exception nào");
    }

    private static boolean same(Object a, Object b) {
        if (a instanceof Number x && b instanceof Number y && isIntegral(x) && isIntegral(y)) {
            return x.longValue() == y.longValue();
        }
        if (a != null && b != null && a.getClass().isArray() && b.getClass().isArray()) {
            return Arrays.deepEquals(new Object[]{a}, new Object[]{b});
        }
        return Objects.equals(a, b);
    }

    private static boolean isIntegral(Number n) {
        return n instanceof Integer || n instanceof Long || n instanceof Short || n instanceof Byte;
    }

    static String show(Object o) {
        if (o == null) return "null";
        if (o instanceof String s) return "\"" + s + "\"";
        if (o instanceof Character c) return "'" + c + "'";
        if (o.getClass().isArray()) {
            String s = Arrays.deepToString(new Object[]{o});
            return s.substring(1, s.length() - 1);
        }
        return String.valueOf(o);
    }
}
