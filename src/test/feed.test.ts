import { describe, it, expect } from 'vitest';
import { mergeFeed, FALLBACK_FEED } from '../lib/feed';
import { blankState } from '../lib/persistence';
import { rankGroup } from '../lib/standings';
import { rankThirds } from '../lib/thirds';
import { computeBracket } from '../lib/bracket';
import { TEAMS, GROUP_IDS } from '../data';
import type { GroupId, GroupRow } from '../lib/types';

describe('mergeFeed (live results overlay)', () => {
  it('orients a group result to its fixture and locks it', () => {
    const feed = { updatedAt: 'x', matches: [{ home: 'Mexico', away: 'South Africa', hg: 2, ag: 0, pensWinner: null }] };
    const r = mergeFeed(blankState(), feed);
    // fixture 0 is positions (1,2) = Mexico vs South Africa, home = Mexico
    expect(r.state.groups.A.scores[0]).toEqual({ hg: 2, ag: 0 });
    expect(r.lockedGroups.has('A:0')).toBe(true);
    expect(r.lockedGroups.has('A:1')).toBe(false);
  });

  it('official results override a conflicting prediction', () => {
    const pred = blankState();
    pred.groups.A.scores[0] = { hg: 9, ag: 9 };
    const r = mergeFeed(pred, FALLBACK_FEED);
    expect(r.state.groups.A.scores[0]).toEqual({ hg: 2, ag: 0 });
  });

  it('the bundled fallback reproduces real standings, combo, and locks played games', () => {
    const r = mergeFeed(blankState(), FALLBACK_FEED);
    const standings = {} as Record<GroupId, GroupRow[]>;
    for (const g of GROUP_IDS) standings[g] = rankGroup(TEAMS[g], r.state.groups[g]);
    expect(standings.A[0]!.team.name).toBe('Mexico');
    expect(standings.A[0]!.stats.pts).toBe(9);

    const thirds = rankThirds(standings, r.state.thirdLots);
    expect(thirds.comboKey).toBe('BDEFIJKL');

    const bracket = computeBracket(standings, thirds, r.state.knockout);
    const brj = Object.values(bracket.matches).find((m) => m.home?.name === 'Brazil' && m.away?.name === 'Japan')!;
    expect([brj.hg, brj.ag]).toEqual([2, 1]);
    expect(r.lockedKnockout.has(brj.n)).toBe(true);

    // games not yet played stay open for prediction
    expect(bracket.champion).toBeNull();
  });

  it('returns no locks when there is no feed', () => {
    const r = mergeFeed(blankState(), null);
    expect(r.lockedGroups.size).toBe(0);
    expect(r.lockedKnockout.size).toBe(0);
    expect(r.updatedAt).toBeNull();
  });
});
