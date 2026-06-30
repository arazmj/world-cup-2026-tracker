import seedJson from '../data/seed.json';
import { GROUP_IDS, TEAMS } from '../data';
import type { GroupId, GroupRow, KnockoutResult, Score, TournamentState } from './types';
import { rankGroup } from './standings';
import { rankThirds } from './thirds';
import { computeBracket } from './bracket';

interface SeedShape {
  asOf: string;
  group: Record<string, ([number, number] | null)[]>;
  knockout: { home: string; hg: number; away: string; ag: number; pensWinner: string | null }[];
}

const SEED = seedJson as unknown as SeedShape;

/** Date (ISO) up to which results are prefilled. */
export const SEED_AS_OF = SEED.asOf;

function emptyKnockout(): Record<number, KnockoutResult> {
  const ko: Record<number, KnockoutResult> = {};
  for (let n = 73; n <= 104; n++) ko[n] = { hg: null, ag: null, pens: null };
  return ko;
}

/**
 * Initial tournament state with every game finished as of SEED_AS_OF prefilled:
 * all group results, plus the knockout games already played (placed on the right
 * match and oriented to that match's home/away — orientation-proof via team names).
 */
export function seededState(): TournamentState {
  const groups = {} as TournamentState['groups'];
  for (const g of GROUP_IDS) {
    const raw = SEED.group[g] ?? [];
    const scores: Score[] = Array.from({ length: 6 }, (_, i) => {
      const s = raw[i];
      return s ? { hg: s[0], ag: s[1] } : { hg: null, ag: null };
    });
    groups[g] = { scores, cards: Array.from({ length: 4 }, () => ({ y: 0, r: 0 })), lots: [null, null, null, null] };
  }

  const thirdLots = Object.fromEntries(GROUP_IDS.map((g) => [g, null])) as Record<GroupId, number | null>;
  const knockout = emptyKnockout();

  // resolve the played knockout games onto their match numbers using the live bracket
  const standings = {} as Record<GroupId, GroupRow[]>;
  for (const g of GROUP_IDS) standings[g] = rankGroup(TEAMS[g], groups[g]);
  const bracket = computeBracket(standings, rankThirds(standings, thirdLots), knockout);

  for (const k of SEED.knockout) {
    const m = Object.values(bracket.matches).find(
      (mt) =>
        !!mt.home && !!mt.away &&
        ((mt.home.name === k.home && mt.away.name === k.away) ||
          (mt.home.name === k.away && mt.away.name === k.home)),
    );
    if (!m) continue;
    const homeIsSeedHome = m.home!.name === k.home;
    knockout[m.n] = {
      hg: homeIsSeedHome ? k.hg : k.ag,
      ag: homeIsSeedHome ? k.ag : k.hg,
      pens: k.pensWinner ? (m.home!.name === k.pensWinner ? 'home' : 'away') : null,
    };
  }

  return { groups, thirdLots, knockout };
}
