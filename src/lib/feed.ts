import seedFeed from '../data/seed.json';
import { FIXTURES, GROUP_IDS, TEAMS } from '../data';
import type { GroupId, GroupRow, KnockoutResult, TournamentState } from './types';
import { rankGroup } from './standings';
import { rankThirds } from './thirds';
import { computeBracket } from './bracket';

/** Public results feed written hourly by the Azure Function. */
export const RESULTS_URL = 'https://wc26trackeaed0e.blob.core.windows.net/data/results.json';

export interface FeedMatch {
  home: string;
  away: string;
  hg: number;
  ag: number;
  pensWinner: string | null;
}

export interface OfficialFeed {
  updatedAt: string;
  matches: FeedMatch[];
}

/** Bundled snapshot used if the live feed can't be reached. */
export const FALLBACK_FEED = seedFeed as unknown as OfficialFeed;

const TEAM_GROUP = new Map<string, GroupId>();
for (const g of GROUP_IDS) for (const t of TEAMS[g]) TEAM_GROUP.set(t.name, g);

export interface MergeResult {
  state: TournamentState;
  lockedGroups: Set<string>; // `${groupId}:${fixtureIndex}`
  lockedKnockout: Set<number>; // match numbers
  updatedAt: string | null;
}

function cloneState(s: TournamentState): TournamentState {
  return {
    groups: Object.fromEntries(
      GROUP_IDS.map((g) => [
        g,
        {
          scores: s.groups[g].scores.map((x) => ({ ...x })),
          cards: s.groups[g].cards.map((c) => ({ ...c })),
          lots: [...s.groups[g].lots],
        },
      ]),
    ) as TournamentState['groups'],
    thirdLots: { ...s.thirdLots },
    knockout: Object.fromEntries(Object.entries(s.knockout).map(([k, v]) => [k, { ...v }])) as Record<
      number,
      KnockoutResult
    >,
  };
}

/**
 * Overlay official results (from the feed) onto the user's predictions. Played games win
 * and are locked; everything else keeps the prediction. Knockout games are matched onto the
 * right fixture by team name and resolved in rounds (a fixpoint) so later rounds see earlier
 * official winners.
 */
export function mergeFeed(predictions: TournamentState, feed: OfficialFeed | null): MergeResult {
  const state = cloneState(predictions);
  const lockedGroups = new Set<string>();
  const lockedKnockout = new Set<number>();
  if (!feed) return { state, lockedGroups, lockedKnockout, updatedAt: null };

  const knockout: FeedMatch[] = [];
  for (const m of feed.matches) {
    const gh = TEAM_GROUP.get(m.home);
    const ga = TEAM_GROUP.get(m.away);
    if (gh && ga && gh === ga) {
      const teams = TEAMS[gh];
      const posH = teams.findIndex((t) => t.name === m.home) + 1;
      const posA = teams.findIndex((t) => t.name === m.away) + 1;
      const fi = FIXTURES.findIndex(([x, y]) => (x === posH && y === posA) || (x === posA && y === posH));
      if (fi < 0) continue;
      const homePos = FIXTURES[fi]![0];
      state.groups[gh].scores[fi] = homePos === posH ? { hg: m.hg, ag: m.ag } : { hg: m.ag, ag: m.hg };
      lockedGroups.add(`${gh}:${fi}`);
    } else {
      knockout.push(m);
    }
  }

  // resolve knockout results round by round until nothing new can be placed
  const remaining = new Set(knockout.map((_, i) => i));
  let changed = true;
  while (changed && remaining.size) {
    changed = false;
    const standings = {} as Record<GroupId, GroupRow[]>;
    for (const g of GROUP_IDS) standings[g] = rankGroup(TEAMS[g], state.groups[g]);
    const bracket = computeBracket(standings, rankThirds(standings, state.thirdLots), state.knockout);
    for (const i of [...remaining]) {
      const m = knockout[i]!;
      const match = Object.values(bracket.matches).find(
        (mt) =>
          !!mt.home && !!mt.away &&
          ((mt.home.name === m.home && mt.away.name === m.away) ||
            (mt.home.name === m.away && mt.away.name === m.home)),
      );
      if (!match) continue;
      const homeIsFeedHome = match.home!.name === m.home;
      state.knockout[match.n] = {
        hg: homeIsFeedHome ? m.hg : m.ag,
        ag: homeIsFeedHome ? m.ag : m.hg,
        pens: m.pensWinner ? (match.home!.name === m.pensWinner ? 'home' : 'away') : null,
      };
      lockedKnockout.add(match.n);
      remaining.delete(i);
      changed = true;
    }
  }

  return { state, lockedGroups, lockedKnockout, updatedAt: feed.updatedAt };
}

/** Fetch the live feed (cache-busted). Returns null on any failure. */
export async function fetchFeed(): Promise<OfficialFeed | null> {
  try {
    const res = await fetch(`${RESULTS_URL}?cb=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as OfficialFeed;
    if (!data || !Array.isArray(data.matches)) return null;
    return data;
  } catch {
    return null;
  }
}
