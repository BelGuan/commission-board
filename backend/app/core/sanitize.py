from __future__ import annotations

import html
import re
from typing import Annotated, TypeVar

from pydantic import AfterValidator

_DANGEROUS_BLOCKS = re.compile(
    r"<(script|style|iframe|object|embed|noscript)\b[^>]*>.*?</\1\s*>",
    re.IGNORECASE | re.DOTALL,
)
_DANGEROUS_OPEN = re.compile(
    r"<(script|style|iframe|object|embed|noscript)\b.*", re.IGNORECASE | re.DOTALL
)
_ANY_TAG = re.compile(r"<[^>]*>")
_WHITESPACE = re.compile(r"[ \t\r\f\v]+")

def strip_html(value: str) -> str:
    cleaned = _DANGEROUS_BLOCKS.sub(" ", value)
    cleaned = _DANGEROUS_OPEN.sub(" ", cleaned)
    cleaned = _ANY_TAG.sub(" ", cleaned)
    cleaned = html.unescape(cleaned)
    cleaned = _ANY_TAG.sub(" ", cleaned)
    cleaned = _WHITESPACE.sub(" ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()

def _strip_optional(value: str | None) -> str | None:
    return None if value is None else strip_html(value)

T = TypeVar("T")

CleanText = Annotated[str, AfterValidator(strip_html)]
CleanTextOptional = Annotated[str | None, AfterValidator(_strip_optional)]
