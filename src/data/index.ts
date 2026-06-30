import teamsJson from './teams.json';
import scheduleJson from './schedule.json';
import annexJson from './annexC.json';
import type { GroupId, GroupSide, MatchSide, RoundId, Team } from '../lib/types';

export const TEAMS = teamsJson as Record<GroupId, Team[]>;
export const GROUP_IDS = Object.keys(TEAMS) as GroupId[];

/** 6 round-robin pairings (1-based team positions). */
export const FIXTURES = scheduleJson.fixtures as [number, number][];

/** Winners that face a third-placed team, in Annex C column order. */
export const THIRD_SLOT_WINNERS = scheduleJson.thirdSlotWinners as GroupId[];

export const ROUND_OF_32 = scheduleJson.roundOf32 as unknown as Record<string, [GroupSide, GroupSide]>;
export const KNOCKOUT = scheduleJson.knockout as unknown as Record<string, [MatchSide, MatchSide]>;
export const ROUNDS = scheduleJson.rounds as unknown as Record<RoundId, number[]>;

/** Annex C: 8-letter combination key -> { winnerGroup: thirdGroup }. */
export const ANNEX_C = annexJson as Record<string, Record<string, string>>;

/** Round id for a given match number. */
export function roundOf(n: number): RoundId {
  if (n <= 88) return 'R32';
  if (n <= 96) return 'R16';
  if (n <= 100) return 'QF';
  if (n <= 102) return 'SF';
  if (n === 103) return 'TP';
  return 'F';
}

export const ALL_MATCH_NUMBERS: number[] = Array.from({ length: 104 - 73 + 1 }, (_, i) => 73 + i);
