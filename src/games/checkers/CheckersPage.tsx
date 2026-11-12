import { useEffect, useRef, useState } from 'react';
import type { Side } from '../../api/types';
import { WinterScene } from '../../themes/winter/WinterScene';
import { GameShell } from '../shared/GameShell';
import { PlayerList, PlayerRow } from '../shared/PlayerList';
import { completedBy, nextSteps } from '../shared/prefix';
import { useGameSession } from '../shared/useGameSession';
import { CheckersBoard, PieceSwatch } from './CheckersBoard';
import { CheckersRules } from './CheckersRules';
import { HOP_MS, owner, previewMove } from './geometry';
import type { CheckersMove, CheckersState } from './types';

const PIECES_EACH = 12;
const sideName = (side: Side) => (side === 'P1' ? 'Dark' : 'Light');
const swatch = (side: Side) => <PieceSwatch side={side} />;

export function CheckersPage() {
  const boardRef = useRef<SVGSVGElement>(null);
  const session = useGameSession<CheckersState, CheckersMove>({
    type: 'CHECKERS',
    eventDuration: (event) => (event.move.path.length - 1) * HOP_MS + 160,
  });
  const { game, shown, canMove, play, prefs } = session;
  const [prefix, setPrefix] = useState<number[]>([]);
  const [shake, setShake] = useState<{ square: number; key: number } | null>(null);

  const legal = canMove && game ? game.legalMoves : [];
  // A new position (or a new game) discards any half-built move.
  useEffect(() => setPrefix([]), [game?.id, game?.version]);

  // The board is drawn from the human's side; in two-player games, from Dark's.
  const flipped = game ? game.mode === 'VS_AI' && game.humanSide === 'P2' : prefs.mode === 'VS_AI' && prefs.humanSide === 'P2';

  function reject(square: number) {
    setShake({ square, key: Date.now() });
  }

  function onSquare(square: number) {
    if (!shown || legal.length === 0) return;
    const paths = legal.map((move) => move.path);

    if (prefix.length > 0 && nextSteps(paths, prefix).includes(square)) {
      const next = [...prefix, square];
      const done = completedBy(paths, next);
      if (done >= 0) {
        setPrefix([]);
        play(legal[done], previewMove(shown.state, legal[done]));
      } else {
        setPrefix(next);
      }
      return;
    }
    if (prefix.length === 1 && square === prefix[0]) {
      setPrefix([]);
      return;
    }
    // Once a jump has started it must be finished with the same piece.
    if (prefix.length <= 1 && paths.some((path) => path[0] === square)) {
      setPrefix([square]);
      return;
    }
    if (prefix.length > 1) {
      reject(prefix[0]);
    } else if (owner(shown.state.board[square]) === shown.state.sideToMove) {
      reject(square);
    }
  }

  const capturing = legal.length > 0 && legal[0].captures.length > 0;
  const note = (() => {
    if (!game || game.status !== 'IN_PROGRESS' || legal.length === 0) return null;
    if (prefix.length > 1) return 'Keep jumping.';
    if (capturing) return 'You must capture.';
    return null;
  })();

  const count = (side: Side) => Array.from(shown?.state.board ?? '').filter((piece) => owner(piece) === side).length;

  return (
    <GameShell
      theme="winter"
      title="Checkers"
      Scene={WinterScene}
      session={session}
      aspect={1}
      boardRef={boardRef}
      sideName={sideName}
      swatch={swatch}
      sideChoice={{
        label: 'Play as',
        options: [
          { value: 'P1', label: 'Dark (first)' },
          { value: 'P2', label: 'Light' },
        ],
        describe: (side) => (side === 'P1' ? 'play Dark' : 'play Light'),
      }}
      note={note}
      panel={
        game && (
          <PlayerList>
            {(['P1', 'P2'] as Side[]).map((side) => (
              <PlayerRow
                key={side}
                swatch={swatch(side)}
                name={sideName(side)}
                role={game.mode === 'LOCAL' ? (side === 'P1' ? 'Player 1' : 'Player 2') : side === game.humanSide ? 'You' : 'Computer'}
                detail={`${count(side)} left · ${PIECES_EACH - count(side === 'P1' ? 'P2' : 'P1')} taken`}
                active={game.status === 'IN_PROGRESS' && shown?.state.sideToMove === side}
              />
            ))}
          </PlayerList>
        )
      }
      board={
        shown && (
          <CheckersBoard
            ref={boardRef}
            shown={shown}
            flipped={flipped}
            legal={legal}
            prefix={prefix}
            onSquare={onSquare}
            onCancel={() => setPrefix([])}
            shake={shake}
          />
        )
      }
      rules={<CheckersRules />}
      flourish="snow"
    />
  );
}
