import { expect, test } from '@playwright/test';
import { calibrate, enableOverlay, zoneOf } from './helpers.js';

const sizes = [
  { name: '360×780', viewport: { width: 360, height: 780 } },
  { name: '320×568', viewport: { width: 320, height: 568 } },
  { name: '412×915', viewport: { width: 412, height: 915 } },
];

for (const { name, viewport } of sizes) {
  test.describe(`Thumb Zone ${name}`, () => {
    test.use({ viewport });
    test('PT-01 acciones principales en zona verde (posición real)', async ({ page }) => {
      await calibrate(page, 6);
      await enableOverlay(page);
      expect(await zoneOf(page, 'Medir anillo')).toBe('EASY');
      await page.getByRole('button', { name: 'Medir anillo' }).click();
      expect(await zoneOf(page, 'Comenzar medición')).toBe('EASY');
      await page.getByRole('button', { name: 'Comenzar medición' }).click();
      expect(await zoneOf(page, 'Medición completada')).toBe('EASY');
      expect(await zoneOf(page, 'Talla siguiente')).toBe('EASY');
      expect(await zoneOf(page, 'Volver')).toBe('HARD');
      await page.getByRole('button', { name: 'Medición completada' }).click();
      expect(await zoneOf(page, 'Volver a medir')).toBe('EASY');
    });
  });
}

test('PT-02 pestañas inferiores en zona verde', async ({ page }) => {
  await page.goto('/');
  await enableOverlay(page);
  expect(await zoneOf(page, 'Pestaña Guardadas')).toBe('EASY');
  expect(['EASY', 'NATURAL']).toContain(await zoneOf(page, 'Pestaña Anillo'));
});

test('PT-03 objetivos táctiles ≥ 48 px en el medidor', async ({ page }) => {
  await calibrate(page, 6);
  await page.getByRole('button', { name: 'Medir anillo' }).click();
  await page.getByRole('button', { name: 'Comenzar medición' }).click();
  const small = await page.$$eval('button, input, select', (els) =>
    els.map((el) => ({ t: el.getAttribute('aria-label') || el.textContent.trim(), ...el.getBoundingClientRect().toJSON() }))
      .filter((r) => r.width > 0 && r.height < 48).map((r) => `${r.t} ${Math.round(r.width)}×${Math.round(r.height)}`));
  expect(small).toEqual([]);
});
