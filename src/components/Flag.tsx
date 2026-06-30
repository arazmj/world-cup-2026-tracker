import type { Team } from '../lib/types';
import styles from './Flag.module.css';

const base = import.meta.env.BASE_URL;

export function Flag({ iso, name }: { iso: string; name?: string }) {
  return (
    <img
      className={styles.flag}
      src={`${base}flags/${iso}.svg`}
      alt={name ? `${name} flag` : ''}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

export function TeamLabel({
  team,
  label,
  muted,
  strong,
}: {
  team?: Team | null;
  label?: string;
  muted?: boolean;
  strong?: boolean;
}) {
  if (!team) {
    return <span className={styles.tbd}>{label ?? 'TBD'}</span>;
  }
  return (
    <span className={[styles.team, muted ? styles.muted : '', strong ? styles.strong : ''].join(' ')}>
      <Flag iso={team.iso} name={team.name} />
      <span className={styles.name}>{team.name}</span>
    </span>
  );
}
