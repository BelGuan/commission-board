from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.database import SessionLocal
from app.models import User

PREFIX = "smoke_"

def main() -> int:
    db = SessionLocal()
    try:
        users = db.scalars(select(User).where(User.username.like(f"{PREFIX}%"))).all()
        for user in users:
            db.delete(user)
        db.commit()
        print(f"cleanup: removed {len(users)} smoke account(s)")
    finally:
        db.close()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
