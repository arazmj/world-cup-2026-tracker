import { GROUP_IDS } from '../data';
import { useTournament } from '../state/store';
import { GroupCard } from './GroupCard';
import styles from './GroupsView.module.css';

export function GroupsView() {
  const { state, derived, dispatch } = useTournament();
  return (
    <div className={styles.grid}>
      {GROUP_IDS.map((g) => (
        <GroupCard key={g} g={g} rows={derived.standings[g]} group={state.groups[g]} dispatch={dispatch} />
      ))}
    </div>
  );
}
