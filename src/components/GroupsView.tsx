import { GROUP_IDS } from '../data';
import { useTournament } from '../state/store';
import { GroupCard } from './GroupCard';
import styles from './GroupsView.module.css';

export function GroupsView() {
  const { state, derived, dispatch, locks } = useTournament();
  return (
    <div className={styles.grid}>
      {GROUP_IDS.map((g) => {
        const lockedFixtures = new Set<number>();
        for (let fi = 0; fi < 6; fi++) if (locks.groups.has(`${g}:${fi}`)) lockedFixtures.add(fi);
        return (
          <GroupCard
            key={g}
            g={g}
            rows={derived.standings[g]}
            group={state.groups[g]}
            dispatch={dispatch}
            lockedFixtures={lockedFixtures}
          />
        );
      })}
    </div>
  );
}
