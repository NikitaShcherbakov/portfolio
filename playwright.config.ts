import { defineConfig, devices } from '@playwright/test';

const localBaseUrl = 'http://localhost:4173';
const remoteBaseUrl = process.env.E2E_BASE_URL;
const baseURL = remoteBaseUrl ?? localBaseUrl;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    locale: 'ru-RU',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  ...(remoteBaseUrl === undefined && {
    webServer: {
      command: 'pnpm build && pnpm preview --port 4173 --strictPort',
      url: localBaseUrl,
      reuseExistingServer: !isCi,
      timeout: 180_000,
    },
  }),
});
