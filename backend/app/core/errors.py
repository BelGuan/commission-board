from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("app.errors")

class AppError(Exception):

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "bad_request"

    def __init__(self, detail: str, *, code: str | None = None, status_code: int | None = None):
        super().__init__(detail)
        self.detail = detail
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code

class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthorized"

class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "forbidden"

class NotFoundError(AppError):

    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"

class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "conflict"

class ValidationError(AppError):
    status_code = 422
    code = "validation_error"

class PayloadTooLargeError(AppError):
    status_code = 413
    code = "payload_too_large"

class UnsupportedMediaTypeError(AppError):
    status_code = 415
    code = "unsupported_media_type"

_STATUS_CODES: dict[int, str] = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    413: "payload_too_large",
    415: "unsupported_media_type",
    422: "validation_error",
    429: "rate_limited",
    500: "internal_error",
}

def _body(detail: str, code: str, **extra: Any) -> dict[str, Any]:
    return {"detail": detail, "code": code, **extra}

def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(AppError)
    async def _app_error(_request: Request, exc: AppError) -> JSONResponse:
        headers = (
            {"WWW-Authenticate": "Bearer"}
            if exc.status_code == status.HTTP_401_UNAUTHORIZED
            else None
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_body(exc.detail, exc.code),
            headers=headers,
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _STATUS_CODES.get(exc.status_code, "error")
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(
            status_code=exc.status_code,
            content=_body(detail, code),
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = [
            {
                "field": ".".join(str(part) for part in error.get("loc", ())) or "body",
                "message": error.get("msg", "Invalid value"),
            }
            for error in exc.errors()
        ]
        first = errors[0]["field"] if errors else "request"
        return JSONResponse(
            status_code=422,
            content=_body(
                f"Request validation failed on {first}",
                "validation_error",
                errors=errors,
            ),
        )

    @app.exception_handler(Exception)
    async def _unhandled(_request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=_body("Internal server error", "internal_error"),
        )
