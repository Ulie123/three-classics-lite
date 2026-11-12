# Three Classics Lite

Connect Four, Checkers and Backgammon against the computer, running entirely in your browser.

**Play: https://ulie123.github.io/three-classics-lite/**

This is the share-a-link edition of [Three Classics](https://github.com/Ulie123/three-classics). That
project was built as a take-home with a Spring Boot server, PostgreSQL, Docker and Kubernetes. Here the
same game rules and computer players are ported to TypeScript and run in the browser, so the whole thing
is a static site on GitHub Pages with no server.

The boards, scenes, animations, difficulty levels, result screens, two-player mode, resume-after-refresh
and win/loss records all work the same way.

## What changed from the full project

| Full project | Lite |
| --- | --- |
| Java rules engines and computer players, run by Spring Boot | TypeScript ports in `src/engine`; the computer thinks in a Web Worker |
| REST API (`/api/games`, moves, stats) | An in-browser referee (`src/local/referee.ts`) that answers the same four calls |
| PostgreSQL | `localStorage`: games resume after a refresh, records stay in your browser |
| Docker Compose and Kubernetes | GitHub Pages, deployed by GitHub Actions |

The React frontend is the same code. Only the API client, the router's base path and two error messages
that mentioned the server were changed.

## How the rules are checked against the original

`src/engine/golden/java-games.json.gz` holds seeded random games played by the original Java engines:
40 Connect Four, 25 checkers and 14 backgammon games. For every move it records the legal moves, the
result, the notation, the computer's evaluation score, the dice and the resulting position.
`src/engine/parity.test.ts` replays each game through the TypeScript engines, and every one of those
must match. The Java program that wrote the file is in [`tools/golden`](tools/golden).

The rule edge cases, computer-player checks, soak games and API behaviour are also ported from the Java
test suite (`rules.test.ts`, `ai.test.ts`, `referee.test.ts`).

## Run it locally

```bash
npm ci
```

```bash
npm run dev
```

Then open http://localhost:5174.

## Tests

```bash
npm test
```

Vitest: the rules parity replay, rules, computer players, referee and frontend helpers.

```bash
npm run e2e
```

Playwright: plays every game, checks the layout at four screen sizes, keyboard play, and the scene
props. It starts the dev server itself. Set `PW_CHANNEL=msedge` or `chrome` to use an installed browser.

## Deploying

Every push to `main` runs `.github/workflows/pages.yml`: it runs the tests, builds with the base path
`/<repository name>/` and publishes to GitHub Pages. In the repository settings, Pages must use
**GitHub Actions** as its source.

## Good to know

- Saved games and records live in each visitor's own browser. Clearing site data resets them.
- Hard thinks for up to a second on the visitor's device. On a slow phone it may look a little less far
  ahead than the server did in the same time.
