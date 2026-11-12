import { Cabin } from './Cabin';
import { pine } from './pine';
import styles from './WinterProps.module.css';

const BIG = pine(66, 280, 270, 128, 5, 0.56);
const SMALL = pine(132, 262, 160, 76, 4, 0.52);

/** Two heavily snowed pines in the left gutter; now and then a clump slides off a branch with a puff. */
function BigPines() {
  return (
    <div className={styles.pines} data-secondary>
      <svg viewBox="0 0 160 290" aria-hidden="true">
        <path className={styles.farTree} d={SMALL.tree} />
        <path className={styles.farSnow} d={SMALL.snow} />
        <path className={styles.farShade} d={SMALL.shade} />
        <rect className={styles.trunk} x={61} y={268} width={10} height={16} />
        <path className={styles.tree} d={BIG.tree} />
        <path className={styles.snow} d={BIG.snow} />
        <path className={styles.snowShade} d={BIG.shade} />
        <ellipse className={styles.snow} cx={80} cy={286} rx={84} ry={11} />
        <path className={styles.snowShade} d="M96 296 C 120 292 150 288 164 286 C 160 292 140 297 120 297 Z" />
        <g className={styles.clump}>
          <ellipse className={styles.snow} cx={109} cy={206} rx={9} ry={5} />
          <ellipse className={styles.snowShade} cx={112} cy={208.5} rx={5.5} ry={2.4} />
        </g>
        <g className={styles.puff}>
          <circle className={styles.snow} cx={122} cy={276} r={5} />
          <circle className={styles.snow} cx={131} cy={279} r={4} />
          <circle className={styles.snow} cx={114} cy={280} r={3.5} />
        </g>
      </svg>
    </div>
  );
}

// Paw prints leading away to the right across the snowbank.
const PRINTS = [
  [118, 75],
  [126, 72],
  [137, 77],
  [146, 73],
  [157, 78],
  [166, 74],
];

/** An arctic fox curled up on a snowbank by the lake. */
function Fox() {
  return (
    <div className={styles.fox} data-prop="hero">
      <svg viewBox="0 0 150 92" aria-hidden="true">
        <path className={styles.bank} d="M-30 96 L-30 66 C -4 56 30 58 60 60 C 96 62 130 56 180 66 L180 96 Z" />
        <path className={styles.bankShade} d="M70 96 C 96 86 136 80 180 78 L180 96 Z" />
        <ellipse className={styles.bankShade} cx={76} cy={66} rx={42} ry={5} />
        {PRINTS.map(([x, y], i) => (
          <ellipse key={i} className={styles.print} cx={x} cy={y} rx={1.9} ry={1.2} />
        ))}
        <ellipse className={styles.furShade} cx={84} cy={55} rx={30} ry={16} />
        <ellipse className={styles.fur} cx={82} cy={48} rx={25} ry={9} />
        <g className={styles.tail}>
          <path
            className={styles.furLight}
            d="M108 46 C 127 52 127 75 104 79 C 82 83 50 81 33 71 C 28 68 28 63 33 62 C 48 67 70 70 88 68 C 104 66 112 58 108 46 Z"
          />
          <path className={styles.tailShade} d="M33 71 C 50 81 82 83 104 79 C 82 79 54 79 33 71 Z" />
        </g>
        <g className={styles.head}>
          <g className={styles.earBack}>
            <path className={styles.furShade} d="M54 42 C 55 36 58 32 61 31 C 62 35 61 40 59 44 Z" />
            <path className={styles.earInner} d="M55.5 41 C 56.5 37 58 34.5 60 33.5 C 60.5 36.5 59.5 39.5 58 42 Z" />
          </g>
          <ellipse className={styles.fur} cx={51} cy={52} rx={13} ry={11} />
          <ellipse className={styles.furLight} cx={55} cy={59} rx={9} ry={4.5} />
          <path className={styles.fur} d="M40 51 C 34 52 29 55 27.5 58 C 30.5 61 37 61 42 59 Z" />
          <circle className={styles.dark} cx={28} cy={58} r={1.9} />
          <path className={styles.fur} d="M43 45 C 41 38 42 33 45 30 C 49 33 51 38 51 43 Z" />
          <path className={styles.earInner} d="M44.5 43 C 43.5 38 44 35 45.5 33 C 47.5 35.5 48.5 38.5 48.5 42 Z" />
          <g className={styles.blink}>
            <circle className={styles.dark} cx={44.5} cy={50} r={1.7} />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** The winter scene's animals and objects: pines and fox in the left gutter, a cabin beside the board. */
export function WinterProps() {
  return (
    <>
      <BigPines />
      <Cabin />
      <Fox />
    </>
  );
}
