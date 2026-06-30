import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { blankState, isBlank, loadLocalFor, saveLocalFor } from '../lib/persistence';
import { getRemote, putRemote } from '../lib/sync';
import type { AuthToken } from '../lib/sync';

const AUTH: AuthToken = { token: 'tok', provider: 'microsoft' };

describe('isBlank', () => {
  it('is true for a fresh state and false once a score is set', () => {
    const s = blankState();
    expect(isBlank(s)).toBe(true);
    s.groups.A.scores[0] = { hg: 1, ag: 0 };
    expect(isBlank(s)).toBe(false);
  });
});

describe('per-account local storage', () => {
  beforeEach(() => localStorage.clear());
  it('keeps each key separate', () => {
    const s = blankState();
    s.groups.B.scores[0] = { hg: 2, ag: 2 };
    saveLocalFor('k1', s);
    expect(loadLocalFor('k1').groups.B.scores[0]).toEqual({ hg: 2, ag: 2 });
    expect(isBlank(loadLocalFor('k2'))).toBe(true);
  });
});

describe('cloud sync client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('getRemote returns the saved predictions on success', async () => {
    const s = blankState();
    s.groups.A.scores[0] = { hg: 3, ag: 1 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ predictions: s }) }));
    const got = await getRemote(AUTH);
    expect(got).not.toBeNull();
    expect(got!.groups.A.scores[0]).toEqual({ hg: 3, ag: 1 });
  });

  it('getRemote returns null on empty or error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ empty: true }) }));
    expect(await getRemote(AUTH)).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await getRemote(AUTH)).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await getRemote(AUTH)).toBeNull();
  });

  it('putRemote reports success/failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    expect(await putRemote(AUTH, blankState())).toBe(true);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await putRemote(AUTH, blankState())).toBe(false);
  });
});
