import styles from './JungleProps.module.css';

/**
 * Rainforest animals around the edges of the home page, clear of the title and the cards. Flat
 * shapes in two to four palette tones, dot eyes, no mouths. Each rests most of the time.
 */
export function JungleProps() {
  return (
    <>
      <Toucan />
      <Parrot />
      <Monkey />
      <Sloth />
      <Python />
    </>
  );
}

/** Perched on a branch; now and then tilts its head, and blinks. */
function Toucan() {
  return (
    <div className={styles.toucan} data-prop="hero">
      <svg viewBox="0 0 120 100" aria-hidden="true">
        <path className={styles.dark} d="M45 70 Q44 90 49 99 Q54 101 58 99 Q60 88 57 70 Z" />
        <path className={styles.dark} d="M38 40 C30 52 32 70 44 74 C54 78 62 70 62 56 C62 44 54 36 46 36 Z" />
        <path className={styles.cream} d="M51 38 C60 40 64 50 60 61 C54 56 50 47 51 38 Z" />
        <path className={styles.branch} d="M0 70 C40 66 80 66 120 62 L120 70 C80 75 40 76 0 80 Z" />
        <path className={styles.branchShade} d="M0 76 C40 72 80 72 120 67 L120 70 C80 75 40 76 0 80 Z" />
        <path className={styles.leaf} d="M96 66 q14 -16 26 -10 q-10 14 -26 10 Z" />
        <path className={styles.leafLight} d="M104 68 q16 2 18 14 q-14 -2 -18 -14 Z" />
        <g className={styles.toucanHead}>
          <circle className={styles.dark} cx={50} cy={30} r={12} />
          <path className={styles.beak} d="M58 22 C74 16 92 22 98 32 C90 36 72 36 59 34 Z" />
          <path className={styles.beakShade} d="M59 34 C72 36 90 36 98 32 C92 38 74 40 60 38 Z" />
          <circle className={styles.ring} cx={52} cy={27} r={3.6} />
          <g className={styles.toucanBlink}>
            <circle className={styles.dark} cx={52.4} cy={27} r={1.9} />
            <circle className={styles.cream} cx={53.1} cy={26.3} r={0.6} />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** About once a minute a parrot flaps across the canopy band. */
function Parrot() {
  return (
    <div className={styles.parrot} data-crosser>
      <svg viewBox="0 0 80 54" aria-hidden="true">
        <path className={styles.leaf} d="M21 30 L0 41 L5 32 L0 27 Z" />
        <path className={styles.leafLight} d="M18 30 C26 20 46 18 58 24 C64 28 62 34 54 36 C42 40 26 38 18 30 Z" />
        <circle className={styles.leafLight} cx={60} cy={25} r={8} />
        <path className={styles.red} d="M57 18 q6 -3 10 2 q-5 2 -10 -2 Z" />
        <path className={styles.cream} d="M67 23 q7 0 6 7 q-3 -3 -7 -2 Z" />
        <circle className={styles.dark} cx={62} cy={24} r={1.4} />
        <path className={`${styles.leaf} ${styles.wing}`} d="M36 27 C30 9 44 1 52 5 C52 15 46 24 40 29 Z" />
      </svg>
    </div>
  );
}

/** Hangs by its tail from a vine, swinging slowly, and looks around now and then. */
function Monkey() {
  return (
    <div className={styles.monkey} data-prop="hero" data-secondary>
      <svg viewBox="0 0 70 160" aria-hidden="true">
        <path className={styles.vine} d="M33 0 H37 V48 H33 Z" />
        <path className={styles.leaf} d="M37 16 q12 -6 16 4 q-10 4 -16 -4 Z" />
        <path className={styles.leafLight} d="M33 30 q-12 -4 -15 6 q10 2 15 -6 Z" />
        <g className={styles.monkeySwing}>
          <path className={styles.tail} d="M35 46 C30 42 30 38 35 37 C40 37 41 42 36 46 C32 52 36 58 35 66" />
          <path className={styles.limb} d="M30 70 L27 58 M40 70 L43 58" />
          <ellipse className={styles.fur} cx={35} cy={82} rx={13} ry={17} />
          <ellipse className={styles.tan} cx={35} cy={86} rx={7} ry={11} />
          <path className={styles.limb} d="M26 94 C22 108 20 120 21 134 M44 94 C48 108 50 120 49 134" />
          <circle className={styles.tan} cx={21} cy={135} r={3.4} />
          <circle className={styles.tan} cx={49} cy={135} r={3.4} />
          <g className={styles.monkeyHead}>
            <circle className={styles.fur} cx={21} cy={110} r={5} />
            <circle className={styles.fur} cx={49} cy={110} r={5} />
            <circle className={styles.tan} cx={21} cy={110} r={2.6} />
            <circle className={styles.tan} cx={49} cy={110} r={2.6} />
            <circle className={styles.fur} cx={35} cy={110} r={13} />
            <ellipse className={styles.face} cx={35} cy={106} rx={6} ry={4} />
            <circle className={styles.face} cx={30.5} cy={114} r={6.2} />
            <circle className={styles.face} cx={39.5} cy={114} r={6.2} />
            <circle className={styles.eye} cx={31} cy={115} r={1.6} />
            <circle className={styles.eye} cx={39} cy={115} r={1.6} />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** Hangs under a low branch, nearly still: a slow blink, and a very slow turn of the head. */
function Sloth() {
  return (
    <div className={styles.sloth} data-prop="hero" data-secondary>
      <svg viewBox="0 0 130 92" aria-hidden="true">
        <path className={styles.branch} d="M0 22 C40 18 90 16 130 12 L130 24 C90 26 40 28 0 30 Z" />
        <path className={styles.branchShade} d="M0 26 C40 24 90 22 130 19 L130 24 C90 26 40 28 0 30 Z" />
        <path className={styles.slothLimb} d="M46 52 L38 20 M56 48 L53 18 M72 48 L77 17 M84 52 L92 17" />
        <ellipse className={styles.slothFur} cx={64} cy={57} rx={30} ry={15} />
        <g className={styles.slothHead}>
          <circle className={styles.slothFur} cx={36} cy={61} r={14} />
          <ellipse className={styles.slothMask} cx={36} cy={62} rx={11} ry={9} />
          <ellipse className={styles.slothPatch} cx={31} cy={60} rx={4.4} ry={2.6} transform="rotate(-20 31 60)" />
          <ellipse className={styles.slothPatch} cx={41} cy={60} rx={4.4} ry={2.6} transform="rotate(20 41 60)" />
          <g className={styles.slothBlink}>
            <circle className={styles.eye} cx={31.5} cy={60} r={1.4} />
            <circle className={styles.eye} cx={40.5} cy={60} r={1.4} />
          </g>
          <ellipse className={styles.slothPatch} cx={36} cy={66} rx={2.2} ry={1.4} />
        </g>
        <path className={styles.leaf} d="M8 25 q14 -18 28 -10 q-12 14 -28 10 Z" />
        <path className={styles.leafLight} d="M104 20 q10 10 22 6 q-8 -12 -22 -6 Z" />
      </svg>
    </div>
  );
}

/** A green tree python draped over a branch: a slow breathing ripple, and a quick tongue flick. */
function Python() {
  return (
    <div className={styles.python} data-prop="hero" data-secondary>
      <svg viewBox="0 0 180 92" aria-hidden="true">
        <path className={styles.branch} d="M0 70 C60 62 120 54 180 40 L180 52 C120 64 60 72 0 80 Z" />
        <path className={styles.branchShade} d="M0 76 C60 68 120 60 180 47 L180 52 C120 64 60 72 0 80 Z" />
        <path className={`${styles.coil} ${styles.breathA}`} d="M14 88 C10 70 22 56 34 62 C46 68 44 88 58 86" />
        <path className={`${styles.coil} ${styles.breathB}`} d="M58 86 C72 84 70 56 84 54 C98 52 98 78 112 76" />
        <path className={`${styles.coil} ${styles.breathC}`} d="M112 76 C126 74 124 46 140 44 C150 42 156 40 162 38" />
        <path className={styles.spots} d="M30 60 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 Z M82 55 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 Z M136 45 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 Z M106 74 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0 Z" />
        <g className={styles.tongue}>
          <path className={styles.tongueLine} d="M175 38 L182 37 L186 34 M182 37 L186 40" />
        </g>
        <ellipse className={styles.leafLight} cx={168} cy={37} rx={9} ry={6} transform="rotate(-10 168 37)" />
        <circle className={styles.dark} cx={171} cy={35} r={1.4} />
        <path className={styles.leaf} d="M0 58 q20 -20 40 -8 q-20 10 -40 8 Z" />
        <path className={styles.leafLight} d="M2 72 q24 -6 34 8 q-20 2 -34 -8 Z" />
      </svg>
    </div>
  );
}
