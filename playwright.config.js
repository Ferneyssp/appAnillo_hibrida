import { defineConfig } from '@playwright/test';

/**
 * Pruebas E2E sobre la build de producción ("vite preview"), viewport de teléfono 360×780
 * (las pruebas de adaptación cambian el tamaño). PW_CHROMIUM permite usar un Chromium instalado.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'es-CO',
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 60_000 },
});
