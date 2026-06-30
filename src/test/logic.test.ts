import { describe, it, expect } from 'vitest';
import { rankGroup } from '../lib/standings';
import { rankThirds } from '../lib/thirds';
import { computeBracket } from '../lib/bracket';
import { TEAMS, GROUP_IDS, ROUND_OF_32, ANNEX_C } from '../data';
import type { Cards, GroupId, GroupRow, GroupState, KnockoutResult } from '../lib/types';

function group(
  scores: ([number, number] | null)[],
  cards?: Partial<Record<number, [number, number]>>,
  lots?: Partial<Record<number, number>>,
): GroupState {
  return {
    scores: scores.map((s) => (s ? { hg: s[0], ag: s[1] } : { hg: null, ag: null })),
    cards: [1, 2, 3, 4].map((p): Cards => {
      const c = cards?.[p];
      return { y: c?.[0] ?? 0, r: c?.[1] ?? 0 };
    }),
    lots: [1, 2, 3, 4].map((p) => lots?.[p] ?? null),
  };
}

// FIXTURES = [(1,2),(3,4),(1,3),(2,4),(1,4),(2,3)]
const CLEAR: ([number, number] | null)[] = [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0]];

describe('group standings (full FIFA)', () => {
  it('clear order: position 1 wins the group', () => {
    const rows = rankGroup(TEAMS.A, group(CLEAR));
    expect(rows.map((r) => r.team.name)).toEqual(
      TEAMS.A.map((t) => t.name), // pos1..pos4 already the clear order
    );
    expect(rows[0]!.stats.pts).toBe(9);
    expect(rows[3]!.stats.pts).toBe(0);
  });

  it('two-way tie resolved by head-to-head', () => {
    // T2 & T3 both (Pts6, GD+3, GF4); T2 beat T3 1-0 -> T2 ranks above T3.
    const rows = rankGroup(
      TEAMS.A,
      group([[0, 3], [2, 0], [0, 2], [0, 1], [0, 1], [1, 0]]),
    );
    expect(rows[0]!.team.name).toBe('South Africa'); // pos2
    expect(rows[1]!.team.name).toBe('Korea Republic'); // pos3
    expect(rows[0]!.stats.pts).toBe(rows[1]!.stats.pts);
    expect(rows[0]!.stats.gd).toBe(rows[1]!.stats.gd);
  });

  it('fair-play breaks an otherwise exact tie', () => {
    // everyone draws everything -> all level incl. H2H; pos2 has most cards -> last
    const draws: ([number, number] | null)[] = [[0, 0], [0, 0], [1, 1], [1, 1], [2, 2], [2, 2]];
    const rows = rankGroup(TEAMS.A, group(draws, { 2: [5, 0] }));
    expect(rows[3]!.team.name).toBe(TEAMS.A[1]!.name); // pos2 ranked last
  });

  it('manual lots break a full tie', () => {
    const draws: ([number, number] | null)[] = [[0, 0], [0, 0], [1, 1], [1, 1], [2, 2], [2, 2]];
    const rows = rankGroup(TEAMS.A, group(draws, undefined, { 2: 1 }));
    expect(rows[0]!.team.name).toBe(TEAMS.A[1]!.name); // pos2 forced first
  });
});

function clearStandings(): Record<GroupId, GroupRow[]> {
  const s = {} as Record<GroupId, GroupRow[]>;
  for (const g of GROUP_IDS) s[g] = rankGroup(TEAMS[g], group(CLEAR));
  return s;
}

const noLots = Object.fromEntries(GROUP_IDS.map((g) => [g, null])) as Record<GroupId, number | null>;

describe('third place + bracket', () => {
  it('clear order yields combo key ABCDEFGH with 8 qualifiers', () => {
    const thirds = rankThirds(clearStandings(), noLots);
    expect(thirds.comboKey).toBe('ABCDEFGH');
    expect(thirds.qualifiedGroups.length).toBe(8);
  });

  it('Round of 32 pairings match Annex C slotting', () => {
    const standings = clearStandings();
    const thirds = rankThirds(standings, noLots);
    const amap = ANNEX_C[thirds.comboKey]!;
    const homeWins: Record<number, KnockoutResult> = {};
    for (let n = 73; n <= 104; n++) homeWins[n] = { hg: 1, ag: 0, pens: null };
    const bracket = computeBracket(standings, thirds, homeWins);

    const sideName = (side: [string, string]): string => {
      const [kind, g] = side;
      if (kind === 'W') return standings[g as GroupId][0]!.team.name;
      if (kind === 'RU') return standings[g as GroupId][1]!.team.name;
      return standings[amap[g]! as GroupId][2]!.team.name; // 3W
    };
    for (let n = 73; n <= 88; n++) {
      const [s1, s2] = ROUND_OF_32[String(n)]!;
      expect(bracket.matches[n]!.home!.name).toBe(sideName(s1 as [string, string]));
      expect(bracket.matches[n]!.away!.name).toBe(sideName(s2 as [string, string]));
    }
  });

  it('home wins everywhere -> champion is Runner-up A (South Africa)', () => {
    const standings = clearStandings();
    const thirds = rankThirds(standings, noLots);
    const homeWins: Record<number, KnockoutResult> = {};
    for (let n = 73; n <= 104; n++) homeWins[n] = { hg: 1, ag: 0, pens: null };
    const bracket = computeBracket(standings, thirds, homeWins);
    expect(bracket.champion!.name).toBe(standings.A[1]!.team.name);
    expect(bracket.champion!.name).toBe('South Africa');
    expect(bracket.thirdPlace).not.toBeNull();
  });

  it('penalty winner decides a drawn knockout match', () => {
    const standings = clearStandings();
    const thirds = rankThirds(standings, noLots);
    const ko: Record<number, KnockoutResult> = { 73: { hg: 1, ag: 1, pens: 'away' } };
    const bracket = computeBracket(standings, thirds, ko);
    const m = bracket.matches[73]!;
    expect(m.winner!.name).toBe(m.away!.name);
    expect(m.loser!.name).toBe(m.home!.name);
  });
});
