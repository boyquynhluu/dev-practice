"""Mọi bài: lời giải phải qua hết test; code khởi đầu không lỗi cú pháp nhưng chưa qua hết.

Chạy: .venv/Scripts/python -m unittest discover -s tests -v
"""
import sys
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.lessons import load_all  # noqa: E402
from app.runner import PythonRunner, RunnerConfig  # noqa: E402

LESSONS = load_all(Path(__file__).resolve().parent.parent / "lessons")
RUNNER = PythonRunner(RunnerConfig(timeout_seconds=40, test_timeout_seconds=8, max_concurrent=4))


def _run(args):
    lesson, kind = args
    code = lesson.solution if kind == "solution" else lesson.starter
    return lesson.id, kind, RUNNER.run(code, lesson.tests, True)


class LessonTests(unittest.TestCase):
    def test_every_lesson(self):
        self.assertTrue(LESSONS, "không có bài nào")
        jobs = [(l, k) for l in LESSONS.values() for k in ("solution", "starter")]
        problems = []
        with ThreadPoolExecutor(4) as pool:
            for lid, kind, r in pool.map(_run, jobs):
                if not r["compiled"]:
                    problems.append(f"{lid} {kind}: lỗi cú pháp {r['diagnostics']}")
                elif kind == "solution" and (r["total"] == 0 or r["passed"] != r["total"]):
                    fails = [t for t in r["tests"] if not t["pass"]]
                    problems.append(f"{lid} solution: {r['passed']}/{r['total']} error={r['error']} fails={fails} stderr={r['stderr'][-500:]}")
                elif kind == "starter" and r["total"] > 0 and r["passed"] == r["total"]:
                    problems.append(f"{lid} starter: đã qua hết test")
                elif kind == "starter" and r["total"] == 0:
                    problems.append(f"{lid} starter: không chạy được test nào. error={r['error']}")
                else:
                    print(f"ok {lid} {kind} {r['passed']}/{r['total']} {r['timeMs']}ms")
        self.assertFalse(problems, "\n".join(problems))


if __name__ == "__main__":
    unittest.main()
