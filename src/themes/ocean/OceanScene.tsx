import type { CSSProperties } from 'react';
import { SceneFrame, type SceneProps } from '../scene/SceneFrame';
import type { ParticleFactory } from '../scene/ParticleCanvas';
import { OceanProps } from './OceanProps';
import styles from './OceanScene.module.css';
import './palette.css';

// Soft god rays from the surface: left edge (%), width (px), tilt (deg), sway period (s).
const RAYS = [
  { left: 12, width: 110, tilt: 14, period: 17 },
  { left: 27, width: 70, tilt: 10, period: 13 },
  { left: 44, width: 140, tilt: 6, period: 19 },
  { left: 63, width: 90, tilt: 2, period: 15 },
  { left: 80, width: 120, tilt: -4, period: 20 },
];

// Kelp strands at the bottom edges: left edge (%), height (cqh), sway period (s), delay (s).
const KELP = [
  { left: 3, height: 34, period: 8, delay: 0 },
  { left: 7, height: 24, period: 7, delay: -2.5 },
  { left: 90, height: 30, period: 9, delay: -1 },
  { left: 94.5, height: 20, period: 7.5, delay: -4 },
];

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  wobble: number;
  phase: number;
  alpha: number;
}

/** 15–30 small bubbles rising with a slight wobble. */
const bubbles: ParticleFactory = (width, height, scale) => {
  const count = Math.max(8, Math.min(30, Math.round(26 * scale)));
  const spawn = (y: number): Bubble => ({
    x: Math.random() * width,
    y,
    r: 1.5 + Math.random() * 3.5,
    speed: 14 + Math.random() * 26,
    wobble: 0.6 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.25 + Math.random() * 0.3,
  });
  const list = Array.from({ length: count }, () => spawn(Math.random() * height));

  return {
    update(dt, now) {
      for (const b of list) {
        b.y -= b.speed * dt;
        b.x += Math.sin(now / 1000 * b.wobble + b.phase) * 8 * dt;
        if (b.y < -10) Object.assign(b, spawn(height + 10));
      }
    },
    draw(ctx) {
      for (const b of list) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(222, 247, 251, ${b.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
        ctx.fill();
      }
    },
  };
};

export function OceanScene(props: SceneProps) {
  return (
    <SceneFrame name="ocean" particles={bubbles} props={<OceanProps />} {...props}>
      <div className={styles.depth} />
      <div className={styles.rays}>
        {RAYS.map((ray, i) => (
          <span
            key={i}
            className={styles.ray}
            style={
              {
                left: `${ray.left}%`,
                width: ray.width,
                '--tilt': `${ray.tilt}deg`,
                animationDuration: `${ray.period}s`,
                animationDelay: `${-i * 3}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className={styles.shimmer} />
      <div className={styles.manta}>
        <svg viewBox="0 0 200 90" aria-hidden="true">
          <path d="M100 18 C 82 20 58 34 8 52 C 48 52 72 56 92 64 L 96 88 L 100 66 L 104 88 L 108 64 C 128 56 152 52 192 52 C 142 34 118 20 100 18 Z" />
        </svg>
      </div>
      <svg className={styles.reefs} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path
          className={styles.reefFar}
          d="M0 1000 V 820 C 60 790 110 800 160 770 C 210 740 260 760 300 800 C 340 830 380 850 430 880 C 470 905 520 930 560 1000 Z
             M1600 1000 V 800 C 1540 780 1500 790 1450 760 C 1400 735 1350 760 1310 800 C 1270 840 1230 860 1180 900 C 1150 930 1120 960 1100 1000 Z"
        />
        {/* The sandy seabed, with a lighter lip, a few shells and a starfish. */}
        <path
          className={styles.sand}
          d="M0 1000 V 946 C 120 932 260 950 400 942 C 560 933 700 954 860 946 C 1020 938 1160 956 1320 944 C 1440 936 1540 948 1600 942 V 1000 Z"
        />
        <path
          className={styles.sandLip}
          d="M0 946 C 120 932 260 950 400 942 C 560 933 700 954 860 946 C 1020 938 1160 956 1320 944 C 1440 936 1540 948 1600 942 V 950 C 1540 956 1440 944 1320 952 C 1160 964 1020 946 860 954 C 700 962 560 941 400 950 C 260 958 120 940 0 954 Z"
        />
        <path className={styles.shell} d="M150 978 a9 9 0 0 1 18 0 Z M1176 972 a8 8 0 0 1 16 0 Z M1208 984 a6 6 0 0 1 12 0 Z" />
        <path className={styles.shellLight} d="M153 978 a6 6 0 0 1 12 0 Z M1179 972 a5 5 0 0 1 10 0 Z" />
        <path
          className={styles.starfish}
          d="M200 958 L204 968 L215 968 L206 975 L210 986 L200 979 L190 986 L194 975 L185 968 L196 968 Z"
        />
        <path
          className={styles.reefNear}
          d="M232 1000 C 238 962 262 934 300 928 C 340 922 378 946 398 972 C 408 986 412 994 414 1000 Z
             M1600 1000 V 870 C 1560 850 1520 860 1480 840 C 1440 825 1400 845 1370 880 C 1340 915 1300 930 1270 960 C 1255 975 1245 990 1240 1000 Z"
        />
      </svg>
      {KELP.map((kelp, i) => (
        <div
          key={i}
          className={styles.kelp}
          style={{
            left: `${kelp.left}%`,
            height: `${kelp.height}cqh`,
            animationDuration: `${kelp.period}s`,
            animationDelay: `${kelp.delay}s`,
          }}
        >
          <svg viewBox="0 0 40 300" preserveAspectRatio="none" aria-hidden="true">
            <path d="M20 300 C 8 250 30 210 16 160 C 4 115 28 80 18 30 C 16 18 20 6 22 0 C 30 30 34 70 26 110 C 18 150 36 190 28 240 C 26 260 26 280 26 300 Z" />
          </svg>
        </div>
      ))}
    </SceneFrame>
  );
}
