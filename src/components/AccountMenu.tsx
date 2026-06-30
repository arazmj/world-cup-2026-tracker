import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import styles from './AccountMenu.module.css';

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 21 21" width="16" height="16" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 1.9-1.6 4.7-4.5 6.6l-.04.3 6.5 5 .45.05c4.1-3.8 6.5-9.4 6.5-15.2" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-1.9 14.5-5.3l-6.9-5.3c-1.8 1.3-4.3 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-.3.02-6.7 5.2-.09.25C8 41 15.4 46 24 46" />
      <path fill="#FBBC05" d="M11.5 28.5c-.5-1.4-.7-2.9-.7-4.5s.3-3.1.7-4.5l-.01-.3-6.8-5.3-.22.1C2.9 17 2 20.4 2 24s.9 7 2.5 10l7-5.5" />
      <path fill="#EA4335" d="M24 9.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.3 29.9 1 24 1 15.4 1 8 6 4.5 14l7 5.5C13.3 13.3 18.2 9.5 24 9.5" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M16.36 12.78c.02 2.5 2.2 3.34 2.23 3.35-.02.06-.35 1.2-1.15 2.37-.69 1.02-1.4 2.03-2.53 2.05-1.1.02-1.46-.65-2.72-.65s-1.66.63-2.7.67c-1.08.04-1.91-1.1-2.61-2.11-1.42-2.07-2.51-5.85-1.05-8.41.72-1.27 2.02-2.07 3.42-2.09 1.07-.02 2.08.72 2.73.72.65 0 1.88-.89 3.17-.76.54.02 2.05.22 3.02 1.64-.08.05-1.8 1.05-1.78 3.13M14.6 5.2c.58-.7.97-1.67.86-2.64-.83.03-1.84.55-2.44 1.25-.54.62-1.01 1.61-.88 2.56.93.07 1.88-.47 2.46-1.17" />
    </svg>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function AccountMenu() {
  const { user, status, googleEnabled, error, signInMicrosoft, signInGoogle, signOut } = useAuth();
  const [modal, setModal] = useState(false);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // close the sign-in modal once we're authenticated
  useEffect(() => {
    if (user) setModal(false);
  }, [user]);

  // close dropdown on outside click / Escape
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  async function run(id: string, fn: () => Promise<void>) {
    setBusy(id);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  if (status === 'initializing') {
    return <span className={styles.placeholder} aria-hidden="true" />;
  }

  if (user) {
    return (
      <div className={styles.account} ref={menuRef}>
        <button className={styles.avatarBtn} onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}>
          {user.avatar ? (
            <img className={styles.avatarImg} src={user.avatar} alt="" />
          ) : (
            <span className={styles.avatar}>{initials(user.name)}</span>
          )}
          <span className={styles.who}>{user.name}</span>
        </button>
        {menu && (
          <div className={styles.dropdown} role="menu">
            <div className={styles.dropHead}>
              <div className={styles.dropName}>{user.name}</div>
              {user.email && <div className={styles.dropEmail}>{user.email}</div>}
            </div>
            <button
              className={styles.dropItem}
              role="menuitem"
              onClick={() => {
                setMenu(false);
                void signOut();
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button className={styles.signIn} onClick={() => setModal(true)}>
        Sign in
      </button>
      {modal && (
        <div className={styles.overlay} onMouseDown={() => setModal(false)}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Sign in"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 className={styles.title}>Sign in</h2>
            <p className={styles.sub}>Save your predictions to your account and pick up on any device.</p>

            <button
              className={styles.provider}
              disabled={busy !== null}
              onClick={() => run('microsoft', signInMicrosoft)}
            >
              <MicrosoftMark />
              <span>Continue with Microsoft</span>
            </button>

            <button
              className={styles.provider}
              disabled={busy !== null || !googleEnabled}
              onClick={() => run('google', signInGoogle)}
              title={googleEnabled ? undefined : 'Google sign-in needs a client id — see README'}
            >
              <GoogleMark />
              <span>Continue with Google</span>
              {!googleEnabled && <span className={styles.soon}>setup</span>}
            </button>

            <button className={styles.provider} disabled title="Apple sign-in requires an Apple Developer account">
              <AppleMark />
              <span>Continue with Apple</span>
              <span className={styles.soon}>setup</span>
            </button>

            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.cancel} onClick={() => setModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
