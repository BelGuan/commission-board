from __future__ import annotations

import json
import sys

SAFE_BUILTINS = {
    "len": len,
    "sorted": sorted,
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
    "any": any,
    "all": all,
    "list": list,
    "set": set,
    "sum": sum,
    "min": min,
    "max": max,
}

def main() -> int:
    if len(sys.argv) < 2:
        print("usage: jsonq.py <expression>", file=sys.stderr)
        return 2

    raw = sys.stdin.read().strip()
    if not raw:
        print("")
        return 0

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        print("")
        return 0

    try:
        value = eval(sys.argv[1], {"__builtins__": SAFE_BUILTINS}, {"d": data})
    except Exception:
        print("")
        return 0

    if value is None:
        print("null")
    elif isinstance(value, bool):
        print("true" if value else "false")
    elif isinstance(value, (list, dict)):
        print(json.dumps(value))
    else:
        print(value)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
