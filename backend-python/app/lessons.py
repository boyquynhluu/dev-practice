"""Đọc file .lesson (cùng định dạng với backend-java và frontend)."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class QuizItem:
    question: str
    options: list[str]
    answer: int
    explain: str


@dataclass(frozen=True)
class Lesson:
    id: str
    title: str
    level: str
    topic: str
    order: int
    theory: str
    quiz: list[QuizItem] = field(default_factory=list)
    hints: list[str] = field(default_factory=list)
    starter: str = ""
    tests: str = ""
    solution: str = ""

    def summary(self) -> dict:
        return {"id": self.id, "title": self.title, "level": self.level, "topic": self.topic, "order": self.order}

    def detail(self) -> dict:
        return {**self.summary(), "language": "python", "theory": self.theory,
                "quiz": [q.__dict__ for q in self.quiz], "hints": self.hints,
                "starter": self.starter, "tests": self.tests}


def parse(source: str, file_name: str) -> Lesson:
    sections: dict[str, list[str]] = {}
    cur: list[str] | None = None
    for line in source.replace("\r\n", "\n").split("\n"):
        if line.startswith("%%% "):
            cur = sections.setdefault(line[4:].strip(), [])
        elif cur is not None:
            cur.append(line)

    def text(key: str) -> str:
        body = "\n".join(sections.get(key, [])).strip()
        return body + "\n" if body else ""

    meta = {}
    for line in sections.get("meta", []):
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    for key in ("id", "title"):
        if not meta.get(key):
            raise ValueError(f"{file_name}: thiếu meta '{key}'")
    hints = [l[2:].strip() for l in sections.get("hints", []) if l.startswith("- ")]
    return Lesson(id=meta["id"], title=meta["title"], level=meta.get("level", "core"), topic=meta.get("topic", ""),
                  order=int(meta.get("order", "0")), theory=text("theory"), quiz=parse_quiz(sections.get("quiz", [])),
                  hints=hints, starter=text("starter"), tests=text("tests"), solution=text("solution"))


def parse_quiz(lines: list[str]) -> list[QuizItem]:
    out: list[QuizItem] = []
    q, opts, ans, explain = None, [], -1, ""
    for line in lines + ["? "]:
        if line.startswith("? "):
            if q:
                out.append(QuizItem(q, opts, ans, explain))
            q, opts, ans, explain = line[2:].strip(), [], -1, ""
        elif line.startswith(("* ", "- ")):
            if line.startswith("* "):
                ans = len(opts)
            opts.append(line[2:].strip())
        elif line.startswith("> "):
            explain = (explain + " " + line[2:].strip()).strip()
    return out


def load_all(directory: Path) -> dict[str, Lesson]:
    lessons = [parse(p.read_text(encoding="utf-8"), p.name) for p in sorted(directory.glob("*.lesson"))]
    lessons.sort(key=lambda l: l.order)
    result: dict[str, Lesson] = {}
    for l in lessons:
        if l.id in result:
            raise ValueError(f"Trùng id bài: {l.id}")
        result[l.id] = l
    return result
