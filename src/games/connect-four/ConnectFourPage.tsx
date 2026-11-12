import { useRef } from 'react';
import type { Side } from '../../api/types';
import { OceanScene } from '../../themes/ocean/OceanScene';
import { GameShell } from '../shared/GameShell';
import { PlayerRow, PlayerList } from '../shared/PlayerList';
import { useGameSession } from '../shared/useGameSession';
import { ConnectFourBoard, DiscSwatch } from './ConnectFourBoard';
import { ConnectFourRules } from './ConnectFourRules';
import { ROWS, VIEW_H, VIEW_W, dropDuration, previewDrop } from './geometry';
import type { ConnectFourMove, ConnectFourState } from './types';

const DISCS_EACH = 21;
const sideName = (side: Side) => (side === 'P1' ? 'Coral' : 'Gold');
const swatch = (side: Side) => <DiscSwatch side={side} />;

export function ConnectFourPage() {
  const boardRef = useRef<SVGSVGElement>(null);
  const session = useGameSession<ConnectFourState, ConnectFourMove>({
    type: 'CONNECT_FOUR',
    eventDuration: (event) => dropDuration(event.state.lastDrop?.row ?? ROWS - 1) + 120,
  });
  const { game, shown, canMove, play } = session;

  const legalColumns = canMove && game ? game.legalMoves.map((move) => move.column) : [];
  const discsLeft = (side: Side) =>
    DISCS_EACH - (shown?.state.columns.flat().filter((disc) => disc === side).length ?? 0);

  return (
    <GameShell
      theme="ocean"
      title="Connect Four"
      Scene={OceanScene}
      session={session}
      aspect={VIEW_W / VIEW_H}
      boardShadow={false}
      boardRef={boardRef}
      sideName={sideName}
      swatch={swatch}
      sideChoice={{
        label: 'Order',
        options: [
          { value: 'P1', label: 'Go first' },
          { value: 'P2', label: 'Go second' },
        ],
        describe: (side) => (side === 'P1' ? 'go first' : 'go second'),
      }}
      panel={
        game && (
          <PlayerList>
            {(['P1', 'P2'] as Side[]).map((side) => (
              <PlayerRow
                key={side}
                swatch={swatch(side)}
                name={sideName(side)}
                role={game.mode === 'LOCAL' ? (side === 'P1' ? 'Player 1' : 'Player 2') : side === game.humanSide ? 'You' : 'Computer'}
                detail={`${discsLeft(side)} left`}
                active={game.status === 'IN_PROGRESS' && shown?.state.sideToMove === side}
              />
            ))}
          </PlayerList>
        )
      }
      board={
        shown && (
          <ConnectFourBoard
            ref={boardRef}
            shown={shown}
            legalColumns={legalColumns}
            onDrop={(column) => game && shown && play({ column }, previewDrop(shown.state, column, game.sideToMove))}
          />
        )
      }
      rules={<ConnectFourRules />}
      flourish="bubbles"
    />
  );
}
