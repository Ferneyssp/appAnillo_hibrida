import { expect, test } from '@playwright/test';
import { calibrate, hasHorizontalOverflow, setRange } from './helpers.js';

/**
 * PR — la app híbrida se adapta a cualquier pantalla: sin desplazamiento horizontal, con la
 * acción principal visible sin desplazarse y el círculo siempre a tamaño real.
 */
const screens = [
  { name: 'teléfono pequeño', viewport: { width: 320, height: 568 } },
  { name: 'teléfono', viewport: { width: 360, height: 780 } },
  { name: 'teléfono grande', viewport: { width: 430, height: 932 } },
  { name: 'teléfono horizontal', viewport: { width: 780, height: 360 } },
  { name: 'tableta vertical', viewport: { width: 768, height: 1024 } },
  { name: 'tableta horizontal', viewport: { width: 1180, height: 820 } },
  { name: 'escritorio', viewport: { width: 1440, height: 900 } },
  { name: 'escritorio grande', viewport: { width: 2560, height: 1440 } },
];
const ROUTES = ['home', 'prepare', 'calibration', 'sizer', 'finger', 'result', 'converter', 'saved', 'how', 'thumb'];

for (const { name, viewport } of screens) {
  test.describe(`PR ${name} ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, isMobile: viewport.width < 700, hasTouch: viewport.width < 1200 });

    test('todas las pantallas sin desplazamiento horizontal y con la acción principal visible', async ({ page }) => {
      await calibrate(page, 6);
      await page.evaluate(() => window.__ringSizer.store.setResult({ method: 'SCREEN', innerDiameterMm: 17.2 }));
      for (const route of ROUTES) {
        await page.evaluate((r) => window.__ringSizer.router.nav.push(r), route);
        await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
        expect(await hasHorizontalOverflow(page), `${route}: desplazamiento horizontal`).toBe(false);
        const primary = page.locator('.bottom-bar .btn-primary');
        if (await primary.count()) {
          const box = await primary.boundingBox();
          expect(box.y + box.height, `${route}: botón principal fuera de la pantalla`).toBeLessThanOrEqual(viewport.height + 0.5);
          expect(box.x).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('el círculo del medidor mantiene su tamaño real', async ({ page }) => {
      await calibrate(page, 6);
      await page.evaluate(() => window.__ringSizer.router.nav.push('sizer'));
      await setRange(page.getByTestId('sizer-slider'), 24.2);
      const circle = await page.getByTestId('sizer-circle').boundingBox();
      expect(circle.width).toBeCloseTo(24.2 * 6, 0);
      const area = await page.locator('.sizer-area').boundingBox();
      expect(circle.y).toBeGreaterThanOrEqual(area.y);
      expect(circle.y + circle.height).toBeLessThanOrEqual(area.y + area.height);
    });
  });
}
