import type { CSSProperties, Dispatch } from 'react';
import type { Action } from '../state/store';
import type { MatchView } from '../lib/bracket';
import { useTournament } from '../state/store';
import { MatchCard } from './MatchCard';
import { TeamLabel } from './Flag';
import styles from './BracketView.module.css';

// match numbers in top-to-bottom bracket order (in-order traversal of the tree)
const R32_ORDER = [73, 75, 74, 77, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87];
const R16_ORDER = [89, 90, 93, 94, 91, 92, 95, 96];
const QF_ORDER = [97, 98, 99, 100];
const SF_ORDER = [101, 102];

function Round({
  title,
  order,
  span,
  matches,
  dispatch,
  locks,
  final,
}: {
  title: string;
  order: number[];
  span: number;
  matches: Record<number, MatchView>;
  dispatch: Dispatch<Action>;
  locks: Set<number>;
  final?: boolean;
}) {
  return (
    <div className={`${styles.round} ${final ? styles.final : ''}`}>
      <div className={styles.roundHead}>{title}</div>
      <div className={styles.col}>
        {order.map((n, i) => (
          <div
            key={n}
            className={styles.slot}
            style={{ gridRow: `${span * i + 1} / span ${span}`, '--span': span } as CSSProperties}
          >
            <MatchCard match={matches[n]!} dispatch={dispatch} locked={locks.has(n)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BracketView() {
  const { derived, dispatch, locks } = useTournament();
  const ko = locks.knockout;
  const m = derived.bracket.matches;
  const champ = derived.bracket.champion;
  const third = derived.bracket.thirdPlace;

  return (
    <div className={styles.wrap}>
      <div className={styles.crown}>
        <span className={styles.trophy} aria-hidden="true">
          🏆
        </span>
        <div>
          <div className={styles.crownLabel}>Champion</div>
          <div className={styles.crownTeam}>
            {champ ? <TeamLabel team={champ} strong /> : <span className={styles.tbd}>To be decided</span>}
          </div>
        </div>
      </div>

      <div className={styles.scroll} role="region" aria-label="Knockout bracket" tabIndex={0}>
        <div className={styles.bracket}>
          <Round title="Round of 32" order={R32_ORDER} span={2} matches={m} dispatch={dispatch} locks={ko} />
          <Round title="Round of 16" order={R16_ORDER} span={4} matches={m} dispatch={dispatch} locks={ko} />
          <Round title="Quarter-finals" order={QF_ORDER} span={8} matches={m} dispatch={dispatch} locks={ko} />
          <Round title="Semi-finals" order={SF_ORDER} span={16} matches={m} dispatch={dispatch} locks={ko} />
          <Round title="Final" order={[104]} span={32} matches={m} dispatch={dispatch} locks={ko} final />
        </div>
      </div>

      <div className={styles.thirdWrap}>
        <div className={styles.thirdTitle}>Third-place play-off</div>
        <div className={styles.thirdCard}>
          <MatchCard match={m[103]!} dispatch={dispatch} locked={ko.has(103)} />
          <div className={styles.thirdResult}>
            {third ? (
              <>
                <span aria-hidden="true">🥉</span> <TeamLabel team={third} strong />
              </>
            ) : (
              <span className={styles.tbd}>To be decided</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
