from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from app.core.errors import AppError

class RateLimitError(AppError):
    status_code = 429
    code = "rate_limited"

class SlidingWindowLimiter:

    def __init__(self, limit: int, window_seconds: int, name: str) -> None:
        self.limit = limit
        self.window = window_seconds
        self.name = name
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _trim(self, key: str, now: float) -> deque[float]:
        hits = self._hits[key]
        cutoff = now - self.window
        while hits and hits[0] <= cutoff:
            hits.popleft()
        return hits

    def check(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            hits = self._trim(key, now)
            if len(hits) >= self.limit:
                retry_after = int(self.window - (now - hits[0])) + 1
                raise RateLimitError(
                    f"Too many {self.name} attempts. Try again in "
                    f"{max(retry_after, 1)} seconds.",
                )
            hits.append(now)

    def reset(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._hits.clear()
            else:
                self._hits.pop(key, None)

login_limiter = SlidingWindowLimiter(limit=5, window_seconds=15 * 60, name="login")

review_limiter = SlidingWindowLimiter(limit=10, window_seconds=60 * 60, name="review")

def reset_all_limiters() -> None:
    login_limiter.reset()
    review_limiter.reset()
