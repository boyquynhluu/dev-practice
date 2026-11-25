# Dev Practice — luyện BE & FE ngay trên web

Mỗi bài gồm **lý thuyết** ngắn, **câu hỏi nhanh**, **gợi ý** từng bước và một **bài tập có test chấm tự động**. Bạn viết code trong trình duyệt, bấm *Chạy test* là biết ngay test nào qua, test nào hỏng, kèm thông báo *Mong đợi / Nhận được*.

| Lộ trình | Số bài | Chấm ở đâu |
|---|---|---|
| ⚛ Frontend (JS, DOM, async, React 19) | 15 | trong trình duyệt (iframe + Babel) |
| ☕ Backend Java 21 | 39 | `backend-java` (Spring Boot, cổng 8081) |
| 🐍 Backend Python 3 | 15 | `backend-python` (FastAPI, cổng 8082) |

Ngoài ra có trang **🗺 Roadmap Backend 84 ngày** (`/roadmap`): 12 tuần, 24 công nghệ (Java 21, Spring Boot/Security, MySQL, Redis, Transaction, Indexing, Monolith/Microservices/DDD/Clean Architecture, System Design, Kafka, Docker, CI/CD, AWS, Monitoring, Design Patterns, Concurrency, Performance, Testing). Mỗi công nghệ có một bài riêng (java-16 tới java-39). Chủ đề code được thì có bài chấm tự động, ví dụ mini DI container, filter chain, keyset pagination, mini Redis, optimistic locking, aggregate DDD, idempotency key và mini Mockito. Chủ đề hạ tầng (Indexing, Kafka, Docker, AWS, Monitoring…) là bài **lý thuyết + quiz**, kèm mục *Thực hành thêm*. Mỗi buổi có trạng thái *Chưa học / Đang học / Hoàn thành*, phút thực tế, ghi chú hoặc link code, tự đánh giá 1–5, và link sang bài luyện Java liên quan nếu có. Tiến độ lưu ở backend-java.

Mỗi lộ trình chia 3 mức: **Core**, **Intermediate** và **Advanced**. Mức Advanced gồm concurrency, cache, rate limiter, circuit breaker, asyncio, WSGI và state manager.

## Kiến trúc

```
frontend (Vite + React, :5173) ── proxy /api/java, /api/progress ──▶ backend-java   (Spring Boot 3.5, H2, :8081)
                               └─ proxy /api/python ─────────────▶ backend-python (FastAPI, :8082)
```

- **backend-java**: phục vụ đề Java, biên dịch bằng `javac` ngay trong process, rồi chạy code ở một **JVM con** (`-Xmx256m`, có timeout). Đồng thời lưu **tiến độ học** (H2 file `backend-java/data/`, migration bằng Flyway).
- **backend-python**: phục vụ đề Python, chạy code ở **process con** (`python -I`, có timeout và thư mục tạm riêng).
- **frontend**: chấm bài FE trong iframe `sandbox.html`. Babel biên dịch JSX, có cơ chế chặn vòng lặp vô hạn, và `localStorage` của bài tập là bản giả trong bộ nhớ. Khi backend tắt, tiến độ tạm lưu ở trình duyệt rồi tự đồng bộ khi backend chạy lại.

> ⚠ Hai backend **chạy code bạn gõ** trên máy của bạn. Vì vậy chúng chỉ nghe trên `127.0.0.1`. Đừng mở các cổng này ra mạng ngoài.

## Yêu cầu

- JDK 21 (phải là JDK, không phải JRE, vì cần `javac`) và Maven 3.8+
- Python 3.10+
- Node 20.19+ (hoặc 22.12+)

## Cài đặt lần đầu

```powershell
cd backend-python
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
cd ..\frontend
npm install
```

## Chạy

Cách nhanh trên Windows là mở 3 cửa sổ PowerShell cùng lúc:

```powershell
.\start-dev.ps1
```

Hoặc chạy thủ công, mỗi lệnh trong một terminal riêng:

```powershell
cd backend-java;   mvn spring-boot:run
cd backend-python; .venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8082
cd frontend;       npm run dev
```

Sau đó mở **http://localhost:5173**.

Chỉ học Frontend thì không cần chạy backend nào (tiến độ sẽ lưu trong trình duyệt).

## Roadmap Backend 84 ngày

- Kế hoạch gốc: `docs/java/Backend_84_Day_Learning_Roadmap.xlsx`, sheet *Ke hoach 84 ngay*.
- Bản chạy được: `backend-java/src/main/resources/roadmap/backend-84-days.json`, gồm ngày, tuần, nhóm, công nghệ, chủ đề, cách học, số phút dự kiến và các bài luyện liên quan.
- Sửa file xlsx xong thì xuất lại JSON. Sau đó khởi động lại backend-java:

  ```powershell
  pip install openpyxl
  python docs/java/export_roadmap.py
  ```

  Bảng ghép buổi với bài luyện (`LESSONS`) nằm ở đầu script.
- Phần theo dõi (trạng thái, phút thực tế, ghi chú, tự đánh giá) lưu ở bảng `roadmap_progress` (Flyway `V2__roadmap.sql`). Migration này đã đánh dấu sẵn buổi 1–3 là *Hoàn thành*, đúng như trong file xlsx.
- API: `GET /api/roadmap`, `PUT /api/roadmap/{day}` với body `{status, actualMinutes, note, selfRating}` (ghi đè cả 4 trường), `DELETE /api/roadmap` để xoá tiến độ roadmap.

## Phím tắt trong editor

| Phím | Tác dụng |
|---|---|
| `Ctrl+Enter` | Chạy test (chấm bài) |
| `Shift+Enter` | Chạy code (Java: hàm `main`; Python: chạy file; FE: render `App` ở tab Preview) |

## Kiểm tra bộ đề

```powershell
cd backend-java;   mvn test                                               # lời giải Java qua hết test, code khởi đầu thì chưa
cd backend-python; .venv\Scripts\python -m unittest discover -s tests -v
cd frontend;       npm run dev   # rồi mở http://localhost:5173/verify.html
```

## Thêm bài mới

Mỗi bài là một file `.lesson`:

- `frontend/src/lessons/`
- `backend-java/src/main/resources/lessons/`
- `backend-python/lessons/`

Cả ba nơi dùng chung một định dạng:

```
%%% meta
id: java-16
title: Tên bài
level: core | intermediate | advanced
topic: Chủ đề
order: 16
%%% theory
Markdown…
%%% quiz
? Câu hỏi
- đáp án sai
* đáp án đúng
> giải thích
%%% hints
- gợi ý 1
%%% starter
code khởi đầu
%%% tests
code test
%%% solution
lời giải
```

Bài **chỉ có lý thuyết + quiz**: bỏ trống các phần `starter`, `tests` và `solution` (hoặc không viết các phần đó). Bài loại này cần ít nhất 4 câu hỏi, không hiện editor, và được tính hoàn thành khi trả lời đúng hết. Phần `hints` sẽ hiện dưới tên *Thực hành thêm*.

Bộ test viết như sau:

- **Java**: `class Tests { static void run(T t) { t.test("tên", () -> T.eq(mong_đợi, thực_tế)); } }`. Có sẵn `T.eq`, `T.ok`, `T.near`, `T.throwsEx`.
- **Python**: `from checker import test, eq, ok, raises, near` rồi `@test("tên")`. Hàm test có thể là `async def`.
- **FE**: `test('tên', async () => { expect(x).toEqual(y) })`. Có sẵn `render`, `click`, `type`, `submit`, `flush`, `waitFor`, `$`, `all`, `getByText`, `mockFetch`, `fn`.

Thêm bài xong, chạy lại phần **Kiểm tra bộ đề** để chắc chắn lời giải qua hết test.

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` (java) | 8081 | cổng backend-java |
| `DATA_DIR` (java) | `./data` | nơi lưu file H2 |
| `CORS_ORIGINS` | localhost:5173 và :4173 | origin được phép gọi API |
| `RUNNER_TIMEOUT`, `RUNNER_TEST_TIMEOUT` (python) | 20, 6 | giây |
| `JAVA_API`, `PYTHON_API` (frontend) | `http://127.0.0.1:8081`, `:8082` | đích proxy của Vite |
