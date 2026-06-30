import { GROUP_IDS } from '../data';
import type { GroupId, GroupRow, Team } from './types';

export interface ThirdRow {
  group: GroupId;
  team: Team;
  pts: number;
  gd: number;
  gf: number;
  fair: number;
  lots: number | null;
  rank: number; // 1-12, unique
  qualified: boolean; // top 8
}

export interface ThirdsResult {
  rows: ThirdRow[]; // in group order A-L
  ranked: ThirdRow[]; // best -> worst
  qualifiedGroups: GroupId[]; // alphabetical
  comboKey: string; // 8 letters, alphabetical
}

/**
 * Rank the 12 third-placed teams (Pts -> GD -> GF -> fair-play -> lots -> group order)
 * and qualify the best 8, building the alphabetical combination key for Annex C.
 */
export function rankThirds(
  standings: Record<GroupId, GroupRow[]>,
  thirdLots: Record<GroupId, number | null>,
): ThirdsResult {
  const base = GROUP_IDS.map((g, i) => {
    const third = standings[g][2]!;
    return {
      group: g,
      team: third.team,
      pts: third.stats.pts,
      gd: third.stats.gd,
      gf: third.stats.gf,
      fair: third.fair,
      lots: thirdLots[g] ?? null,
      order: i,
    };
  });

  const key = (t: (typeof base)[number]): number[] => [
    -t.pts, -t.gd, -t.gf, -t.fair, t.lots ?? 100, t.order,
  ];
  const ranked = [...base].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return ka[i]! - kb[i]!;
    }
    return 0;
  });

  const rankByGroup = new Map<GroupId, number>();
  ranked.forEach((t, i) => rankByGroup.set(t.group, i + 1));

  const rows: ThirdRow[] = base.map((t) => {
    const rank = rankByGroup.get(t.group)!;
    return {
      group: t.group,
      team: t.team,
      pts: t.pts,
      gd: t.gd,
      gf: t.gf,
      fair: t.fair,
      lots: t.lots,
      rank,
      qualified: rank <= 8,
    };
  });

  const qualifiedGroups = rows.filter((r) => r.qualified).map((r) => r.group).sort();
  const comboKey = qualifiedGroups.join('');

  return {
    rows,
    ranked: ranked.map((t) => rows.find((r) => r.group === t.group)!),
    qualifiedGroups,
    comboKey,
  };
}
