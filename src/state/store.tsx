import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { GROUP_IDS, TEAMS } from '../data';
import type { GroupId, GroupRow, TournamentState } from '../lib/types';
import { rankGroup } from '../lib/standings';
import { rankThirds } from '../lib/thirds';
import type { ThirdsResult } from '../lib/thirds';
import { computeBracket } from '../lib/bracket';
import type { BracketModel } from '../lib/bracket';
import { initialState, loadLocal, saveLocal } from '../lib/persistence';

export type Action =
  | { type: 'score'; group: GroupId; fixture: number; field: 'hg' | 'ag'; value: number | null }
  | { type: 'card'; group: GroupId; team: number; field: 'y' | 'r'; value: number }
  | { type: 'lots'; group: GroupId; team: number; value: number | null }
  | { type: 'thirdLots'; group: GroupId; value: number | null }
  | { type: 'ko'; n: number; field: 'hg' | 'ag'; value: number | null }
  | { type: 'pens'; n: number; value: 'home' | 'away' | null }
  | { type: 'reset' }
  | { type: 'load'; state: TournamentState };

function reducer(state: TournamentState, action: Action): TournamentState {
  switch (action.type) {
    case 'score': {
      const g = state.groups[action.group];
      const scores = g.scores.map((s, i) => (i === action.fixture ? { ...s, [action.field]: action.value } : s));
      return { ...state, groups: { ...state.groups, [action.group]: { ...g, scores } } };
    }
    case 'card': {
      const g = state.groups[action.group];
      const cards = g.cards.map((c, i) => (i === action.team ? { ...c, [action.field]: action.value } : c));
      return { ...state, groups: { ...state.groups, [action.group]: { ...g, cards } } };
    }
    case 'lots': {
      const g = state.groups[action.group];
      const lots = g.lots.map((v, i) => (i === action.team ? action.value : v));
      return { ...state, groups: { ...state.groups, [action.group]: { ...g, lots } } };
    }
    case 'thirdLots':
      return { ...state, thirdLots: { ...state.thirdLots, [action.group]: action.value } };
    case 'ko':
      return {
        ...state,
        knockout: { ...state.knockout, [action.n]: { ...state.knockout[action.n]!, [action.field]: action.value } },
      };
    case 'pens':
      return {
        ...state,
        knockout: { ...state.knockout, [action.n]: { ...state.knockout[action.n]!, pens: action.value } },
      };
    case 'reset':
      return initialState();
    case 'load':
      return action.state;
  }
}

export interface Derived {
  standings: Record<GroupId, GroupRow[]>;
  thirds: ThirdsResult;
  bracket: BracketModel;
}

interface Ctx {
  state: TournamentState;
  dispatch: Dispatch<Action>;
  derived: Derived;
}

const TournamentContext = createContext<Ctx | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadLocal);

  useEffect(() => {
    saveLocal(state);
  }, [state]);

  const derived = useMemo<Derived>(() => {
    const standings = {} as Record<GroupId, GroupRow[]>;
    for (const g of GROUP_IDS) standings[g] = rankGroup(TEAMS[g], state.groups[g]);
    const thirds = rankThirds(standings, state.thirdLots);
    const bracket = computeBracket(standings, thirds, state.knockout);
    return { standings, thirds, bracket };
  }, [state]);

  return <TournamentContext.Provider value={{ state, dispatch, derived }}>{children}</TournamentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTournament(): Ctx {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used within a TournamentProvider');
  return ctx;
}
