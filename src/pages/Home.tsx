import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { GameType, StatsEntry } from '../api/types';
import { useSettings } from '../app/settings';
import { SettingsMenu } from '../components/SettingsMenu';
import { CheckerSwatch } from '../games/backgammon/BackgammonBoard';
import { PieceSwatch } from '../games/checkers/CheckersBoard';
import { DiscSwatch } from '../games/connect-four/ConnectFourBoard';
import { activeGameId } from '../games/shared/useGameSession';
import { DesertScene } from '../themes/desert/DesertScene';
import { JungleScene } from '../themes/jungle/JungleScene';
import { OceanScene } from '../themes/ocean/OceanScene';
import type { SceneProps } from '../themes/scene/SceneFrame';
import { WinterScene } from '../themes/winter/WinterScene';
import styles from './Home.module.css';

interface Card {
  type: GameType;
  path: string;
  name: string;
  description: string;
  theme: string;
  Scene: ComponentType<SceneProps>;
  emblem: ReactNode;
}

const CARDS: Card[] = [
  {
    type: 'CONNECT_FOUR',
    path: '/connect-four',
    name: 'Connect Four',
    description: 'Line up four discs before the computer does.',
    theme: 'ocean',
    Scene: OceanScene,
    emblem: (
      <>
        <DiscSwatch side="P1" />
        <DiscSwatch side="P2" />
        <DiscSwatch side="P1" />
      </>
    ),
  },
  {
    type: 'CHECKERS',
    path: '/checkers',
    name: 'Checkers',
    description: 'Jump, crown and corner the other side.',
    theme: 'winter',
    Scene: WinterScene,
    emblem: (
      <>
        <PieceSwatch side="P1" />
        <PieceSwatch side="P2" king />
      </>
    ),
  },
  {
    type: 'BACKGAMMON',
    path: '/backgammon',
    name: 'Backgammon',
    description: 'Race your fifteen checkers home and off.',
    theme: 'desert',
    Scene: DesertScene,
    emblem: (
      <>
        <CheckerSwatch side="P1" />
        <CheckerSwatch side="P2" />
      </>
    ),
  },
];

export function Home() {
  const { ambientMotion } = useSettings();
  const [stats, setStats] = useState<StatsEntry[] | null>(null);
  const [unfinished, setUnfinished] = useState<Partial<Record<GameType, boolean>>>({});
  const [active, setActive] = useState<GameType | null>(null);

  useEffect(() => {
    document.body.dataset.theme = 'jungle';
    document.title = 'Three Classics';
    return () => {
      delete document.body.dataset.theme;
    };
  }, []);

  useEffect(() => {
    api.stats().then(setStats, () => setStats([]));
    for (const card of CARDS) {
      const id = activeGameId(card.type);
      if (!id) continue;
      api.getGame(id).then(
        (game) => setUnfinished((current) => ({ ...current, [card.type]: game.status === 'IN_PROGRESS' && game.history.length > 0 })),
        () => undefined,
      );
    }
  }, []);

  function record(type: GameType): string {
    if (stats === null) return ' ';
    const rows = stats.filter((row) => row.type === type);
    const sum = (key: 'wins' | 'losses' | 'draws') => rows.reduce((total, row) => total + row[key], 0);
    if (sum('wins') + sum('losses') + sum('draws') === 0) return 'No games yet';
    return `W ${sum('wins')} · L ${sum('losses')} · D ${sum('draws')}`;
  }

  return (
    <div className={styles.page}>
      <JungleScene animate={ambientMotion} />
      <div className={styles.settings}>
        <SettingsMenu />
      </div>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.wordmark}>Three Classics</h1>
          <p className={styles.subtitle}>Connect Four, Checkers and Backgammon against the computer.</p>
        </header>
        <ul className={styles.cards}>
          {CARDS.map(({ type, path, name, description, theme, Scene, emblem }) => (
            <li key={type}>
              <Link
                to={path}
                className={styles.card}
                aria-label={`${unfinished[type] ? 'Continue' : 'Play'} ${name}`}
                onPointerEnter={() => setActive(type)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(type)}
                onBlur={() => setActive(null)}
              >
                <div className={styles.window} data-theme={theme}>
                  <Scene mode="thumbnail" animate={ambientMotion && active === type} />
                  <div className={styles.emblem}>{emblem}</div>
                </div>
                <div className={styles.body}>
                  <h2 className={styles.name}>{name}</h2>
                  <p className={styles.description}>{description}</p>
                  <div className={styles.meta}>
                    <span className={styles.record}>{record(type)}</span>
                    <span className={styles.play}>{unfinished[type] ? 'Continue' : 'Play'}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
