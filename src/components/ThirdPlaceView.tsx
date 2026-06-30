import { useTournament } from '../state/store';
import { MiniNumber } from './Controls';
import { TeamLabel } from './Flag';
import styles from './ThirdPlaceView.module.css';

function gd(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function ThirdPlaceView() {
  const { state, derived, dispatch } = useTournament();
  const { ranked } = derived.thirds;

  return (
    <div className={styles.wrap}>
      <div className={styles.intro}>
        <h2>Best third-placed teams</h2>
        <p>
          The 8 best of the 12 third-placed teams reach the Round of 32, ranked by points, goal
          difference, goals for, fair play, then drawing of lots.
        </p>
      </div>

      <div className={styles.panel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th className={styles.grp}>Grp</th>
              <th className={styles.team}>Team</th>
              <th>Pts</th>
              <th>GD</th>
              <th>GF</th>
              <th>Lots</th>
              <th className={styles.status}>Status</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r) => (
              <tr key={r.group} className={r.qualified ? styles.qualify : styles.out}>
                <td className="tnum">{r.rank}</td>
                <td className={`${styles.grp} tnum`}>{r.group}</td>
                <td className={styles.team}>
                  <TeamLabel team={r.team} strong={r.qualified} />
                </td>
                <td className="tnum">{r.pts}</td>
                <td className="tnum">{gd(r.gd)}</td>
                <td className="tnum">{r.gf}</td>
                <td className={styles.lots}>
                  <MiniNumber
                    value={state.thirdLots[r.group] ?? null}
                    onChange={(v) => dispatch({ type: 'thirdLots', group: r.group, value: v })}
                    label={`${r.team.name} manual tiebreak order`}
                    max={12}
                  />
                </td>
                <td className={styles.status}>
                  {r.qualified ? <span className={styles.badge}>Qualified</span> : <span className={styles.dash}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
