import { useId } from 'react';
import styles from './Waterfall.module.css';

// Three drops, top to bottom: x, top, width and height in the 120 × 400 drawing.
const DROPS = [
  { x: 52, y: 20, w: 16, h: 106 },
  { x: 47, y: 140, w: 24, h: 112 },
  { x: 41, y: 266, w: 34, h: 116 },
];
const DASH = 24;

// A stepped cliff: three rock slabs, each wider than the one above, with a lit top face and moss.
const TIERS = [
  { x: 26, y: 18, w: 68, h: 118 },
  { x: 14, y: 128, w: 92, h: 134 },
  { x: 4, y: 254, w: 112, h: 136 },
];
// Lit stones set into the cliff face, so it reads as rock rather than a wall.
const STONES = [
  { cx: 36, cy: 70, rx: 9, ry: 6 },
  { cx: 84, cy: 92, rx: 8, ry: 5 },
  { cx: 26, cy: 190, rx: 10, ry: 7 },
  { cx: 92, cy: 214, rx: 11, ry: 7 },
  { cx: 16, cy: 318, rx: 11, ry: 7 },
  { cx: 100, cy: 336, rx: 12, ry: 8 },
];
// Leaf clumps that tuck the cliff edges into the forest.
const CLUMPS = [
  { cx: 22, cy: 120, r: 13 },
  { cx: 100, cy: 132, r: 12 },
  { cx: 10, cy: 250, r: 14 },
  { cx: 112, cy: 262, r: 13 },
];

/** A slim three-tier waterfall falling into a pool. The water moves as a dash pattern. */
export function Waterfall() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <div className={styles.waterfall}>
      <svg viewBox="0 0 120 400" aria-hidden="true">
        <defs>
          {DROPS.map((drop, i) => (
            <clipPath key={i} id={`${id}-drop-${i}`}>
              <rect x={drop.x} y={drop.y} width={drop.w} height={drop.h} rx={drop.w / 3} />
            </clipPath>
          ))}
        </defs>

        {TIERS.map((t, i) => (
          <g key={i}>
            <rect className={styles.rockShade} x={t.x} y={t.y} width={t.w} height={t.h} rx={18} />
            <rect className={styles.rock} x={t.x + 3} y={t.y + 2} width={t.w - 6} height={16} rx={8} />
            <rect className={styles.moss} x={t.x + 8} y={t.y - 2} width={t.w - 16} height={8} rx={4} />
          </g>
        ))}
        {STONES.map((stone, i) => (
          <ellipse key={i} className={styles.rock} cx={stone.cx} cy={stone.cy} rx={stone.rx} ry={stone.ry} />
        ))}
        {CLUMPS.map((c, i) => (
          <g key={i}>
            <circle className={styles.leafShade} cx={c.cx} cy={c.cy} r={c.r} />
            <circle className={styles.leafLight} cx={c.cx - c.r * 0.3} cy={c.cy - c.r * 0.35} r={c.r * 0.45} />
          </g>
        ))}

        {DROPS.map((drop, i) => (
          <g key={i}>
            <rect className={styles.water} x={drop.x} y={drop.y} width={drop.w} height={drop.h} rx={drop.w / 3} />
            <g clipPath={`url(#${id}-drop-${i})`}>
              <g className={styles.flow} style={{ animationDuration: `${0.9 + i * 0.12}s` }}>
                {Array.from({ length: Math.ceil(drop.h / DASH) + 2 }, (_, j) =>
                  [0.25, 0.55, 0.8].map((fx, k) => (
                    <rect
                      key={`${j}-${k}`}
                      className={styles.streak}
                      x={drop.x + drop.w * fx - 1.2}
                      y={drop.y - DASH + j * DASH + k * 8}
                      width={2.4}
                      height={13}
                      rx={1.2}
                    />
                  )),
                )}
              </g>
            </g>
            <ellipse className={styles.pool} cx={drop.x + drop.w / 2} cy={drop.y + drop.h + 2} rx={drop.w * 1.1} ry={4.5} />
            <ellipse className={styles.mist} cx={drop.x + drop.w / 2} cy={drop.y + drop.h} rx={drop.w * 0.9} ry={6} />
          </g>
        ))}

        {/* Foliage over the top, so the water comes out of the forest rather than a flat cliff. */}
        <path
          className={styles.leafShade}
          d="M-4 22 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 Z M28 14 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z M58 18 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0 Z M90 26 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z"
        />
        <path className={styles.leafLight} d="M6 14 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z M66 8 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z" />

        <ellipse className={styles.pool} cx={58} cy={388} rx={58} ry={11} />
        <ellipse className={`${styles.ripple} ${styles.rippleA}`} cx={56} cy={386} rx={22} ry={3.5} />
        <ellipse className={`${styles.ripple} ${styles.rippleB}`} cx={62} cy={390} rx={36} ry={4.5} />
      </svg>
    </div>
  );
}
