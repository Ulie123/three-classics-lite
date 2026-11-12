import { useEffect, useId, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty, GameView, Side } from '../../api/types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { SegmentedControl } from '../../components/SegmentedControl';
import { DIFFICULTIES } from './options';
import { resultTitle } from './result';
import styles from './ResultModal.module.css';

export type FlourishKind = 'bubbles' | 'snow' | 'sand';

interface ResultModalProps {
  open: boolean;
  game: GameView<unknown, unknown>;
  sideName: (side: Side) => string;
  flourish: FlourishKind;
  returnFocus: RefObject<SVGSVGElement | null>;
  onClose: () => void;
  onPlayAgain: (difficulty: Difficulty) => void;
}

export function ResultModal({ open, game, sideName, flourish, returnFocus, onClose, onPlayAgain }: ResultModalProps) {
  const titleId = useId();
  const reasonId = useId();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty>(game.difficulty);

  useEffect(() => {
    if (open) setDifficulty(game.difficulty);
  }, [open, game.difficulty]);

  // Enter plays again unless a button has focus (buttons handle Enter themselves).
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault();
      onPlayAgain(difficulty);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={reasonId}
      returnFocus={returnFocus}
      flourish={<Flourish kind={flourish} />}
    >
      <div onKeyDown={onKeyDown}>
        <h2 id={titleId} className={styles.title}>
          {resultTitle(game, sideName)}
        </h2>
        <p id={reasonId} className={styles.reason}>
          {game.outcome?.reason}
        </p>
        <div className={styles.actions}>
          <Button variant="primary" className={styles.primary} onClick={() => onPlayAgain(difficulty)} data-autofocus>
            Play again
          </Button>
          {game.mode === 'VS_AI' && (
            <SegmentedControl label="Difficulty for the next game" options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
          )}
          <Button variant="ghost" onClick={() => navigate('/')}>
            Home
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** One understated themed touch behind the dialog: a rise of bubbles, a snow flurry or a sand gust. */
function Flourish({ kind }: { kind: FlourishKind }) {
  return (
    <div className={[styles.flourish, styles[kind]].join(' ')} aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} style={{ '--i': i, '--x': `${(i * 37) % 100}%` } as CSSProperties} />
      ))}
    </div>
  );
}
