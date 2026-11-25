"""Chạy trong process con: nạp tests.py (tự import solution.py), chạy từng test có timeout, ghi kết quả JSON.

Cách dùng: python -I -X utf8 harness.py <results.json> <timeout_giây_mỗi_test>
"""
import asyncio
import inspect
import json
import os
import sys
import threading
import time
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)  # -I bỏ thư mục script khỏi sys.path, thêm lại để import solution/tests


def describe(exc):
    import checker
    if isinstance(exc, checker.Fail):
        return str(exc)
    msg = f"{type(exc).__name__}: {exc}"
    frames = [f for f in traceback.extract_tb(exc.__traceback__) if os.path.basename(f.filename) == "solution.py"]
    if frames:
        f = frames[-1]
        msg += f"\n    tại solution.py:{f.lineno} ({f.name})"
    return msg


def run_one(fn, timeout):
    box = {}

    def target():
        try:
            result = fn()
            if inspect.iscoroutine(result):
                asyncio.run(result)
        except BaseException as e:  # noqa: BLE001
            box["err"] = e

    th = threading.Thread(target=target, daemon=True)
    th.start()
    th.join(timeout)
    if th.is_alive():
        return False, f"Quá thời gian {timeout:g}s (vòng lặp vô hạn hoặc deadlock?)"
    if "err" in box:
        return False, describe(box["err"])
    return True, ""


def main():
    out_path, timeout = sys.argv[1], float(sys.argv[2])
    results, error = [], None
    try:
        import checker
        import tests  # noqa: F401  (đăng ký test qua @test)
        for name, fn in checker.REGISTRY:
            start = time.perf_counter()
            passed, message = run_one(fn, timeout)
            results.append({"name": name, "pass": passed, "message": message,
                            "ms": int((time.perf_counter() - start) * 1000)})
    except BaseException as e:  # noqa: BLE001
        error = describe(e)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"tests": results, "error": error}, f, ensure_ascii=False)
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)  # dừng cả thread non-daemon mà bài làm quên tắt


if __name__ == "__main__":
    main()
