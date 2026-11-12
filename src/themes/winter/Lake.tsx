import { useId } from 'react';
import styles from './Lake.module.css';

// Far-shore pines mirrored in the ice: centre x and length in the 400 × 90 drawing.
const REFLECTIONS = [
  { x: 54, len: 30 },
  { x: 92, len: 22 },
  { x: 128, len: 26 },
  { x: 292, len: 24 },
  { x: 336, len: 30 },
];

/** A frozen lake at the bottom left: faint reflections, hairline cracks and a slow glint sweep. */
export function Lake() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <div className={styles.lake}>
      <svg viewBox="0 0 400 90" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-ice`}>
            <ellipse cx={200} cy={46} rx={192} ry={30} />
          </clipPath>
        </defs>
        <ellipse className={styles.ice} cx={200} cy={46} rx={192} ry={30} />
        <g clipPath={`url(#${id}-ice)`}>
          <ellipse className={styles.deep} cx={214} cy={52} rx={150} ry={17} />
          <path
            className={styles.reflection}
            d={REFLECTIONS.map((ref) => `M${ref.x - 7} 16 L${ref.x + 7} 16 L${ref.x} ${16 + ref.len} Z`).join(' ')}
          />
          <g transform="skewX(-24)">
            <rect className={styles.glint} x={-60} y={0} width={22} height={90} />
          </g>
        </g>
        <path className={styles.crack} d="M36 30 L58 34 L74 30 L96 35 M58 34 L62 40 M246 36 L270 43 L296 39 L310 44" />
        <path className={styles.lip} d="M-20 70 C 70 80 160 84 230 81 C 300 78 360 72 420 62 L420 92 L-20 92 Z" />
      </svg>
    </div>
  );
}
