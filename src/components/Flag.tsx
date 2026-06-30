import type { Team } from '../lib/types';
import styles from './Flag.module.css';

export function Flag({ iso, name }: { iso: string; name?: string }) {
  return <span className={`fi fi-${iso} ${styles.flag}`} role="img" aria-label={name ? `${name} flag` : undefined} />;
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
