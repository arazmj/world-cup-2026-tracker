import { FIXTURES } from '../data';
import type { GroupRow, GroupState, Team, TeamStats } from './types';

function matchPoints(gf: number, ga: number): number {
  if (gf > ga) return 3;
  if (gf === ga) return 1;
  return 0;
}

const emptyStats = (): TeamStats => ({ pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });

/**
 * Rank the 4 teams of a group using the full FIFA tiebreakers, identical to the
 * validated workbook logic:
 *   Pts -> GD -> GF -> H2H(pts,gd,gf among teams level on Pts/GD/GF)
 *        -> fair-play -> manual lots -> original position (stable, unique).
 */
export function rankGroup(teams: Team[], group: GroupState): GroupRow[] {
  const positions = [1, 2, 3, 4];
  const stats: Record<number, TeamStats> = { 1: emptyStats(), 2: emptyStats(), 3: emptyStats(), 4: emptyStats() };
  const played: { a: number; b: number; gaA: number; gaB: number }[] = [];

  FIXTURES.forEach(([home, away], fi) => {
    const s = group.scores[fi];
    if (!s || s.hg === null || s.ag === null) return;
    const hg = s.hg;
    const ag = s.ag;
    played.push({ a: home, b: away, gaA: hg, gaB: ag });
    const sides: [number, number, number][] = [
      [home, hg, ag],
      [away, ag, hg],
    ];
    for (const [t, gf, ga] of sides) {
      const st = stats[t]!;
      st.pld += 1;
      st.gf += gf;
      st.ga += ga;
      st.pts += matchPoints(gf, ga);
      if (gf > ga) st.w += 1;
      else if (gf === ga) st.d += 1;
      else st.l += 1;
    }
  });
  for (const p of positions) {
    const st = stats[p]!;
    st.gd = st.gf - st.ga;
  }

  const triple = (p: number) => `${stats[p]!.pts},${stats[p]!.gd},${stats[p]!.gf}`;
  const h2h: Record<number, { p: number; gd: number; gf: number }> = {
    1: { p: 0, gd: 0, gf: 0 }, 2: { p: 0, gd: 0, gf: 0 }, 3: { p: 0, gd: 0, gf: 0 }, 4: { p: 0, gd: 0, gf: 0 },
  };
  for (const m of played) {
    if (triple(m.a) === triple(m.b)) {
      h2h[m.a]!.p += matchPoints(m.gaA, m.gaB);
      h2h[m.a]!.gd += m.gaA - m.gaB;
      h2h[m.a]!.gf += m.gaA;
      h2h[m.b]!.p += matchPoints(m.gaB, m.gaA);
      h2h[m.b]!.gd += m.gaB - m.gaA;
      h2h[m.b]!.gf += m.gaB;
    }
  }

  const fair = (p: number) => {
    const c = group.cards[p - 1];
    return -1 * (c?.y ?? 0) - 4 * (c?.r ?? 0);
  };
  const lotKey = (p: number) => group.lots[p - 1] ?? 100;

  const sortKey = (p: number): number[] => [
    -stats[p]!.pts, -stats[p]!.gd, -stats[p]!.gf,
    -h2h[p]!.p, -h2h[p]!.gd, -h2h[p]!.gf,
    -fair(p), lotKey(p), p,
  ];

  const order = [...positions].sort((x, y) => {
    const kx = sortKey(x);
    const ky = sortKey(y);
    for (let i = 0; i < kx.length; i++) {
      if (kx[i] !== ky[i]) return kx[i]! - ky[i]!;
    }
    return 0;
  });

  return order.map((p, i) => ({
    idx: p - 1,
    team: teams[p - 1]!,
    stats: stats[p]!,
    fair: fair(p),
    rank: i + 1,
  }));
}
