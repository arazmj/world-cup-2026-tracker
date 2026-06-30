import styles from './Tabs.module.css';

export type TabKey = 'groups' | 'thirds' | 'bracket';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'groups', label: 'Groups' },
  { key: 'thirds', label: 'Third place' },
  { key: 'bracket', label: 'Bracket' },
];

export function Tabs({ value, onChange }: { value: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Choose a view">
      {TABS.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            className={active ? styles.on : styles.off}
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
