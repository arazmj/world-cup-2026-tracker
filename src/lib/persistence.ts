import { GROUP_IDS } from '../data';
import type { GroupId, GroupState, KnockoutResult, TournamentState } from './types';

export const STORAGE_KEY = 'wc2026-tracker:v3';

export function emptyGroup(): GroupState {
  return {
    scores: Array.from({ length: 6 }, () => ({ hg: null, ag: null })),
    cards: Array.from({ length: 4 }, () => ({ y: 0, r: 0 })),
    lots: [null, null, null, null],
  };
}

/** A completely empty tournament (used as the base when importing/loading saved data). */
export function blankState(): TournamentState {
  const groups = {} as Record<GroupId, GroupState>;
  for (const g of GROUP_IDS) groups[g] = emptyGroup();
  const thirdLots = Object.fromEntries(GROUP_IDS.map((g) => [g, null])) as Record<GroupId, number | null>;
  const knockout: Record<number, KnockoutResult> = {};
  for (let n = 73; n <= 104; n++) knockout[n] = { hg: null, ag: null, pens: null };
  return { groups, thirdLots, knockout };
}

/** Fresh predictions are empty — official results come from the live feed. */
export function initialState(): TournamentState {
  return blankState();
}

/** Merge a loaded/partial state onto a fresh state so missing fields default safely. */
export function hydrate(raw: unknown): TournamentState {
  const base = blankState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<TournamentState>;
  for (const g of GROUP_IDS) {
    const src = r.groups?.[g];
    if (!src) continue;
    const grp = base.groups[g];
    if (Array.isArray(src.scores)) {
      src.scores.forEach((s, i) => {
        if (i < 6 && s) grp.scores[i] = { hg: numOrNull(s.hg), ag: numOrNull(s.ag) };
      });
    }
    if (Array.isArray(src.cards)) {
      src.cards.forEach((c, i) => {
        if (i < 4 && c) grp.cards[i] = { y: Number(c.y) || 0, r: Number(c.r) || 0 };
      });
    }
    if (Array.isArray(src.lots)) {
      src.lots.forEach((v, i) => {
        if (i < 4) grp.lots[i] = numOrNull(v);
      });
    }
  }
  if (r.thirdLots) for (const g of GROUP_IDS) base.thirdLots[g] = numOrNull(r.thirdLots[g]);
  if (r.knockout) {
    for (let n = 73; n <= 104; n++) {
      const k = r.knockout[n];
      if (k) base.knockout[n] = { hg: numOrNull(k.hg), ag: numOrNull(k.ag), pens: k.pens ?? null };
    }
  }
  return base;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function loadLocal(): TournamentState {
  try {
    const fromHash = readShareHash();
    if (fromHash) return fromHash;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return hydrate(JSON.parse(raw));
  } catch {
    /* ignore corrupt storage */
  }
  return initialState();
}

export function saveLocal(state: TournamentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Load/save predictions under an arbitrary key (used to keep each account separate). */
export function loadLocalFor(key: string): TournamentState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return hydrate(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return blankState();
}

export function saveLocalFor(key: string, state: TournamentState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** True when the user has entered no predictions at all. */
export function isBlank(s: TournamentState): boolean {
  for (const g of GROUP_IDS) {
    const grp = s.groups[g];
    if (grp.scores.some((sc) => sc.hg !== null || sc.ag !== null)) return false;
    if (grp.cards.some((c) => c.y !== 0 || c.r !== 0)) return false;
    if (grp.lots.some((l) => l !== null)) return false;
    if (s.thirdLots[g] !== null) return false;
  }
  for (let n = 73; n <= 104; n++) {
    const k = s.knockout[n];
    if (k && (k.hg !== null || k.ag !== null || k.pens !== null)) return false;
  }
  return true;
}

/* ---- export / import / share ---------------------------------------- */

export function toJson(state: TournamentState): string {
  return JSON.stringify(state, null, 2);
}

export function fromJson(text: string): TournamentState {
  return hydrate(JSON.parse(text));
}

function b64encode(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64decode(s: string): string {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(pad)));
}

export function shareUrl(state: TournamentState): string {
  const data = b64encode(JSON.stringify(state));
  return `${location.origin}${location.pathname}#s=${data}`;
}

export function readShareHash(): TournamentState | null {
  const m = location.hash.match(/[#&]s=([^&]+)/);
  if (!m) return null;
  try {
    return hydrate(JSON.parse(b64decode(m[1]!)));
  } catch {
    return null;
  }
}
