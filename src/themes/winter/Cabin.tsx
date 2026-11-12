import styles from './Cabin.module.css';

// Log courses from the eaves down: alternate tones read as stacked logs without any outlines.
const LOGS = [50, 60, 70, 80];

/** A small log cabin in the gap beside the board: a warm window that flickers a little and a smoke curl. */
export function Cabin() {
  return (
    <div className={styles.cabin} data-secondary>
      <svg viewBox="0 0 120 100" aria-hidden="true">
        <g className={styles.smoke}>
          <circle className={`${styles.puff} ${styles.puffA}`} cx={85} cy={16} r={4} />
          <circle className={`${styles.puff} ${styles.puffB}`} cx={85} cy={16} r={4} />
          <circle className={`${styles.puff} ${styles.puffC}`} cx={85} cy={16} r={4} />
        </g>
        <rect className={styles.stone} x={80} y={20} width={10} height={24} />
        <rect className={styles.snow} x={78} y={18} width={14} height={5} rx={2.5} />
        {LOGS.map((y, i) => (
          <rect key={y} className={i % 2 ? styles.logDark : styles.log} x={18} y={y} width={84} height={10} />
        ))}
        <path className={styles.roof} d="M10 54 L60 24 L110 54 Z" />
        <path
          className={styles.snow}
          d="M5 55 Q 7 47 14 47 L60 19 L106 47 Q 113 47 115 55 Q 100 59 86 56 Q 72 60 60 57 Q 46 60 32 56 Q 18 59 5 55 Z"
        />
        <path className={styles.snowShade} d="M60 19 L106 47 Q 113 47 115 55 Q 100 59 86 56 Q 72 60 60 57 Z" />
        <rect className={styles.window} x={29} y={63} width={18} height={14} rx={2} />
        <rect className={styles.logDark} x={37.2} y={63} width={1.6} height={14} />
        <rect className={styles.logDark} x={29} y={69.2} width={18} height={1.6} />
        <rect className={styles.door} x={64} y={64} width={15} height={28} rx={2} />
        <path className={styles.snow} d="M-6 100 L-6 90 C 20 84 44 88 60 88 C 80 88 104 84 126 90 L126 100 Z" />
      </svg>
    </div>
  );
}
