import java.io.PrintStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;

/** Chế độ "Chạy": tìm class đầu tiên có public static void main(String[]) và gọi nó. */
public class RunMain {
    public static void main(String[] classNames) throws Throwable {
        System.setOut(new PrintStream(System.out, true, StandardCharsets.UTF_8));
        for (String name : classNames) {
            Class<?> c = Class.forName(name);
            try {
                Method m = c.getDeclaredMethod("main", String[].class);
                if (!Modifier.isStatic(m.getModifiers())) continue;
                m.setAccessible(true);
                try {
                    m.invoke(null, (Object) new String[0]);
                } catch (InvocationTargetException e) {
                    throw e.getCause();
                }
                System.out.flush();
                System.exit(0);
            } catch (NoSuchMethodException ignored) {
                // thử class tiếp theo
            }
        }
        System.err.println("Không tìm thấy hàm main. Thêm vào code của bạn ví dụ:\n"
                + "class Main { public static void main(String[] args) { System.out.println(\"Hello\"); } }");
        System.exit(1);
    }
}
