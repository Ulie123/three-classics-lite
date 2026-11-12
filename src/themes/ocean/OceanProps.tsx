import styles from './OceanProps.module.css';

/** A half-buried treasure chest with its lid ajar: a glint on the rim now and then, and a few bubbles. */
function Chest() {
  return (
    <div className={styles.chest} data-prop="hero">
      <svg viewBox="0 0 120 96" aria-hidden="true">
        {/* Body, with two gold bands and a lock plate. */}
        <rect className={styles.wood} x={14} y={46} width={92} height={42} rx={5} />
        <rect className={styles.woodShade} x={14} y={46} width={92} height={8} rx={3} />
        <rect className={styles.gold} x={26} y={46} width={8} height={42} />
        <rect className={styles.gold} x={86} y={46} width={8} height={42} />
        <rect className={styles.gold} x={55} y={53} width={10} height={12} rx={2} />
        <circle className={styles.woodShade} cx={60} cy={59} r={1.8} />
        {/* The dark inside, with a few coins showing under the lid. */}
        <path className={styles.inside} d="M15 47 L105 47 L104 38 L17 32 Z" />
        <circle className={styles.coin} cx={30} cy={42} r={4} />
        <circle className={styles.coin} cx={39} cy={40} r={4} />
        <circle className={styles.coinShade} cx={48} cy={42} r={4} />
        <circle className={styles.coin} cx={57} cy={41} r={4} />
        {/* The lid, tipped up at the front. */}
        <g className={styles.lid}>
          <path className={styles.woodLight} d="M12 34 Q60 10 108 34 L108 42 L12 42 Z" />
          <rect className={styles.gold} x={12} y={38} width={96} height={5} rx={2} />
          <rect className={styles.gold} x={26} y={21} width={8} height={20} />
          <rect className={styles.gold} x={86} y={21} width={8} height={20} />
          <rect className={styles.glint} x={40} y={38.6} width={14} height={2.6} rx={1.3} />
        </g>
        {/* Sand drifted over the lower half. */}
        <path
          className={styles.sand}
          d="M-30 130 L-30 80 C -8 74 10 70 26 74 C 44 78 70 66 92 70 C 110 73 128 76 150 80 L150 130 Z"
        />
        <path className={styles.sandLight} d="M-30 80 C -8 74 10 70 26 74 C 44 78 70 66 92 70 C 110 73 128 76 150 80 L150 84 C 128 80 110 77 92 74 C 70 70 44 82 26 78 C 10 74 -8 78 -30 84 Z" />
        {/* Bubbles escaping from under the lid. */}
        <circle className={`${styles.bubble} ${styles.bubbleA}`} cx={50} cy={34} r={3} />
        <circle className={`${styles.bubble} ${styles.bubbleB}`} cx={56} cy={32} r={2} />
        <circle className={`${styles.bubble} ${styles.bubbleC}`} cx={45} cy={33} r={1.6} />
      </svg>
    </div>
  );
}

/** A seahorse holding on to its own kelp stem, bobbing gently with a fluttering fin. */
function Seahorse() {
  return (
    <div className={styles.seahorse} data-prop="hero">
      <svg viewBox="0 0 60 300" aria-hidden="true">
        <path
          className={styles.stem}
          d="M18 300 C 10 250 26 214 18 166 C 12 124 26 92 22 52 C 21 40 23 30 24 22 C 30 50 32 92 28 132 C 24 172 34 212 28 252 C 26 272 26 286 26 300 Z"
        />
        <path className={styles.blade} d="M24 96 C 36 84 46 70 50 54 C 42 70 32 80 25 88 Z" />
        <g className={styles.seahorseBody}>
          <path className={styles.tail} d="M34 176 C 33 186 29 192 24 197" />
          <ellipse className={`${styles.horseLight} ${styles.fin}`} cx={23} cy={154} rx={3.6} ry={7.5} />
          <path
            className={styles.horse}
            d="M31 129 C 25 136 24 148 26 160 C 27 168 29 174 31 178 L 37 178 C 42 170 45 158 43 148 C 42 140 40 134 38 130 Z"
          />
          <path className={styles.horseShade} d="M31 129 C 25 136 24 148 26 160 C 27 168 29 174 31 178 L 33 178 C 31 166 29 150 32 132 Z" />
          <ellipse className={styles.horseLight} cx={39.5} cy={154} rx={2.6} ry={10} />
          <path className={styles.horse} d="M40 125 L 53 128 Q 56 130.5 53 133 L 40 134 Z" />
          <ellipse className={styles.horse} cx={35} cy={127} rx={8} ry={7} />
          <circle className={styles.horseShade} cx={31} cy={120} r={3} />
          <circle className={styles.eye} cx={37} cy={125.5} r={1.6} />
          <circle className={styles.eyeLight} cx={37.5} cy={125} r={0.5} />
        </g>
        <path className={styles.tailCurl} d="M24 197 C 18 201 18 209 24 209 C 28.5 209 28.5 203 24.5 203" />
      </svg>
    </div>
  );
}

function Fish({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className={styles.schoolTail} d="M-8 0 L-14 -4.5 Q-12.5 0 -14 4.5 Z" />
      <ellipse className={styles.schoolFish} cx={0} cy={0} rx={9} ry={3.6} />
      <path className={styles.schoolBelly} d="M-7 0.6 Q0 4.2 8 0.6 Q0 2.2 -7 0.6 Z" />
      <circle className={styles.eye} cx={5.2} cy={-0.8} r={0.9} />
    </g>
  );
}

/** A small school crossing mid-water every half minute or so, on a gentle wave. */
function School() {
  return (
    <div className={styles.school} data-crosser>
      <div className={styles.wave}>
        <svg viewBox="0 0 140 60" aria-hidden="true">
          <Fish x={112} y={30} />
          <Fish x={90} y={16} s={0.9} />
          <Fish x={86} y={44} s={0.95} />
          <Fish x={62} y={28} s={0.85} />
          <Fish x={40} y={12} s={0.8} />
          <Fish x={36} y={46} s={0.85} />
          <Fish x={16} y={30} s={0.75} />
        </svg>
      </div>
    </div>
  );
}

/** Two reef fish pottering back and forth in the gap beside the board. */
function ReefFish() {
  return (
    <div className={styles.reefFish} data-secondary>
      <div className={`${styles.patrol} ${styles.patrolA}`}>
        <svg className={`${styles.turn} ${styles.turnA}`} viewBox="0 0 40 26" aria-hidden="true">
          <path className={styles.yellowShade} d="M28 13 L39 5 Q36 13 39 21 Z" />
          <path className={styles.yellowShade} d="M12 6 Q18 -1 26 5 Z" />
          <ellipse className={styles.yellow} cx={17} cy={13} rx={12} ry={8.5} />
          <path className={styles.yellowShade} d="M7 16 Q17 23 28 15 Q17 19 7 16 Z" />
          <circle className={styles.eye} cx={10} cy={11} r={1.4} />
        </svg>
      </div>
      <div className={`${styles.patrol} ${styles.patrolB}`}>
        <svg className={`${styles.turn} ${styles.turnB}`} viewBox="0 0 40 26" aria-hidden="true">
          <path className={styles.coralShade} d="M27 13 L37 6 Q34.5 13 37 20 Z" />
          <ellipse className={styles.coralFish} cx={17} cy={13} rx={11} ry={6.5} />
          <path className={styles.coralShade} d="M8 15 Q17 20 26 14.5 Q17 17 8 15 Z" />
          <circle className={styles.eye} cx={10.5} cy={11.5} r={1.3} />
        </svg>
      </div>
    </div>
  );
}

/** Branching coral and a swaying anemone on a rock, at the foot of the gap beside the board. */
function ReefBed() {
  return (
    <div className={styles.reefBed} data-secondary>
      <svg viewBox="0 0 140 100" aria-hidden="true">
        <ellipse className={styles.groundShadow} cx={72} cy={96} rx={64} ry={5} />
        <g className={styles.branches}>
          <path d="M38 88 C 36 70 30 60 22 50 M36 74 C 42 62 44 52 42 40 M30 62 C 24 58 18 58 12 60 M42 56 C 50 50 54 42 54 32 M24 52 C 22 44 24 36 28 30" />
        </g>
        <g className={styles.branchesShade}>
          <path d="M50 90 C 52 76 58 68 66 62 M56 74 C 54 66 50 60 46 56" />
        </g>
        <path className={styles.rock} d="M14 100 C 18 84 36 78 56 80 C 74 82 86 76 100 78 C 118 80 132 88 136 100 Z" />
        <path className={styles.rockLight} d="M24 88 C 34 82 48 81 58 83 C 46 83 34 85 24 90 Z" />
        <g className={styles.anemone}>
          <path d="M100 80 C 96 70 92 64 88 60 M102 79 C 102 68 100 60 98 54 M105 79 C 108 68 110 62 114 58 M108 80 C 114 72 120 68 126 66 M98 81 C 92 74 86 72 80 72" />
        </g>
        <ellipse className={styles.anemoneBase} cx={103} cy={82} rx={10} ry={5} />
      </svg>
    </div>
  );
}

/** The ocean's animals and objects, placed in the gutters around the board. */
export function OceanProps() {
  return (
    <>
      <School />
      <ReefBed />
      <ReefFish />
      <Seahorse />
      <Chest />
    </>
  );
}
