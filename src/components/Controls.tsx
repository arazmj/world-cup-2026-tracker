import styles from './Controls.module.css';

export function ScoreBox({
  value,
  onChange,
  label,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <input
      className={`${styles.score} ${disabled ? styles.locked : ''}`}
      type="number"
      min={0}
      max={99}
      inputMode="numeric"
      placeholder="–"
      aria-label={label}
      value={value ?? ''}
      disabled={disabled}
      readOnly={disabled}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '') return onChange(null);
        const n = Math.floor(Number(v));
        if (!Number.isFinite(n)) return;
        onChange(Math.max(0, Math.min(99, n)));
      }}
    />
  );
}

export function MiniNumber({
  value,
  onChange,
  label,
  max = 99,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  max?: number;
}) {
  return (
    <input
      className={styles.mini}
      type="number"
      min={0}
      max={max}
      inputMode="numeric"
      placeholder="0"
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '') return onChange(null);
        const n = Math.floor(Number(v));
        if (!Number.isFinite(n)) return;
        onChange(Math.max(0, Math.min(max, n)));
      }}
    />
  );
}

export function SegToggle<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className={styles.seg} role="group" aria-label={label}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            className={active ? styles.segOn : styles.segOff}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(active ? null : o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
