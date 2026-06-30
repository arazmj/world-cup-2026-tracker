import { useState } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { TournamentProvider } from './state/store';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import type { TabKey } from './components/Tabs';
import { GroupsView } from './components/GroupsView';
import { ThirdPlaceView } from './components/ThirdPlaceView';
import { BracketView } from './components/BracketView';
import styles from './App.module.css';

const BLURB: Record<TabKey, string> = {
  groups: 'Played games are filled in and locked; predict the rest. Standings re-rank live with the full FIFA tiebreakers.',
  thirds: 'The eight best third-placed teams join the group winners and runners-up in the Round of 32.',
  bracket: 'Played games are locked; enter scores to predict the rest. Winners advance automatically — pick a shootout winner if a match is drawn.',
};

export default function App() {
  const [tab, setTab] = useState<TabKey>('groups');

  return (
    <AuthProvider>
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
            Real results update automatically every hour (played games are locked); you predict the rest. Standings
            use the official FIFA tiebreakers. Sign in to save your predictions, or they autosave in this browser.
          </span>
          <span className={styles.home}>
            Part of <a href="https://www.amirrazmjou.com/">amirrazmjou.com</a>
          </span>
        </footer>
      </TournamentProvider>
    </AuthProvider>
  );
}
