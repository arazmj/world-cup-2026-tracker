import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTournament } from '../state/store';
import { fromJson, shareUrl, toJson } from '../lib/persistence';
import styles from './Header.module.css';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  const saved = localStorage.getItem('wc2026-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return 'just now';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Header() {
  const { state, dispatch, updatedAt, feedStatus, refresh } = useTournament();
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('wc2026-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  function exportJson() {
    const blob = new Blob([toJson(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'world-cup-2026.json';
    a.click();
    URL.revokeObjectURL(url);
    setToast('Exported file');
  }

  function importJson(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file
      .text()
      .then((t) => {
        dispatch({ type: 'load', state: fromJson(t) });
        setToast('Imported file');
      })
      .catch(() => setToast('Could not read that file'));
  }

  async function share() {
    const url = shareUrl(state);
    try {
      await navigator.clipboard.writeText(url);
      setToast('Share link copied');
    } catch {
      location.hash = url.split('#')[1] ?? '';
      setToast('Link added to address bar');
    }
  }

  function reset() {
    if (confirm('Clear your predictions? Games already finished stay prefilled.')) {
      history.replaceState(null, '', location.pathname + location.search);
      dispatch({ type: 'reset' });
      setToast('Predictions cleared');
    }
  }

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          26
        </span>
        <span className={styles.titles}>
          <span className={styles.kicker}>FIFA World Cup</span>
          <h1>2026 Tracker</h1>
        </span>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.pill}
          data-status={feedStatus}
          onClick={() => {
            refresh();
            setToast('Refreshing results…');
          }}
          title="Results refresh automatically every hour. Click to refresh now."
        >
          <span className={styles.dot} aria-hidden="true" />
          {feedStatus === 'loading'
            ? 'Checking results…'
            : feedStatus === 'fallback'
              ? 'Offline data'
              : `Updated ${timeAgo(updatedAt)}`}
        </button>
        <button className={styles.btn} onClick={share}>
          Share
        </button>
        <button className={styles.btn} onClick={exportJson}>
          Export
        </button>
        <button className={styles.btn} onClick={() => fileRef.current?.click()}>
          Import
        </button>
        <button className={styles.ghost} onClick={reset}>
          Reset
        </button>
        <button
          className={styles.icon}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
      </div>

      <div className={styles.toastWrap} aria-live="polite">
        {toast && (
          <div className={styles.toast} role="status">
            {toast}
          </div>
        )}
      </div>
    </header>
  );
}
