export type GroupId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export type RoundId = 'R32' | 'R16' | 'QF' | 'SF' | 'TP' | 'F';

export interface Team {
  name: string;
  iso: string; // flag-icons code, e.g. "br", "gb-eng"
}

/** A single group fixture score. null = not played yet. */
export interface Score {
  hg: number | null;
  ag: number | null;
}

export interface Cards {
  y: number;
  r: number;
}

export interface GroupState {
  scores: Score[]; // 6 fixtures, in schedule order
  cards: Cards[]; // 4 teams, by original position
  lots: (number | null)[]; // 4 teams, manual tiebreak
}

export interface KnockoutResult {
  hg: number | null;
  ag: number | null;
  pens: 'home' | 'away' | null; // who won a drawn match on penalties
}

export interface TournamentState {
  groups: Record<GroupId, GroupState>;
  thirdLots: Record<GroupId, number | null>;
  knockout: Record<number, KnockoutResult>; // matches 73-104
}

export interface TeamStats {
  pld: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface GroupRow {
  idx: number; // 0-based original position within the group
  team: Team;
  stats: TeamStats;
  fair: number; // fair-play points (<= 0)
  rank: number; // 1-4
}

/** A group/knockout feeder reference as stored in schedule.json. */
export type GroupSide = ['W' | 'RU' | '3W', GroupId];
export type MatchSide = ['W' | 'L', number];
