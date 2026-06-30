import { hydrate } from './persistence';
import type { TournamentState } from './types';
import type { AuthProviderId } from '../auth/config';

const SYNC_BASE = 'https://wc2026-results-eaed0e.azurewebsites.net/api';

export interface AuthToken {
  token: string;
  provider: AuthProviderId;
}

function headers(auth: AuthToken): Record<string, string> {
  return { Authorization: `Bearer ${auth.token}`, 'x-auth-provider': auth.provider };
}

/** Load the signed-in user's saved predictions from the cloud (null on miss/error). */
export async function getRemote(auth: AuthToken): Promise<TournamentState | null> {
  try {
    const r = await fetch(`${SYNC_BASE}/predictions`, { headers: headers(auth), cache: 'no-store' });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data || data.empty || !data.predictions) return null;
    return hydrate(data.predictions);
  } catch {
    return null;
  }
}

/** Save the signed-in user's predictions to the cloud (best effort). */
export async function putRemote(auth: AuthToken, state: TournamentState): Promise<boolean> {
  try {
    const r = await fetch(`${SYNC_BASE}/predictions`, {
      method: 'PUT',
      headers: { ...headers(auth), 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    return r.ok;
  } catch {
    return false;
  }
}
