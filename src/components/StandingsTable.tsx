import type { GroupRow } from '../lib/types';
import { TeamLabel } from './Flag';
import styles from './StandingsTable.module.css';

function gd(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function StandingsTable({ rows }: { rows: GroupRow[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.pos} scope="col" title="Position">
            #
          </th>
          <th className={styles.team} scope="col">
            Team
          </th>
          <th scope="col" title="Played">P</th>
          <th scope="col" title="Won">W</th>
          <th scope="col" title="Drawn">D</th>
          <th scope="col" title="Lost">L</th>
          <th scope="col" title="Goals for">GF</th>
          <th scope="col" title="Goals against">GA</th>
          <th scope="col" title="Goal difference">GD</th>
          <th className={styles.pts} scope="col" title="Points">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const cls =
            r.rank <= 2 ? styles.qualify : r.rank === 3 ? styles.third : styles.out;
          return (
            <tr key={r.team.name} className={cls}>
              <td className={`${styles.pos} tnum`}>{r.rank}</td>
              <td className={styles.team}>
                <TeamLabel team={r.team} strong={r.rank <= 2} />
              </td>
              <td className="tnum">{r.stats.pld}</td>
              <td className="tnum">{r.stats.w}</td>
              <td className="tnum">{r.stats.d}</td>
              <td className="tnum">{r.stats.l}</td>
              <td className="tnum">{r.stats.gf}</td>
              <td className="tnum">{r.stats.ga}</td>
              <td className="tnum">{gd(r.stats.gd)}</td>
              <td className={`${styles.pts} tnum`}>{r.stats.pts}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
