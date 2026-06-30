import { describe, it, expect } from 'vitest';
import { seededState } from '../lib/seed';
import { rankGroup } from '../lib/standings';
import { rankThirds } from '../lib/thirds';
import { computeBracket } from '../lib/bracket';
import { TEAMS, GROUP_IDS } from '../data';
import type { GroupId, GroupRow } from '../lib/types';

describe('prefilled seed (results through 2026-06-29)', () => {
  const state = seededState();
  const standings = {} as Record<GroupId, GroupRow[]>;
  for (const g of GROUP_IDS) standings[g] = rankGroup(TEAMS[g], state.groups[g]);
  const thirds = rankThirds(standings, state.thirdLots);
  const bracket = computeBracket(standings, thirds, state.knockout);
  const match = (h: string, a: string) =>
    Object.values(bracket.matches).find((m) => m.home?.name === h && m.away?.name === a);

  it('reproduces the real group winners', () => {
    const winners = Object.fromEntries(GROUP_IDS.map((g) => [g, standings[g][0]!.team.name]));
    expect(winners).toMatchObject({
      A: 'Mexico', B: 'Switzerland', C: 'Brazil', D: 'United States', E: 'Germany', F: 'Netherlands',
      G: 'Belgium', H: 'Spain', I: 'France', J: 'Argentina', K: 'Colombia', L: 'England',
    });
    expect(standings.A[0]!.stats.pts).toBe(9);
  });

  it('produces the real best-thirds combination BDEFIJKL', () => {
    expect(thirds.comboKey).toBe('BDEFIJKL');
  });

  it('places the three played Round-of-32 games correctly', () => {
    // South Africa 0–1 Canada
    const sac = match('South Africa', 'Canada')!;
    expect([sac.hg, sac.ag]).toEqual([0, 1]);
    expect(sac.winner?.name).toBe('Canada');
    // Brazil 2–1 Japan
    const brj = match('Brazil', 'Japan')!;
    expect([brj.hg, brj.ag]).toEqual([2, 1]);
    expect(brj.winner?.name).toBe('Brazil');
    // Germany 1–1 Paraguay (Paraguay win on penalties)
    const gpa = match('Germany', 'Paraguay')!;
    expect([gpa.hg, gpa.ag]).toEqual([1, 1]);
    expect(gpa.pens).toBe('away');
    expect(gpa.winner?.name).toBe('Paraguay');
  });

  it('leaves not-yet-played games empty', () => {
    // a later R32 game (Netherlands vs Morocco) has no score yet
    const m = match('Netherlands', 'Morocco');
    expect(m && m.hg).toBeNull();
    expect(bracket.champion).toBeNull();
  });
});
