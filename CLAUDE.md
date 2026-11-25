# dev-practice

Nền tảng học BE/FE: lý thuyết + quiz + bài tập chấm tự động. Chạy local, không có đăng nhập.

## Cấu trúc
- `frontend/` Vite + React 19 + react-router 7 + CodeMirror. Bài FE (`src/lessons/*.lesson`) chấm trong iframe `sandbox.html` (`src/sandbox/runtime.js`: Babel standalone 7, loop guard, expect/render helpers, localStorage giả). `verify.html` chạy toàn bộ lời giải/starter FE.
- `backend-java/` Spring Boot 3.5 / Java 21, package `com.devpractice.javaapi`: `lesson` (đọc `resources/lessons/*.lesson`), `runner` (javac in-process + JVM con, harness `resources/harness/T.java|TestMain.java|RunMain.java`), `progress` (JPA + H2 file, Flyway `db/migration`), `roadmap` (kế hoạch 84 ngày từ `resources/roadmap/backend-84-days.json` + bảng `roadmap_progress`; JSON sinh từ `docs/java/*.xlsx` bằng `docs/java/export_roadmap.py`), `common` (ApiResponse/ErrorResponse/GlobalExceptionHandler). Cổng 8081, bind 127.0.0.1.
- `backend-python/` FastAPI: `app/main.py` (routes + envelope lỗi), `app/runner.py` (process con `python -I`), `app/lessons.py`, `harness/harness.py|checker.py`, `lessons/*.lesson`. Cổng 8082.

## Quy ước
- Response thành công `{success, data}`; lỗi `{timestamp,status,error,message,path,fieldErrors?}` — giống nhau ở cả 2 backend.
- Định dạng `.lesson` dùng chung 3 nơi (xem README). Mỗi bài: starter phải biên dịch được và CHƯA qua hết test; solution phải qua hết. Bài Java không có `tests` = bài chỉ lý thuyết + quiz (≥ 4 câu, `Lesson.quizOnly()`, FE `QuizLesson`).
- Nội dung bài viết tiếng Việt.

## Lệnh kiểm tra
- `cd backend-java && mvn test` (LessonSolutionsTest + ApiIntegrationTest + RoadmapApiTest)
- `cd backend-python && .venv/Scripts/python -m unittest discover -s tests -v`
- `cd frontend && npm run build`; FE lessons: mở `/verify.html` (title thành "VERIFY OK").
