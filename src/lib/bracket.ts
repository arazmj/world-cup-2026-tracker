import { ANNEX_C, ALL_MATCH_NUMBERS, KNOCKOUT, ROUND_OF_32, roundOf } from '../data';
import type {
  GroupId, GroupRow, GroupSide, KnockoutResult, MatchSide, RoundId, Team,
} from './types';
import type { ThirdsResult } from './thirds';

export type SlotTeam = Team | null;

export interface MatchView {
  n: number;
  round: RoundId;
  home: SlotTeam;
  away: SlotTeam;
  homeLabel: string;
  awayLabel: string;
  hg: number | null;
  ag: number | null;
  pens: 'home' | 'away' | null;
  winner: SlotTeam;
  loser: SlotTeam;
  decided: boolean;
}

export interface BracketModel {
  matches: Record<number, MatchView>;
  champion: SlotTeam;
  thirdPlace: SlotTeam;
}

function decide(home: SlotTeam, away: SlotTeam, res: KnockoutResult | undefined) {
  if (!home || !away || !res || res.hg === null || res.ag === null) {
    return { winner: null as SlotTeam, loser: null as SlotTeam, decided: false };
  }
  if (res.hg > res.ag) return { winner: home, loser: away, decided: true };
  if (res.ag > res.hg) return { winner: away, loser: home, decided: true };
  if (res.pens === 'home') return { winner: home, loser: away, decided: true };
  if (res.pens === 'away') return { winner: away, loser: home, decided: true };
  return { winner: null as SlotTeam, loser: null as SlotTeam, decided: false };
}

export function computeBracket(
  standings: Record<GroupId, GroupRow[]>,
  thirds: ThirdsResult,
  knockout: Record<number, KnockoutResult>,
): BracketModel {
  const annexMap = ANNEX_C[thirds.comboKey];
  const matches: Record<number, MatchView> = {};

  const fromGroup = (side: GroupSide): { team: SlotTeam; label: string } => {
    const [kind, g] = side;
    if (kind === 'W') return { team: standings[g][0]!.team, label: `Winner ${g}` };
    if (kind === 'RU') return { team: standings[g][1]!.team, label: `Runner-up ${g}` };
    const groupX = annexMap?.[g] as GroupId | undefined;
    return {
      team: groupX ? standings[groupX][2]!.team : null,
      label: groupX ? `3rd ${groupX}` : '3rd place',
    };
  };

  const fromMatch = (side: MatchSide): { team: SlotTeam; label: string } => {
    const [kind, n] = side;
    const m = matches[n];
    if (kind === 'W') return { team: m?.winner ?? null, label: `Winner M${n}` };
    return { team: m?.loser ?? null, label: `Loser M${n}` };
  };

  for (const n of ALL_MATCH_NUMBERS) {
    const round = roundOf(n);
    let home: { team: SlotTeam; label: string };
    let away: { team: SlotTeam; label: string };
    if (round === 'R32') {
      const [s1, s2] = ROUND_OF_32[String(n)]!;
      home = fromGroup(s1);
      away = fromGroup(s2);
    } else {
      const [s1, s2] = KNOCKOUT[String(n)]!;
      home = fromMatch(s1);
      away = fromMatch(s2);
    }
    const res = knockout[n];
    const { winner, loser, decided } = decide(home.team, away.team, res);
    matches[n] = {
      n,
      round,
      home: home.team,
      away: away.team,
      homeLabel: home.label,
      awayLabel: away.label,
      hg: res?.hg ?? null,
      ag: res?.ag ?? null,
      pens: res?.pens ?? null,
      winner,
      loser,
      decided,
    };
  }

  return {
    matches,
    champion: matches[104]?.winner ?? null,
    thirdPlace: matches[103]?.winner ?? null,
  };
}
