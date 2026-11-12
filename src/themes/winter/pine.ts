/** Flat SVG paths for one pine: the tree, the snow caps, and the blue shadow on each cap's far side. */
export interface PinePaths {
  tree: string;
  snow: string;
  shade: string;
}

const r = (n: number) => Math.round(n * 10) / 10;

/**
 * A pine of `tiers` stacked tiers whose base is centred on (x, y), `h` tall and `w` wide at the bottom.
 * Each tier carries a snow cap with a soft scalloped edge; `depth` is how far down the tier the snow
 * reaches (0.5 for a dusting, 0.65 for heavily laden). Light comes from the left, so the right half of
 * every cap is in blue shadow.
 */
export function pine(x: number, y: number, h: number, w: number, tiers = 3, depth = 0.5): PinePaths {
  const th = (1.27 * h) / tiers;
  const tree: string[] = [];
  const snow: string[] = [];
  const shade: string[] = [];
  for (let i = 0; i < tiers; i++) {
    const t = tiers === 1 ? 1 : i / (tiers - 1);
    const top = y - h + (i * (h - th)) / Math.max(1, tiers - 1);
    const bottom = top + th;
    const topW = w * 0.1 * t;
    const halfW = w * (0.24 + 0.26 * t);
    tree.push(
      `M${r(x - topW)} ${r(top)} L${r(x + topW)} ${r(top)} L${r(x + halfW)} ${r(bottom)} Q${r(x)} ${r(bottom + h * 0.035)} ${r(x - halfW)} ${r(bottom)} Z`,
    );

    const capY = top + th * depth;
    const capW = (topW + (halfW - topW) * depth) * 1.08;
    const d = th * 0.12;
    const edge = `L${r(x + capW)} ${r(capY)} Q${r(x + capW * 0.55)} ${r(capY + d * 1.6)} ${r(x + capW * 0.1)} ${r(capY + d * 0.2)}`;
    snow.push(
      `M${r(x - topW * 1.1)} ${r(top - 1)} L${r(x + topW * 1.1)} ${r(top - 1)} ${edge} Q${r(x - capW * 0.4)} ${r(capY + d * 1.8)} ${r(x - capW)} ${r(capY)} Z`,
    );
    shade.push(`M${r(x)} ${r(top - 1)} L${r(x + topW * 1.1)} ${r(top - 1)} ${edge} Z`);
  }
  return { tree: tree.join(' '), snow: snow.join(' '), shade: shade.join(' ') };
}

/** A row of snow-capped pines along a baseline, spread across a 1600-wide drawing. */
export function pineRow(baseline: number, count: number, height: number, seed: number): PinePaths {
  const rows: PinePaths[] = [];
  for (let i = 0; i < count; i++) {
    const jitter = Math.sin(seed + i * 12.9898) * 0.5 + 0.5;
    const x = (i + 0.2 + jitter * 0.6) * (1600 / count);
    const h = height * (0.7 + jitter * 0.5);
    rows.push(pine(x, baseline + jitter * 10, h, h * 0.42));
  }
  return {
    tree: rows.map((p) => p.tree).join(' '),
    snow: rows.map((p) => p.snow).join(' '),
    shade: rows.map((p) => p.shade).join(' '),
  };
}
