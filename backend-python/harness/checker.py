"""Bộ test tí hon dùng để chấm bài Python.

Trong file tests: from checker import test, eq, ok, raises, near
    @test("tên test")
    def _():
        eq(mong_doi, thuc_te)
"""
import math

REGISTRY = []


def test(name):
    def deco(fn):
        REGISTRY.append((name, fn))
        return fn
    return deco


class Fail(AssertionError):
    pass


def eq(expected, actual, label=None):
    if expected != actual or not (_related(expected, actual) or _num_pair(expected, actual)):
        prefix = f"{label}\n" if label else ""
        raise Fail(f"{prefix}Mong đợi: {expected!r}\nNhận được: {actual!r}")


def _related(a, b):
    """True == 1 nhưng bool khác int; dict và defaultdict thì chấp nhận."""
    if isinstance(a, bool) != isinstance(b, bool):
        return False
    return isinstance(a, type(b)) or isinstance(b, type(a))


def _num_pair(a, b):
    return isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool) and not isinstance(b, bool)


def near(expected, actual, eps=1e-9):
    if not math.isclose(expected, actual, abs_tol=eps):
        raise Fail(f"Mong đợi ≈ {expected!r} (±{eps})\nNhận được: {actual!r}")


def ok(cond, message="điều kiện sai"):
    if not cond:
        raise Fail(message)


def raises(exc_type, fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except exc_type as e:
        return e
    except BaseException as e:  # noqa: BLE001
        raise Fail(f"Mong đợi ném {exc_type.__name__} nhưng ném {type(e).__name__}: {e}") from None
    raise Fail(f"Mong đợi ném {exc_type.__name__} nhưng không có exception nào")
