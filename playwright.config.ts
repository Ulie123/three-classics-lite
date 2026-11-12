import { defineConfig, devices } from '@playwright/test';

// Starts the Vite dev server unless one is already running. Point E2E_BASE_URL elsewhere to test
// another copy, such as a local `npm run preview`.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5174';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // The computer thinks on the same machine as the browser; one test at a time keeps timing steady.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    // Set PW_CHANNEL=msedge or chrome to use an installed browser instead of Playwright's Chromium.
    channel: process.env.PW_CHANNEL || undefined,
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
