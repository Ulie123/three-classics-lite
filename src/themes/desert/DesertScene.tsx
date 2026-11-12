import { SceneFrame, type SceneProps } from '../scene/SceneFrame';
import type { ParticleFactory } from '../scene/ParticleCanvas';
import { DesertProps, TUMBLE_LOOP_MS, TUMBLE_START_MS } from './DesertProps';
import styles from './DesertScene.module.css';
import './palette.css';

interface Grain {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

/**
 * Fine sand grains blowing sideways, sparse, with an occasional two-second gust. One gust always comes
 * with the tumbleweed: the field reads the tumbleweed's CSS animation clock rather than running its own.
 */
const sand: ParticleFactory = (width, height, scale, canvas) => {
  const count = Math.max(20, Math.min(90, Math.round(70 * scale)));
  const spawn = (x: number): Grain => ({
    x,
    y: height * (0.45 + Math.random() * 0.55),
    length: 2 + Math.random() * 6,
    speed: 30 + Math.random() * 50,
    alpha: 0.18 + Math.random() * 0.3,
  });
  const grains = Array.from({ length: count }, () => spawn(Math.random() * width));
  let gustStart = -Infinity;
  let nextGust = 4000 + Math.random() * 6000;
  const tumbleweed = canvas.closest('[data-scene]')?.querySelector('[data-tumbleweed]');
  let lastTumble = -1;

  /** Where the tumbleweed is in its loop (ms), or -1 when it is hidden or not running. */
  function tumbleTime() {
    const clock = tumbleweed?.getAnimations()[0]?.currentTime;
    return typeof clock === 'number' ? clock % TUMBLE_LOOP_MS : -1;
  }

  return {
    update(dt, now) {
      const tumble = tumbleTime();
      const tumbleSetsOff = lastTumble >= 0 && lastTumble < TUMBLE_START_MS && tumble >= TUMBLE_START_MS;
      lastTumble = tumble;
      if (tumbleSetsOff || now > nextGust) {
        gustStart = now;
        nextGust = now + 8000 + Math.random() * 9000;
      }
      // A gust rises and falls over two seconds.
      const t = (now - gustStart) / 2000;
      const gust = t >= 0 && t <= 1 ? Math.sin(Math.PI * t) * 3.5 : 0;
      for (const g of grains) {
        g.x += g.speed * (1 + gust) * dt;
        g.y += Math.sin(now / 900 + g.x / 80) * 4 * dt;
        if (g.x > width + 10) Object.assign(g, spawn(-10));
      }
    },
    draw(ctx) {
      ctx.lineCap = 'round';
      for (const g of grains) {
        ctx.strokeStyle = `rgba(250, 228, 196, ${g.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x - g.length, g.y);
        ctx.stroke();
      }
    },
  };
};

export function DesertScene(props: SceneProps) {
  return (
    <SceneFrame name="desert" particles={sand} props={<DesertProps />} {...props}>
      <div className={styles.sky} />
      <div className={styles.sun} />
      <svg className={styles.dunes} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {/* A distant mesa and butte, hazy, standing just above the far dunes. */}
        <path className={styles.mesa} d="M1060 612 L1100 512 L1124 500 L1300 496 L1322 508 L1370 612 Z M1384 612 L1404 560 L1444 556 L1466 612 Z" />
        <path className={styles.mesaShade} d="M1300 496 L1322 508 L1370 612 L1316 612 Z M1444 556 L1466 612 L1450 612 Z" />
        <path
          className={styles.far}
          d="M0 640 C 180 600 320 560 520 590 C 700 615 820 560 1000 548 C 1180 536 1300 590 1440 600 C 1520 606 1570 596 1600 590 V1000 H0 Z"
        />
        {/* Two small, hazy saguaros on the far dunes. */}
        <path className={styles.farSaguaro} d="M1190 646 V 586 M1190 622 H 1177 V 600 M1190 612 H 1202 V 592" strokeWidth={9} />
        <path className={styles.farSaguaro} d="M1262 634 V 590 M1262 616 H 1253 V 600 M1262 608 H 1271 V 594" strokeWidth={7} />
        <path
          className={styles.mid}
          d="M0 720 C 220 660 400 640 600 690 C 760 730 900 700 1080 650 C 1240 606 1420 640 1600 690 V1000 H0 Z"
        />
        <path
          className={styles.ridge}
          d="M600 690 C 760 730 900 700 1080 650 L 1080 652 C 900 708 760 742 600 700 Z"
        />
        <path
          className={styles.near}
          d="M0 830 C 260 760 480 770 720 830 C 920 880 1140 860 1340 800 C 1460 766 1540 770 1600 784 V1000 H0 Z"
        />
      </svg>
      <div className={styles.haze} />
    </SceneFrame>
  );
}
