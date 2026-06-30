import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import type { AccountInfo } from '@azure/msal-browser';
import { GOOGLE_CLIENT_ID, MS_AUTHORITY, MS_CLIENT_ID, MS_SCOPES } from './config';
import type { AuthProviderId } from './config';

export interface AuthUser {
  id: string; // stable, e.g. "microsoft:<homeAccountId>" or "google:<sub>"
  name: string;
  email: string | null;
  provider: AuthProviderId;
  avatar: string | null;
}

export type AuthStatus = 'initializing' | 'anonymous' | 'authenticated';

interface AuthCtx {
  user: AuthUser | null;
  status: AuthStatus;
  googleEnabled: boolean;
  error: string | null;
  signInMicrosoft: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<{ token: string; provider: AuthProviderId } | null>;
}

const Ctx = createContext<AuthCtx | null>(null);

const msal = new PublicClientApplication({
  auth: {
    clientId: MS_CLIENT_ID,
    authority: MS_AUTHORITY,
    redirectUri: window.location.origin + import.meta.env.BASE_URL,
  },
  cache: { cacheLocation: 'localStorage' },
});

function userFromMsal(acc: AccountInfo): AuthUser {
  return {
    id: `microsoft:${acc.homeAccountId}`,
    name: acc.name || acc.username || 'Microsoft account',
    email: acc.username || null,
    provider: 'microsoft',
    avatar: null,
  };
}

let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google sign-in'));
    document.head.appendChild(s);
  });
  return gsiPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [error, setError] = useState<string | null>(null);
  const googleToken = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await msal.initialize();
        await msal.handleRedirectPromise();
        const acc = msal.getAllAccounts()[0];
        if (!cancelled && acc) {
          msal.setActiveAccount(acc);
          setUser(userFromMsal(acc));
        }
      } catch {
        /* ignore init errors — user stays anonymous */
      } finally {
        if (!cancelled) setStatus((s) => (s === 'initializing' ? 'anonymous' : s));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signInMicrosoft = useCallback(async () => {
    setError(null);
    try {
      await msal.initialize();
      const res = await msal.loginPopup({ scopes: MS_SCOPES, prompt: 'select_account' });
      const acc = res.account ?? msal.getAllAccounts()[0];
      if (acc) {
        msal.setActiveAccount(acc);
        setUser(userFromMsal(acc));
        setStatus('authenticated');
      }
    } catch (e) {
      if (!(e instanceof Error && /user_cancelled|popup_window/i.test(e.message))) {
        setError('Microsoft sign-in failed. Please try again.');
      }
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    setError(null);
    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured yet.');
      return;
    }
    try {
      await loadGsi();
      const g = (window as unknown as { google?: any }).google;
      await new Promise<void>((resolve, reject) => {
        const client = g.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (resp: { access_token?: string; error?: string }) => {
            if (!resp.access_token) return reject(new Error(resp.error || 'no token'));
            googleToken.current = resp.access_token;
            try {
              const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${resp.access_token}` },
              }).then((r) => r.json());
              setUser({
                id: `google:${info.sub}`,
                name: info.name || info.email || 'Google account',
                email: info.email ?? null,
                provider: 'google',
                avatar: info.picture ?? null,
              });
              setStatus('authenticated');
              resolve();
            } catch (err) {
              reject(err as Error);
            }
          },
        });
        client.requestAccessToken();
      });
    } catch {
      setError('Google sign-in failed. Please try again.');
    }
  }, []);

  const signOut = useCallback(async () => {
    const wasGoogle = user?.provider === 'google';
    setUser(null);
    setStatus('anonymous');
    googleToken.current = null;
    try {
      if (!wasGoogle) {
        const clear = (msal as unknown as { clearCache?: () => Promise<void> }).clearCache;
        if (clear) await clear.call(msal);
      }
    } catch {
      /* best effort */
    }
  }, [user]);

  const getToken = useCallback(async (): Promise<{ token: string; provider: AuthProviderId } | null> => {
    if (!user) return null;
    if (user.provider === 'microsoft') {
      try {
        const acc = msal.getActiveAccount() ?? msal.getAllAccounts()[0];
        if (!acc) return null;
        const res = await msal.acquireTokenSilent({ scopes: ['User.Read'], account: acc });
        return { token: res.accessToken, provider: 'microsoft' };
      } catch {
        return null;
      }
    }
    if (user.provider === 'google' && googleToken.current) {
      return { token: googleToken.current, provider: 'google' };
    }
    return null;
  }, [user]);

  const value: AuthCtx = {
    user,
    status,
    googleEnabled: !!GOOGLE_CLIENT_ID,
    error,
    signInMicrosoft,
    signInGoogle,
    signOut,
    getToken,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
