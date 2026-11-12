import styles from './Dice.module.css';

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

interface DiceProps {
  /** Two dice, or four for doubles. Zero draws a blank die. */
  values: number[];
  /** Which dice are still to be played; used dice are dimmed. */
  active: boolean[];
  /** Changes whenever a fresh roll should tumble. */
  rollKey: number | null;
  label: string;
}

export function Dice({ values, active, rollKey, label }: DiceProps) {
  return (
    <div className={styles.dice} role="img" aria-label={label}>
      {values.map((value, i) => (
        <span
          key={`${rollKey ?? 'still'}-${i}`}
          className={[styles.die, rollKey !== null ? styles.rolling : '', values.length === 4 ? styles.small : ''].join(' ')}
          data-used={!active[i]}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <rect x={1} y={1} width={38} height={38} rx={8} className={styles.face} />
            {(PIPS[value] ?? []).map(([cx, cy], j) => (
              <circle key={j} cx={10 + cx * 10} cy={10 + cy * 10} r={3.4} className={styles.pip} />
            ))}
          </svg>
        </span>
      ))}
    </div>
  );
}
