#!/usr/bin/env python3
"""Emit the website's data JSON from the validated Excel-build assets
(../../wc2026/data.py + annex_c.json) so the site stays identical to the workbook.

Run:  python3 scripts/gen-data.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WC = os.path.join(HERE, "..", "..", "wc2026")
OUT = os.path.join(HERE, "..", "src", "data")
sys.path.insert(0, WC)

import data  # noqa: E402  (from ../../wc2026/data.py)


def fi_code(code: str) -> str:
    """Map a data.py iso/subdivision code to a flag-icons class code."""
    if len(code) == 2:
        return code.lower()
    # 'gbeng' -> 'gb-eng', 'gbsct' -> 'gb-sct'
    return code[:2].lower() + "-" + code[2:].lower()


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    teams = {
        g: [{"name": name, "iso": fi_code(code)} for name, code in members]
        for g, members in data.GROUPS.items()
    }

    schedule = {
        "fixtures": [list(p) for p in data.FIXTURES],
        "thirdSlotWinners": list(data.THIRD_SLOT_WINNERS),
        "roundOf32": {str(n): [list(s) for s in sides] for n, sides in data.ROUND_OF_32.items()},
        "knockout": {str(n): [list(s) for s in sides] for n, sides in data.KNOCKOUT.items()},
        "rounds": {k: list(v) for k, v in data.ROUND_NAMES.items()},
    }

    annex = data.load_annex_c()

    with open(os.path.join(OUT, "teams.json"), "w", encoding="utf-8") as fh:
        json.dump(teams, fh, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT, "schedule.json"), "w", encoding="utf-8") as fh:
        json.dump(schedule, fh, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT, "annexC.json"), "w", encoding="utf-8") as fh:
        json.dump(annex, fh, ensure_ascii=False, separators=(",", ":"), sort_keys=True)

    print(f"teams: {sum(len(v) for v in teams.values())} across {len(teams)} groups")
    print(f"annexC combos: {len(annex)}")
    print(f"wrote -> {os.path.relpath(OUT, HERE)}/[teams|schedule|annexC].json")


if __name__ == "__main__":
    main()
