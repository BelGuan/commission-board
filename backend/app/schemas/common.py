from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")

class ApiModel(BaseModel):

    model_config = ConfigDict(from_attributes=True)

class Page(ApiModel, Generic[T]):

    items: list[T]
    total: int
    page: int
    page_size: int

    @property
    def has_more(self) -> bool:
        return self.page * self.page_size < self.total

class Message(ApiModel):

    detail: str

class ErrorResponse(ApiModel):

    detail: str
    code: str

class FieldError(ApiModel):
    field: str
    message: str

class ValidationErrorResponse(ErrorResponse):

    errors: list[FieldError] = Field(default_factory=list)

class HealthStatus(ApiModel):

    status: str
    database: str
    version: str
    environment: str

ERROR_RESPONSES: dict[int | str, dict] = {
    401: {"model": ErrorResponse, "description": "Missing or invalid token"},
    403: {"model": ErrorResponse, "description": "Authenticated but not permitted"},
    404: {"model": ErrorResponse, "description": "Not found, or not owned by the caller"},
    409: {"model": ErrorResponse, "description": "Conflicts with existing data"},
    422: {"model": ValidationErrorResponse, "description": "Request validation failed"},
}
