import { useState } from 'react';
import { TournamentProvider } from './state/store';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import type { TabKey } from './components/Tabs';
import { GroupsView } from './components/GroupsView';
import { ThirdPlaceView } from './components/ThirdPlaceView';
import { BracketView } from './components/BracketView';
import { SEED_AS_OF } from './lib/seed';
import styles from './App.module.css';

const PREFILLED_THROUGH = new Date(`${SEED_AS_OF}T00:00`).toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const BLURB: Record<TabKey, string> = {
  groups: 'Type each match score — standings re-rank live with the full FIFA tiebreakers.',
  thirds: 'The eight best third-placed teams join the group winners and runners-up in the Round of 32.',
  bracket: 'Enter knockout scores; winners advance automatically. Pick a shootout winner if a match is drawn.',
};

export default function App() {
  const [tab, setTab] = useState<TabKey>('groups');

  return (
    <TournamentProvider>
      <Header />
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <Tabs value={tab} onChange={setTab} />
          <p className={styles.blurb}>{BLURB[tab]}</p>
        </div>
        <div className={styles.view}>
          {tab === 'groups' && <GroupsView />}
          {tab === 'thirds' && <ThirdPlaceView />}
          {tab === 'bracket' && <BracketView />}
        </div>
      </main>
      <footer className={styles.footer}>
        <span>
          Results through {PREFILLED_THROUGH} are prefilled — predict the rest. Standings use the official FIFA
          tiebreakers; your entries autosave in this browser.
        </span>
      </footer>
    </TournamentProvider>
  );
}
