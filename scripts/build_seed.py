#!/usr/bin/env python3
"""Build seed.json (results of games finished as of 2026-06-29) for the website,
parsed from the Wikipedia article and oriented to the app's group fixtures.

Run with the wc2026 venv (has bs4 + data.py + main.html):
  ./venv/bin/python build_seed.py
"""
import json
import os
import re
import sys

from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import data  # noqa: E402

CUTOFF = "2026-06-29"
NAME = {
    "Czech Republic": "Czechia",
    "Ivory Coast": "Côte d'Ivoire",
    "South Korea": "Korea Republic",
    "Turkey": "Türkiye",
    "Bosnia and Herzegovina": "Bosnia",
}


def norm(n):
    return NAME.get(n, n)


# team -> (group, position 0-3)
LOC = {}
for g in data.GROUP_LETTERS:
    for i, (name, _) in enumerate(data.GROUPS[g]):
        LOC[name] = (g, i)


def parse_played():
    soup = BeautifulSoup(open(os.path.join(HERE, "main.html"), encoding="utf-8").read(), "lxml")
    out = []
    for b in soup.find_all(class_="footballbox"):
        d = b.find(class_="fdate"); h = b.find(class_="fhome"); s = b.find(class_="fscore"); a = b.find(class_="faway")
        if not (d and h and s and a):
            continue
        iso = re.search(r"(\d{4}-\d{2}-\d{2})", d.get_text(" ", strip=True))
        if not iso or iso.group(1) > CUTOFF:
            continue
        sc = s.get_text(" ", strip=True)
        mm = re.match(r"^\s*(\d+)\s*[–-]\s*(\d+)", sc)
        if not mm:
            continue
        pens = None
        if "a.e.t" in sc:
            pm = re.search(r"Penalties\b.*?(\d+)\s*[–-]\s*(\d+)", b.get_text(" ", strip=True))
            if pm:
                pens = "home" if int(pm.group(1)) > int(pm.group(2)) else "away"
        out.append((iso.group(1), norm(h.get_text(" ", strip=True)),
                    int(mm.group(1)), int(mm.group(2)),
                    norm(a.get_text(" ", strip=True)), pens))
    return out


def main():
    played = parse_played()
    group_scores = {g: [None] * 6 for g in data.GROUP_LETTERS}
    knockout = []
    for iso, home, hg, ag, away, pens in played:
        lh, la = LOC.get(home), LOC.get(away)
        if lh and la and lh[0] == la[0]:  # same group -> group match
            g = lh[0]
            posh, posa = lh[1] + 1, la[1] + 1
            fi = next(i for i, (x, y) in enumerate(data.FIXTURES) if {x, y} == {posh, posa})
            home_pos = data.FIXTURES[fi][0]
            group_scores[g][fi] = [hg, ag] if posh == home_pos else [ag, hg]
        else:  # knockout
            pens_winner = None
            if pens == "home":
                pens_winner = home
            elif pens == "away":
                pens_winner = away
            knockout.append({"home": home, "hg": hg, "away": away, "ag": ag, "pensWinner": pens_winner})

    # sanity: every group fully played
    for g in data.GROUP_LETTERS:
        assert all(s is not None for s in group_scores[g]), f"group {g} incomplete: {group_scores[g]}"

    seed = {"asOf": CUTOFF, "group": group_scores, "knockout": knockout}

    # ---- verification against the real standings ----
    sys.path.insert(0, HERE)
    from validate_logic import compute
    print("Group standings from seed:")
    thirds = []
    for g in data.GROUP_LETTERS:
        results = {i: tuple(s) for i, s in enumerate(group_scores[g])}
        order, st, _ = compute(results)
        names = [data.GROUPS[g][p - 1][0] for p in order]
        print(f"  {g}: " + " > ".join(f"{n}({st[p]['Pts']})" for n, p in zip(names, order)))
        third_pos = order[2]
        thirds.append((g, st[third_pos]["Pts"], st[third_pos]["GD"], st[third_pos]["GF"]))
    thirds.sort(key=lambda t: (-t[1], -t[2], -t[3], data.GROUP_LETTERS.index(t[0])))
    combo = "".join(sorted(t[0] for t in thirds[:8]))
    print(f"\nBest-8 thirds combo: {combo}")
    print(f"Knockout games seeded: {len(knockout)}")
    for k in knockout:
        print("  ", k)

    out_path = os.path.join(HERE, "seed.json")
    json.dump(seed, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\nwrote {out_path}")


if __name__ == "__main__":
    main()
