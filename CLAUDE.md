# Three Classics Lite

Connect Four, Checkers and Backgammon against the computer, as a static site on GitHub Pages. It's a
port of Three Classics (github.com/Ulie123/three-classics) with no server.

## Stack
React 19 + TypeScript + Vite 6, CSS Modules, lucide-react. No backend: `src/engine` holds the rules and
computer players ported from Java, and `src/local` the in-browser referee (localStorage, AI in a Web Worker).

## Commands
- `npm run dev` (port 5174), `npm test` (Vitest), `npm run e2e` (Playwright, starts the dev server)
- `npm run build` builds for `/three-classics-lite/`; set `BASE_PATH` for another repo name

## Rules of the codebase
- The referee is the only thing that decides legality. Components render state and pick from `legalMoves`.
- Engines are pure: plain JSON states, `apply` returns a new state, randomness only through an `Rng`.
- Engine behaviour must match the Java original: `src/engine/parity.test.ts` replays its golden games.

## Board layout (non-negotiable)
- One `<svg>` per board with a fixed viewBox; pieces are a fixed fraction of a cell.
- Board box has a fixed aspect-ratio, is the largest fit (cap ~760px tall), centred in its column.
- Nothing reflows during play: highlights use SVG fills/rings/transforms/opacity only; status, dice and
  "thinking…" lines reserve their height. Top bar 56px; side panel 280px at ≥1100px, else below the board.
- Radial scrim behind the board; board on a solid surface with one soft shadow; WCAG AA text.
- No scrollbars at 1280×720; playable at 390×844.

## Scenes
- Props: flat SVG in 2–4 palette tones, dot eyes, no outlines or glows; heroes (`data-prop="hero"`) sit in the gutters in cqw/cqh and stay ≥50% visible (`e2e/scenes.spec.ts`).
- Motion: CSS keyframes on transform/opacity only, 0% is the rest pose, crossers (`data-crosser`) are rare and hidden when paused; no new canvases or JS loops.

## Anti-slop
No purple/indigo gradients, gradient text, neon glows, glassmorphism, emoji or sparkle icons, confetti,
heavy shadows on rounded-everything, bouncing chrome, hero sections, fake stats/lorem, "Powered by AI",
extra font families (Fraunces display + IBM Plex Sans UI only), or more than two accents per theme.
Do: 8px spacing scale, short plain copy, Lucide icons at one stroke (1.75), visible focus rings,
colour plus shape for state, 8–12px radii. No Chess.com or Hasbro branding.
