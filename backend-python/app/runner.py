"""Chạy code Python của người học trong process con: thư mục tạm riêng, timeout, giới hạn output."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path

HARNESS_DIR = Path(__file__).resolve().parent.parent / "harness"


@dataclass(frozen=True)
class RunnerConfig:
    timeout_seconds: float = float(os.getenv("RUNNER_TIMEOUT", "20"))
    test_timeout_seconds: float = float(os.getenv("RUNNER_TEST_TIMEOUT", "6"))
    max_concurrent: int = int(os.getenv("RUNNER_MAX_CONCURRENT", "3"))
    max_output_bytes: int = 65536
    max_code_chars: int = 60000


class RunnerBusy(Exception):
    pass


class CodeTooLong(Exception):
    pass


def _limit_resources():  # pragma: no cover - chỉ chạy trên Linux/macOS
    import resource
    mem = 512 * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (mem, mem))


class PythonRunner:
    def __init__(self, config: RunnerConfig | None = None):
        self.config = config or RunnerConfig()
        self._slots = threading.BoundedSemaphore(self.config.max_concurrent)

    def run(self, code: str, tests: str | None, test_mode: bool) -> dict:
        if len(code) > self.config.max_code_chars:
            raise CodeTooLong(f"Code quá dài (tối đa {self.config.max_code_chars} ký tự)")
        start = time.perf_counter()
        syntax = self._syntax_error(code)
        if syntax:
            return self._result(False, [syntax], [], "", "", False, start, None)
        if not self._slots.acquire(timeout=15):
            raise RunnerBusy("Máy chấm đang bận, thử lại sau vài giây")
        tmp = Path(tempfile.mkdtemp(prefix="pyrun"))
        try:
            return self._execute(tmp, code, tests, test_mode, start)
        finally:
            self._slots.release()
            shutil.rmtree(tmp, ignore_errors=True)

    @staticmethod
    def _syntax_error(code: str) -> dict | None:
        try:
            compile(code, "solution.py", "exec")  # chỉ biên dịch, không chạy
        except SyntaxError as e:
            return {"file": "solution.py", "line": e.lineno or 0, "column": e.offset or 0,
                    "message": f"{type(e).__name__}: {e.msg}"}
        return None

    def _execute(self, tmp: Path, code: str, tests: str | None, test_mode: bool, start: float) -> dict:
        (tmp / "solution.py").write_text(code, encoding="utf-8")
        results = tmp / "results.json"
        if test_mode:
            (tmp / "tests.py").write_text(tests or "", encoding="utf-8")
            for f in ("harness.py", "checker.py"):
                shutil.copy(HARNESS_DIR / f, tmp / f)
            cmd = [sys.executable, "-I", "-X", "utf8", "harness.py", str(results), str(self.config.test_timeout_seconds)]
        else:
            cmd = [sys.executable, "-I", "-X", "utf8", "solution.py"]

        env = {"PYTHONIOENCODING": "utf-8", "PYTHONDONTWRITEBYTECODE": "1",
               "SYSTEMROOT": os.environ.get("SYSTEMROOT", ""), "PATH": os.environ.get("PATH", ""),
               "TEMP": str(tmp), "TMP": str(tmp), "TMPDIR": str(tmp)}
        kwargs = {}
        if os.name == "posix":
            kwargs["preexec_fn"] = _limit_resources
        timed_out = False
        with open(tmp / "stdout.txt", "wb") as out, open(tmp / "stderr.txt", "wb") as err:
            proc = subprocess.Popen(cmd, cwd=tmp, stdout=out, stderr=err, stdin=subprocess.DEVNULL, env=env, **kwargs)
            try:
                proc.wait(timeout=self.config.timeout_seconds)
            except subprocess.TimeoutExpired:
                timed_out = True
                proc.kill()
                proc.wait(timeout=5)
        stdout, stderr = self._read(tmp / "stdout.txt"), self._read(tmp / "stderr.txt")
        timeout_msg = f"Quá thời gian {self.config.timeout_seconds:g}s, đã dừng chương trình" if timed_out else None
        if not test_mode:
            return self._result(True, [], [], stdout, stderr, timed_out, start, timeout_msg)

        test_results, error = [], timeout_msg
        if results.exists():
            data = json.loads(results.read_text(encoding="utf-8"))
            test_results = data["tests"]
            if data.get("error"):
                error = "Lỗi khi nạp bài / bộ test: " + data["error"]
        elif error is None:
            error = "Chương trình dừng trước khi chấm xong (xem stderr)"
        return self._result(True, [], test_results, stdout, stderr, timed_out, start, error)

    def _read(self, path: Path) -> str:
        with open(path, "rb") as f:
            data = f.read(self.config.max_output_bytes + 1)
        text = data[: self.config.max_output_bytes].decode("utf-8", errors="replace")
        return text + "\n… (output bị cắt bớt)" if len(data) > self.config.max_output_bytes else text

    @staticmethod
    def _result(compiled, diagnostics, tests, stdout, stderr, timed_out, start, error) -> dict:
        passed = sum(1 for t in tests if t["pass"])
        return {"compiled": compiled, "diagnostics": diagnostics, "tests": tests, "passed": passed,
                "total": len(tests), "stdout": stdout, "stderr": stderr, "timedOut": timed_out,
                "timeMs": int((time.perf_counter() - start) * 1000), "error": error}
