import styles from './DesertProps.module.css';

/** A tall saguaro with both arms raised, in the left gutter. */
function Saguaro() {
  return (
    <div className={styles.saguaro} data-prop="hero">
      <svg viewBox="0 0 100 260" aria-hidden="true">
        <ellipse className={styles.groundShadow} cx={52} cy={258} rx={34} ry={5} />
        <path className={styles.arm} d="M40 156 C 22 156 15 146 15 128 L15 84" strokeWidth={19} />
        <path className={styles.arm} d="M60 124 C 80 124 86 114 86 98 L86 58" strokeWidth={17} />
        <path className={styles.armLight} d="M11 128 L11 86" strokeWidth={5} />
        <path className={styles.armLight} d="M82.5 100 L82.5 60" strokeWidth={4.5} />
        <rect className={styles.cactus} x={35} y={10} width={30} height={252} rx={15} />
        <rect className={styles.cactusShade} x={52} y={14} width={13} height={248} rx={6.5} />
        <rect className={styles.cactusLight} x={39.5} y={22} width={5} height={236} rx={2.5} />
      </svg>
    </div>
  );
}

/** A bleached cow skull lying half-sunk in the sand by the saguaro. Static. */
function Skull() {
  return (
    <div className={styles.skull} data-prop="hero">
      <svg viewBox="0 0 100 70" aria-hidden="true">
        <g transform="rotate(-8 50 40)">
          <path className={styles.horn} d="M31 27 C 18 25 7 18 3 5 C 12 13 22 17 33 20 Z" />
          <path className={styles.horn} d="M69 27 C 82 25 93 18 97 5 C 88 13 78 17 67 20 Z" />
          <path
            className={styles.bone}
            d="M30 18 C 40 11 60 11 70 18 C 74 30 70 40 64 46 C 60 58 56 64 50 64 C 44 64 40 58 36 46 C 30 40 26 30 30 18 Z"
          />
          <path className={styles.boneShade} d="M50 12.5 C 60 12.5 66 14.5 70 18 C 74 30 70 40 64 46 C 60 58 56 64 50 64 Z" />
          <ellipse className={styles.socket} cx={41} cy={32} rx={5} ry={6} />
          <ellipse className={styles.socket} cx={59} cy={32} rx={5} ry={6} />
          <ellipse className={styles.socket} cx={46.5} cy={56} rx={1.6} ry={3} />
          <ellipse className={styles.socket} cx={53.5} cy={56} rx={1.6} ry={3} />
        </g>
        <path className={styles.sand} d="M-30 96 L-30 58 C -6 51 30 54 50 55 C 70 56 96 48 130 56 L130 96 Z" />
        <path className={styles.sandLight} d="M-30 58 C -6 51 30 54 50 55 C 70 56 96 48 130 56 L130 60 C 96 52 70 60 50 59 C 30 58 -6 55 -30 62 Z" />
      </svg>
    </div>
  );
}

/** A prickly pear with one small pink flower, at the foot of the gap beside the board. */
function PricklyPear() {
  return (
    <div className={styles.pear} data-secondary>
      <svg viewBox="0 0 90 80" aria-hidden="true">
        <ellipse className={styles.groundShadow} cx={46} cy={78} rx={34} ry={4} />
        <ellipse className={styles.paddleShade} cx={28} cy={54} rx={12} ry={16} transform="rotate(-28 28 54)" />
        <ellipse className={styles.paddleShade} cx={64} cy={52} rx={11} ry={15} transform="rotate(30 64 52)" />
        <ellipse className={styles.paddle} cx={46} cy={58} rx={15} ry={20} />
        <ellipse className={styles.paddleLight} cx={41} cy={54} rx={5} ry={10} />
        <ellipse className={styles.paddle} cx={54} cy={28} rx={10} ry={14} transform="rotate(14 54 28)" />
        <ellipse className={styles.paddleLight} cx={51} cy={26} rx={3.4} ry={7} transform="rotate(14 51 26)" />
        <g className={styles.flower}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse key={angle} className={styles.petal} cx={57} cy={10} rx={2.6} ry={4} transform={`rotate(${angle} 57 14)`} />
          ))}
          <circle className={styles.flowerHeart} cx={57} cy={14} r={2} />
        </g>
      </svg>
    </div>
  );
}

/** A tumbleweed bowling along the bottom about every half minute, with the sand gust. */
function Tumbleweed() {
  return (
    <div className={styles.tumbleweed} data-crosser data-tumbleweed>
      <div className={styles.bounce}>
        <svg className={styles.roll} viewBox="0 0 40 40" aria-hidden="true">
          <circle className={styles.weed} cx={20} cy={20} r={17} />
          <path
            className={styles.twigs}
            d="M8 14 C 14 6 26 6 32 14 M6 22 C 12 30 26 34 34 24 M12 10 C 8 20 12 30 20 34 M28 8 C 34 16 32 28 24 34 M10 28 C 18 22 24 18 34 18 M14 32 C 18 22 20 14 22 6"
          />
          <ellipse className={styles.gap} cx={15} cy={18} rx={3} ry={2.2} />
          <ellipse className={styles.gap} cx={25} cy={25} rx={2.6} ry={2} />
          <ellipse className={styles.gap} cx={23} cy={12} rx={2} ry={1.6} />
        </svg>
      </div>
    </div>
  );
}

/** The desert's objects: saguaro and skull in the left gutter, a prickly pear beside the board. */
export function DesertProps() {
  return (
    <>
      <Saguaro />
      <PricklyPear />
      <Tumbleweed />
      <Skull />
    </>
  );
}

/** Tumbleweed loop length and the moment in it when the tumbleweed sets off (ms), for the sand gust. */
export const TUMBLE_LOOP_MS = 31700;
export const TUMBLE_START_MS = 2300;
