"""backend-python: bài Python + chấm bài. Chạy: uvicorn app.main:app --port 8082"""
from __future__ import annotations

import os
import platform
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

from .lessons import load_all
from .runner import CodeTooLong, PythonRunner, RunnerBusy

LESSON_DIR = Path(__file__).resolve().parent.parent / "lessons"

app = FastAPI(title="dev-practice backend-python", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173").split(","),
                   allow_methods=["GET", "POST"], allow_headers=["*"])

LESSONS = load_all(LESSON_DIR)
RUNNER = PythonRunner()


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        self.status, self.message = status, message


def ok(data=None) -> dict:
    return {"success": True, "data": data}


def error_body(status: int, error: str, message: str, path: str, field_errors=None) -> dict:
    body = {"timestamp": datetime.now(timezone.utc).isoformat(), "status": status, "error": error,
            "message": message, "path": path}
    if field_errors:
        body["fieldErrors"] = field_errors
    return body


@app.exception_handler(ApiError)
async def handle_api_error(request: Request, exc: ApiError):
    return JSONResponse(status_code=exc.status, content=error_body(exc.status, "Error", exc.message, request.url.path))


@app.exception_handler(StarletteHTTPException)
async def handle_http(request: Request, exc: StarletteHTTPException):
    message = "Không tìm thấy đường dẫn" if exc.status_code == 404 else str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content=error_body(exc.status_code, "Error", message, request.url.path))


@app.exception_handler(RequestValidationError)
async def handle_validation(request: Request, exc: RequestValidationError):
    fields = {}
    for e in exc.errors():
        loc = ".".join(str(x) for x in e["loc"] if x != "body")
        fields.setdefault(loc or "body", e["msg"])
    return JSONResponse(status_code=400, content=error_body(400, "Bad Request", "Dữ liệu không hợp lệ", request.url.path, fields))


class RunRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    lesson_id: str | None = Field(default=None, alias="lessonId")
    code: str = Field(min_length=1)
    mode: Literal["run", "test"]


@app.get("/api/python/health")
def health():
    return ok({"status": "UP", "python": platform.python_version()})


@app.get("/api/python/lessons")
def list_lessons():
    return ok([l.summary() for l in LESSONS.values()])


def get_lesson(lesson_id: str):
    lesson = LESSONS.get(lesson_id)
    if lesson is None:
        raise ApiError(404, f"Không có bài {lesson_id}")
    return lesson


@app.get("/api/python/lessons/{lesson_id}")
def lesson_detail(lesson_id: str):
    return ok(get_lesson(lesson_id).detail())


@app.get("/api/python/lessons/{lesson_id}/solution")
def lesson_solution(lesson_id: str):
    return ok({"solution": get_lesson(lesson_id).solution})


@app.post("/api/python/run")
def run(req: RunRequest):  # def thường: FastAPI chạy trong threadpool, không chặn event loop
    tests = None
    if req.mode == "test":
        if not req.lesson_id:
            raise ApiError(400, "Chấm bài cần lessonId")
        tests = get_lesson(req.lesson_id).tests
    try:
        return ok(RUNNER.run(req.code, tests, req.mode == "test"))
    except RunnerBusy as e:
        raise ApiError(429, str(e)) from e
    except CodeTooLong as e:
        raise ApiError(400, str(e)) from e
