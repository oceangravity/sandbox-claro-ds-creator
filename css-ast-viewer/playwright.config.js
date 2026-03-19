import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3333',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'npx tsx server.ts',
      port: 3334,
      reuseExistingServer: true,
    },
    {
      command: 'npx vite --port 3333',
      port: 3333,
      reuseExistingServer: true,
    },
  ],
});
