import type { Dispatch } from 'react';
import type { Action } from '../state/store';
import type { MatchView } from '../lib/bracket';
import { ScoreBox, SegToggle } from './Controls';
import { TeamLabel } from './Flag';
import styles from './MatchCard.module.css';

export function MatchCard({ match, dispatch }: { match: MatchView; dispatch: Dispatch<Action> }) {
  const n = match.n;
  const drawn = match.hg !== null && match.ag !== null && match.hg === match.ag;
  const homeWon = !!match.winner && !!match.home && match.winner.name === match.home.name;
  const awayWon = !!match.winner && !!match.away && match.winner.name === match.away.name;

  return (
    <div className={styles.card} data-round={match.round}>
      <span className={styles.tag}>M{n}</span>
      <div className={`${styles.row} ${homeWon ? styles.won : ''}`}>
        <TeamLabel team={match.home} label={match.homeLabel} strong={homeWon} muted={!match.home} />
        <ScoreBox
          value={match.hg}
          onChange={(v) => dispatch({ type: 'ko', n, field: 'hg', value: v })}
          label={`${match.home?.name ?? match.homeLabel} goals`}
        />
      </div>
      <div className={`${styles.row} ${awayWon ? styles.won : ''}`}>
        <TeamLabel team={match.away} label={match.awayLabel} strong={awayWon} muted={!match.away} />
        <ScoreBox
          value={match.ag}
          onChange={(v) => dispatch({ type: 'ko', n, field: 'ag', value: v })}
          label={`${match.away?.name ?? match.awayLabel} goals`}
        />
      </div>
      {drawn && (
        <div className={styles.pens}>
          <span className={styles.penLabel}>Penalties</span>
          <SegToggle
            label={`Penalty shootout winner for match ${n}`}
            value={match.pens}
            onChange={(v) => dispatch({ type: 'pens', n, value: v })}
            options={[
              { value: 'home', label: 'Home' },
              { value: 'away', label: 'Away' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
