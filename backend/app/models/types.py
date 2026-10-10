from __future__ import annotations

import enum
from typing import Any

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Numeric

def enum_column(py_enum: type[enum.Enum], name: str) -> SAEnum:
    return SAEnum(
        py_enum,
        name=name,
        native_enum=False,
        length=32,
        values_callable=lambda enum_cls: [member.value for member in enum_cls],
    )

def money_column() -> Any:
    return Numeric(10, 2)
