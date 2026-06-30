import type { Dispatch } from 'react';
import type { Action } from '../state/store';
import type { GroupId, GroupRow, GroupState } from '../lib/types';
import { FIXTURES, TEAMS } from '../data';
import { MiniNumber, ScoreBox } from './Controls';
import { TeamLabel } from './Flag';
import { StandingsTable } from './StandingsTable';
import styles from './GroupCard.module.css';

interface Props {
  g: GroupId;
  rows: GroupRow[];
  group: GroupState;
  dispatch: Dispatch<Action>;
  lockedFixtures: Set<number>;
}

export function GroupCard({ g, rows, group, dispatch, lockedFixtures }: Props) {
  const teams = TEAMS[g];
  return (
    <section className={styles.card} aria-labelledby={`grp-${g}`}>
      <header className={styles.head}>
        <h3 id={`grp-${g}`}>
          <span className={styles.badge}>{g}</span> Group {g}
        </h3>
        <span className={styles.hint}>Top 2 advance</span>
      </header>

      <StandingsTable rows={rows} />

      <div className={styles.fixtures}>
        <div className={styles.fxTitle}>Fixtures — enter scores</div>
        {FIXTURES.map(([hp, ap], fi) => {
          const sc = group.scores[fi]!;
          const home = teams[hp - 1]!;
          const away = teams[ap - 1]!;
          const locked = lockedFixtures.has(fi);
          return (
            <div className={`${styles.fx} ${locked ? styles.fxLocked : ''}`} key={fi}>
              <div className={styles.fxHome}>
                <TeamLabel team={home} />
              </div>
              <ScoreBox
                value={sc.hg}
                disabled={locked}
                onChange={(v) => dispatch({ type: 'score', group: g, fixture: fi, field: 'hg', value: v })}
                label={`${home.name} goals against ${away.name}`}
              />
              <span className={styles.dash} aria-hidden="true">
                {locked ? '·' : '–'}
              </span>
              <ScoreBox
                value={sc.ag}
                disabled={locked}
                onChange={(v) => dispatch({ type: 'score', group: g, fixture: fi, field: 'ag', value: v })}
                label={`${away.name} goals against ${home.name}`}
              />
              <div className={styles.fxAway}>
                <TeamLabel team={away} />
              </div>
            </div>
          );
        })}
      </div>

      <details className={styles.details}>
        <summary>Discipline &amp; tiebreaks</summary>
        <div className={styles.disc}>
          <div className={styles.discHead}>
            <span>Team</span>
            <span>Yel</span>
            <span>Red</span>
            <span>Lots</span>
          </div>
          {teams.map((t, p) => (
            <div className={styles.discRow} key={t.name}>
              <span className={styles.discTeam}>
                <TeamLabel team={t} />
              </span>
              <MiniNumber
                value={group.cards[p]!.y || null}
                onChange={(v) => dispatch({ type: 'card', group: g, team: p, field: 'y', value: v ?? 0 })}
                label={`${t.name} yellow cards`}
              />
              <MiniNumber
                value={group.cards[p]!.r || null}
                onChange={(v) => dispatch({ type: 'card', group: g, team: p, field: 'r', value: v ?? 0 })}
                label={`${t.name} red cards`}
              />
              <MiniNumber
                value={group.lots[p] ?? null}
                onChange={(v) => dispatch({ type: 'lots', group: g, team: p, value: v })}
                label={`${t.name} manual tiebreak order`}
                max={4}
              />
            </div>
          ))}
        </div>
        <p className={styles.note}>
          Fair play: −1 per yellow, −4 per red. Lots breaks an exact tie (1 ranks highest).
        </p>
      </details>
    </section>
  );
}
