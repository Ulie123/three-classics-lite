import { useId, type CSSProperties } from 'react';
import { SceneFrame, type SceneProps } from '../scene/SceneFrame';
import type { ParticleFactory } from '../scene/ParticleCanvas';
import { JungleProps } from './JungleProps';
import { Waterfall } from './Waterfall';
import styles from './JungleScene.module.css';
import './palette.css';

interface Leaf {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  spin: number;
  phase: number;
}

/** A rare falling leaf: one every 6–10 s, never more than three at once. */
const leaves: ParticleFactory = (width, height) => {
  const falling: Leaf[] = [];
  let next = 2000 + Math.random() * 4000;
  return {
    update(dt, now) {
      if (now > next && falling.length < 3) {
        falling.push({
          x: width * (0.15 + Math.random() * 0.7),
          y: -20,
          size: 7 + Math.random() * 5,
          speed: 28 + Math.random() * 18,
          angle: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 1.6,
          phase: Math.random() * Math.PI * 2,
        });
        next = now + 6000 + Math.random() * 4000;
      }
      for (const leaf of falling) {
        leaf.y += leaf.speed * dt;
        leaf.x += Math.sin(now / 1100 + leaf.phase) * 22 * dt;
        leaf.angle += leaf.spin * dt;
      }
      for (let i = falling.length - 1; i >= 0; i--) {
        if (falling[i].y > height + 20) falling.splice(i, 1);
      }
    },
    draw(ctx) {
      for (const leaf of falling) {
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.angle);
        ctx.fillStyle = 'rgba(111, 174, 69, 0.9)';
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size, leaf.size * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(47, 125, 62, 0.9)';
        ctx.beginPath();
        ctx.ellipse(0, leaf.size * 0.12, leaf.size, leaf.size * 0.2, 0, 0, Math.PI);
        ctx.fill();
        ctx.restore();
      }
    },
  };
};

/** A repeatable pseudo-random number in [0, 1) so the forest is the same on every load. */
const noise = (i: number, seed: number) => {
  const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Round leaf masses along a band: centres spaced across the width, jittered up and down. */
function blobs(seed: number, spacing: number, y: number, ySpread: number, r: number, rSpread: number) {
  const out: { cx: number; cy: number; r: number }[] = [];
  for (let i = 0, x = -spacing / 2; x < 1600 + spacing; i++, x += spacing) {
    const cx = x + (noise(i, seed) - 0.5) * spacing * 0.6;
    out.push({ cx, cy: y + (noise(i, seed + 1) - 0.5) * ySpread, r: r + noise(i, seed + 2) * rSpread });
  }
  return out;
}

const circlePath = (list: { cx: number; cy: number; r: number }[]) =>
  list.map(({ cx, cy, r }) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`).join(' ');

// The canopy: lighter hanging clusters behind, the darkest mass in front along the top.
const CANOPY_LOW = blobs(11, 104, 226, 50, 16, 26);
const CANOPY_MID = blobs(12, 82, 174, 44, 24, 34);
const CANOPY_TOP = blobs(13, 64, 118, 40, 34, 40);
const CANOPY_SUNLIT = [...CANOPY_LOW, ...CANOPY_MID]
  .filter((_, i) => i % 2 === 0)
  .map(({ cx, cy, r }) => ({ cx: cx - r * 0.3, cy: cy - r * 0.3, r: r * 0.42 }));

/** Pointed leaf tips hanging from a row of leaf masses, so the edge isn't all round scallops. */
const leafTips = (list: { cx: number; cy: number; r: number }[], every: number, length: number) =>
  list
    .filter((_, i) => i % every === 1)
    .map(({ cx, cy, r }) => `M${cx - 9} ${cy + r - 8} Q${cx + 2} ${cy + r + length} ${cx + 9} ${cy + r - 8} Z`)
    .join(' ');

const TOP_TIPS = leafTips(CANOPY_TOP, 2, 30);
const MID_TIPS = leafTips(CANOPY_MID, 2, 26);
const LOW_TIPS = leafTips(CANOPY_LOW, 3, 24);

// A few small bright gaps where the sun gets through, kept away from the title in the middle.
const CANOPY_GAPS = [
  { cx: 150, cy: 64 },
  { cx: 380, cy: 46 },
  { cx: 1240, cy: 58 },
  { cx: 1460, cy: 76 },
];
const gapCluster = (cx: number, cy: number) =>
  circlePath([
    { cx: cx - 9, cy: cy + 2, r: 8 },
    { cx: cx + 5, cy: cy - 3, r: 10 },
    { cx: cx + 14, cy: cy + 6, r: 6 },
  ]);

/** Tall, slightly tapering trunks across the width, for the misty far forest. */
function trunks(seed: number, count: number, width: number, top: number, bottom: number) {
  return Array.from({ length: count }, (_, i) => {
    const x = (i + 0.5) * (1600 / count) + (noise(i, seed) - 0.5) * (1600 / count) * 0.7;
    const w = width * (0.7 + noise(i, seed + 3) * 0.6);
    const t = top + noise(i, seed + 4) * 60;
    return `M${x - w * 0.42} ${t} L${x + w * 0.42} ${t} L${x + w * 0.5} ${bottom} L${x - w * 0.5} ${bottom} Z`;
  }).join(' ');
}

const FAR_TRUNKS = trunks(21, 18, 13, 180, 820);
const FAR_PUFFS = circlePath(blobs(22, 95, 300, 60, 46, 30));
const MID_FAR_TRUNKS = trunks(23, 9, 28, 240, 840);
const MID_FAR_PUFFS = circlePath(blobs(24, 140, 360, 70, 52, 34));
const FAR_BUSHES = circlePath(blobs(25, 70, 790, 30, 44, 24));
const NEAR_BUSHES = circlePath(blobs(26, 90, 880, 40, 60, 30));

/** A big rainforest trunk with flared buttress roots, centred on x, two-tone with moss patches. */
function bigTrunk(x: number, w: number) {
  const half = w / 2;
  const shade = `M${x - half} -20 L${x + half} -20 L${x + half * 1.05} 820 C ${x + half * 1.6} 900 ${x + half * 2.6} 950 ${x + half * 3.2} 1000 L${x - half * 3.2} 1000 C ${x - half * 2.6} 950 ${x - half * 1.6} 900 ${x - half * 1.05} 820 Z`;
  const light = `M${x - half} -20 L${x + half * 0.1} -20 L${x + half * 0.1} 1000 L${x - half * 3.2} 1000 C ${x - half * 2.6} 950 ${x - half * 1.6} 900 ${x - half * 1.05} 820 Z`;
  // Buttress fins catching the light.
  const fins = `M${x - half * 0.6} 860 C ${x - half * 0.9} 930 ${x - half * 1.8} 980 ${x - half * 2.4} 1000 L${x - half * 1.4} 1000 C ${x - half * 1.1} 960 ${x - half * 0.7} 920 ${x - half * 0.6} 860 Z M${x + half * 0.5} 860 C ${x + half * 0.8} 930 ${x + half * 1.6} 980 ${x + half * 2.2} 1000 L${x + half * 1.3} 1000 C ${x + half} 960 ${x + half * 0.6} 920 ${x + half * 0.5} 860 Z`;
  // Small moss clusters on the lit side of the bark.
  const moss = [0.3, 0.58, 0.82]
    .map((t, i) => {
      const y = 120 + t * 680;
      const cx = x - half * 0.55 + (i % 2) * half * 0.3;
      const r = half * 0.22;
      return circlePath([
        { cx, cy: y, r },
        { cx: cx + r * 1.2, cy: y + r * 0.5, r: r * 0.8 },
        { cx: cx - r * 0.6, cy: y + r * 1.1, r: r * 0.7 },
      ]);
    })
    .join(' ');
  return { shade, light, fins, moss };
}

const TRUNKS = [bigTrunk(40, 74), bigTrunk(232, 46), bigTrunk(1378, 54), bigTrunk(1566, 82)];

/** A fern frond pointing up from (0, 0): leaflets on the sunny side light, the other side shaded. */
function fernFrond(length: number, curl: number, leaflets: number) {
  let light = '';
  let shade = `M-2 0 Q ${curl * 0.4} ${-length * 0.55} ${curl} ${-length} Q ${curl * 0.4 + 4} ${-length * 0.55} 2 0 Z`;
  for (let i = 1; i <= leaflets; i++) {
    const t = i / (leaflets + 1);
    const x = curl * t * t;
    const y = -length * t;
    const size = 64 * Math.sin(Math.PI * (0.15 + t * 0.85)) + 10;
    light += ` M${x} ${y} q ${-size * 0.55} ${-size * 0.05} ${-size} ${size * 0.38} q ${size * 0.5} ${-size * 0.06} ${size} ${-size * 0.34} Z`;
    shade += ` M${x} ${y} q ${size * 0.55} ${size * 0.02} ${size} ${size * 0.42} q ${-size * 0.5} ${-size * 0.12} ${-size} ${-size * 0.38} Z`;
  }
  return { light, shade };
}

/** A fan palm: wedge leaflets radiating from the top of a stalk, alternating light and shade. */
function fanPalm() {
  let light = 'M-4 0 L-3 -190 L3 -190 L4 0 Z';
  let shade = '';
  const cx = 0;
  const cy = -190;
  for (let i = 0; i < 11; i++) {
    const a = (-160 + i * 14) * (Math.PI / 180);
    const b = a + 11 * (Math.PI / 180);
    const r = 190 - Math.abs(i - 5) * 10;
    const wedge = `M${cx} ${cy} L${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r} L${cx + Math.cos(b) * r} ${cy + Math.sin(b) * r} Z`;
    if (i % 2 === 0) light += ` ${wedge}`;
    else shade += ` ${wedge}`;
  }
  return { light, shade };
}

/** A heliconia: a green stem with zig-zag bracts, red with a lime edge, kept tiny in the scene. */
function heliconia() {
  const stem = 'M-3 0 L-2 -330 L2 -330 L3 0 Z M0 -140 Q 60 -170 90 -250 Q 40 -200 0 -170 Z';
  let bracts = '';
  let tips = '';
  for (let i = 0; i < 6; i++) {
    const y = -320 + i * 26;
    const dir = i % 2 === 0 ? 1 : -1;
    bracts += ` M0 ${y} L${dir * 34} ${y - 10} L${dir * 10} ${y + 16} Z`;
    tips += ` M${dir * 34} ${y - 10} L${dir * 26} ${y - 9} L${dir * 30} ${y - 4} Z`;
  }
  return { stem, bracts, tips };
}

const MONSTERA =
  'M-5 0 L-3 -120 L3 -120 L5 0 Z ' +
  'M0 -110 C -30 -130 -170 -160 -185 -260 C -200 -350 -110 -415 0 -418 C 110 -415 200 -350 185 -260 C 170 -160 30 -130 0 -110 Z ' +
  'M-188 -250 L -70 -235 L -186 -275 Z M-172 -330 L -60 -292 L -150 -356 Z M-120 -190 L -40 -200 L -132 -210 Z ' +
  'M188 -250 L 70 -235 L 186 -275 Z M172 -330 L 60 -292 L 150 -356 Z M120 -190 L 40 -200 L 132 -210 Z';

type PlantKind = 'fern' | 'monstera' | 'fan' | 'heliconia';

// Foreground plants framing the edges. Each sways from its base: left/bottom in %, size in cqh.
const PLANTS: { kind: PlantKind; left: number; bottom: number; size: number; rotate: number; period: number; delay: number; flip?: boolean }[] = [
  { kind: 'fan', left: 4, bottom: -6, size: 46, rotate: 8, period: 9.1, delay: -2 },
  { kind: 'fern', left: 1, bottom: -10, size: 44, rotate: 34, period: 7.3, delay: -1.5 },
  { kind: 'heliconia', left: 9.5, bottom: -8, size: 30, rotate: -6, period: 8.3, delay: -3 },
  { kind: 'fern', left: 13, bottom: -12, size: 34, rotate: -28, period: 6.7, delay: -4, flip: true },
  { kind: 'monstera', left: 85, bottom: -12, size: 30, rotate: -10, period: 10.1, delay: -2.5 },
  { kind: 'fern', left: 97, bottom: -10, size: 46, rotate: -36, period: 7.9, delay: -1, flip: true },
];

// Lianas hanging from the canopy; each sways gently from the top. left in %, length in cqh.
const LIANAS = [
  { left: 9, length: 44, period: 9.3, delay: -1 },
  { left: 16.5, length: 30, period: 11.1, delay: -4 },
  { left: 84, length: 36, period: 10.3, delay: -2 },
];

function Plant({ kind, flip }: { kind: PlantKind; flip?: boolean }) {
  const clip = `jg-half-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const transform = flip ? 'scale(-1 1)' : undefined;
  if (kind === 'fern') {
    const frond = fernFrond(400, 110, 13);
    return (
      <g transform={transform}>
        <path className={styles.shade} d={frond.shade} />
        <path className={styles.light} d={frond.light} />
      </g>
    );
  }
  if (kind === 'fan') {
    const palm = fanPalm();
    return (
      <g transform={transform}>
        <path className={styles.light} d={palm.light} />
        <path className={styles.shade} d={palm.shade} />
      </g>
    );
  }
  if (kind === 'heliconia') {
    const plant = heliconia();
    return (
      <g transform={transform}>
        <path className={styles.shade} d={plant.stem} />
        <path className={styles.bract} d={plant.bracts} />
        <path className={styles.bractTip} d={plant.tips} />
      </g>
    );
  }
  return (
    <g transform={transform}>
      <defs>
        <clipPath id={clip}>
          <rect x={0} y={-420} width={200} height={420} />
        </clipPath>
      </defs>
      <path className={styles.light} fillRule="evenodd" d={MONSTERA} />
      <path className={styles.shade} fillRule="evenodd" d={MONSTERA} clipPath={`url(#${clip})`} />
    </g>
  );
}

export function JungleScene(props: SceneProps) {
  return (
    <SceneFrame name="jungle" particles={leaves} props={<JungleProps />} {...props}>
      <div className={styles.sky} />
      <svg className={styles.full} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path className={styles.farPuffs} d={FAR_PUFFS} />
        <path className={styles.farTrunks} d={FAR_TRUNKS} />
        <path className={styles.midFarPuffs} d={MID_FAR_PUFFS} />
        <path className={styles.midFarTrunks} d={MID_FAR_TRUNKS} />
        <path className={styles.farBushes} d={FAR_BUSHES} />
      </svg>
      <div className={styles.shafts}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.shaft} style={{ left: `${18 + i * 22}%`, animationDuration: `${8 + i * 2}s`, animationDelay: `${-i * 3}s` }} />
        ))}
      </div>
      <div className={styles.mist} style={{ top: '50%', animationDuration: '72s' }} />
      <div className={styles.mist} style={{ top: '64%', animationDuration: '88s', animationDelay: '-30s' }} />
      <svg className={styles.full} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path className={styles.nearBushes} d={NEAR_BUSHES} />
        {TRUNKS.map((trunk, i) => (
          <g key={i}>
            <path className={styles.trunkShade} d={trunk.shade} />
            <path className={styles.trunkLight} d={trunk.light} />
            <path className={styles.trunkLight} d={trunk.fins} />
            <path className={styles.moss} d={trunk.moss} />
          </g>
        ))}
      </svg>
      <Waterfall />
      {LIANAS.map((liana, i) => (
        <div
          key={i}
          className={styles.liana}
          style={{ left: `${liana.left}%`, height: `${liana.length}cqh`, animationDuration: `${liana.period}s`, animationDelay: `${liana.delay}s` }}
        >
          <svg viewBox="0 0 40 400" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
            <path className={styles.vine} d="M18 0 C 30 80 6 160 20 240 C 30 300 14 350 20 400 L24 400 C 18 350 34 300 24 240 C 10 160 34 80 22 0 Z" />
            <path className={styles.light} d="M22 90 q 18 -4 22 10 q -14 2 -22 -10 Z M20 200 q -18 -6 -22 8 q 14 4 22 -8 Z M23 320 q 16 -2 18 12 q -12 0 -18 -12 Z" />
          </svg>
        </div>
      ))}
      <svg className={styles.canopy} viewBox="0 0 1600 320" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
        <path className={styles.canopyLow} d={`${circlePath(CANOPY_LOW)} ${LOW_TIPS}`} />
        <path className={styles.sunlit} d={circlePath(CANOPY_SUNLIT)} />
        <path className={styles.canopyMid} d={`${circlePath(CANOPY_MID)} ${MID_TIPS}`} />
        <rect className={styles.canopyTop} x={0} y={0} width={1600} height={110} />
        <path className={styles.canopyTop} d={`${circlePath(CANOPY_TOP)} ${TOP_TIPS}`} />
        <path className={styles.gapEdge} d={CANOPY_GAPS.map((gap) => gapCluster(gap.cx, gap.cy)).join(' ')} />
        <path className={styles.gap} d={circlePath(CANOPY_GAPS.map((gap) => ({ cx: gap.cx + 4, cy: gap.cy - 2, r: 3.5 })))} />
      </svg>
      {PLANTS.map((plant, i) => (
        <div
          key={i}
          className={styles.plant}
          style={
            {
              left: `${plant.left}%`,
              bottom: `${plant.bottom}%`,
              height: `${plant.size}cqh`,
              '--rest': `${plant.rotate}deg`,
              animationDuration: `${plant.period}s`,
              animationDelay: `${plant.delay}s`,
            } as CSSProperties
          }
        >
          <svg viewBox="-200 -420 400 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Plant kind={plant.kind} flip={plant.flip} />
          </svg>
        </div>
      ))}
    </SceneFrame>
  );
}
