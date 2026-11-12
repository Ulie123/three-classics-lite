import { SceneFrame, type SceneProps } from '../scene/SceneFrame';
import type { ParticleFactory } from '../scene/ParticleCanvas';
import { Lake } from './Lake';
import { pineRow } from './pine';
import { WinterProps } from './WinterProps';
import styles from './WinterScene.module.css';
import './palette.css';

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  sway: number;
  phase: number;
}

// Far flakes are tiny and slow; near flakes are larger, faster and slightly soft.
const LAYERS = [
  { share: 0.45, size: [0.7, 1.4], speed: [10, 18], alpha: 0.45, wind: 0.4, soft: false },
  { share: 0.35, size: [1.4, 2.4], speed: [20, 34], alpha: 0.65, wind: 0.7, soft: false },
  { share: 0.2, size: [2.4, 3.8], speed: [36, 56], alpha: 0.8, wind: 1, soft: true },
] as const;

/** About 120–200 flakes in three depth layers, drifting on a slowly changing wind. */
const snow: ParticleFactory = (width, height, scale) => {
  const total = Math.round(Math.max(40, Math.min(200, 170 * scale)));
  const rand = (range: readonly [number, number]) => range[0] + Math.random() * (range[1] - range[0]);
  const layers = LAYERS.map((layer) => ({
    layer,
    flakes: Array.from({ length: Math.round(total * layer.share) }, (): Flake => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: rand(layer.size),
      speed: rand(layer.speed),
      sway: 0.4 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
    })),
  }));

  return {
    update(dt, now) {
      const wind = 14 * Math.sin(now / 9000) + 8 * Math.sin(now / 23000 + 1);
      for (const { layer, flakes } of layers) {
        for (const f of flakes) {
          f.y += f.speed * dt;
          f.x += (wind * layer.wind + Math.sin(now / 1000 * f.sway + f.phase) * 10) * dt;
          if (f.y > height + 6) {
            f.y = -6;
            f.x = Math.random() * width;
          }
          if (f.x > width + 6) f.x = -6;
          else if (f.x < -6) f.x = width + 6;
        }
      }
    },
    draw(ctx) {
      for (const { layer, flakes } of layers) {
        ctx.fillStyle = `rgba(251, 253, 255, ${layer.alpha})`;
        for (const f of flakes) {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (layer.soft) {
          ctx.fillStyle = `rgba(251, 253, 255, ${layer.alpha * 0.18})`;
          for (const f of flakes) {
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  };
};

const FAR_PINES = pineRow(745, 26, 70, 3);
const NEAR_PINES = pineRow(905, 14, 190, 7);

export function WinterScene(props: SceneProps) {
  return (
    <SceneFrame name="winter" particles={snow} props={<WinterProps />} {...props}>
      <div className={styles.sky} />
      <div className={styles.aurora} />
      <svg className={styles.land} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path
          className={styles.ridgeFar}
          d="M0 640 L120 560 L210 600 L330 480 L420 540 L520 470 L640 560 L760 500 L880 580 L1000 470 L1110 540 L1230 450 L1350 540 L1470 500 L1600 560 V1000 H0 Z"
        />
        <path
          className={styles.capFar}
          d="M330 480 L370 505 L350 507 L330 495 L305 512 L290 506 Z M1000 470 L1040 497 L1020 498 L1000 488 L978 502 L962 498 Z M1230 450 L1270 480 L1248 480 L1230 468 L1210 484 L1192 480 Z"
        />
        <path
          className={styles.ridgeMid}
          d="M0 720 L140 640 L260 690 L400 610 L520 680 L680 620 L820 700 L960 640 L1100 700 L1240 630 L1400 690 L1600 640 V1000 H0 Z"
        />
        <path className={styles.pinesFar} d={FAR_PINES.tree} />
        <path className={styles.snowFar} d={FAR_PINES.snow} />
        <path className={styles.snowFarShade} d={FAR_PINES.shade} />
        <path className={styles.ground} d="M0 820 C 300 790 520 830 800 812 C 1080 795 1300 830 1600 805 V1000 H0 Z" />
        <path className={styles.pinesNear} d={NEAR_PINES.tree} />
        <path className={styles.snowNear} d={NEAR_PINES.snow} />
        <path className={styles.snowNearShade} d={NEAR_PINES.shade} />
        <path className={styles.drift} d="M0 900 C 260 870 520 905 820 885 C 1100 868 1360 900 1600 880 V1000 H0 Z" />
      </svg>
      <Lake />
    </SceneFrame>
  );
}
