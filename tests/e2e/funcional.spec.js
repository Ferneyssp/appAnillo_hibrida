import { expect, test } from '@playwright/test';
import { calibrate, setRange } from './helpers.js';

test('PF-01 inicio: nombre, descripción, botones y pestañas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Encuentra tu talla de anillo/ })).toBeVisible();
  for (const name of ['Medir anillo', 'Cómo funciona']) await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  for (const tab of ['Anillo', 'Dedo', 'Convertidor', 'Guardadas']) await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible();
  await expect(page.getByTestId('calibration-status')).toHaveText('Pantalla sin calibrar');
});

test('PF-02 preparación: ilustración, pasos y «Comenzar medición»', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Medir anillo' }).click();
  await expect(page.getByText('Coloca el anillo siguiendo la guía mostrada en pantalla.')).toBeVisible();
  await expect(page.getByRole('img', { name: /Anillo apoyado sobre la pantalla/ })).toBeVisible();
  await expect(page.locator('ol.steps li')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Comenzar medición' })).toBeVisible();
});

test('PF-03 sin calibrar, el medidor lleva primero a la calibración', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Medir anillo' }).click();
  await page.getByRole('button', { name: 'Comenzar medición' }).click();
  await expect(page.getByRole('heading', { name: 'Calibrar pantalla' })).toBeVisible();
});

test('PF-04 calibración: el lado corto de la tarjeta (53,98 mm × escala) y se guarda', async ({ page }) => {
  await page.goto('/#/calibration');
  await setRange(page.getByTestId('calibration-slider'), 6);
  const outline = page.getByTestId('card-outline');
  const axis = await outline.getAttribute('data-axis');
  const box = await outline.boundingBox();
  expect(axis === 'width' ? box.width : box.height).toBeCloseTo(53.98 * 6, 0);
  await page.getByRole('button', { name: 'Guardar calibración' }).click();
  await expect(page.getByTestId('calibration-status')).toHaveText('Pantalla calibrada (6,00 px/mm)');
  await page.reload();
  await expect(page.getByTestId('calibration-status')).toHaveText('Pantalla calibrada (6,00 px/mm)');
});

test('PF-05 medidor: círculo a tamaño real y talla de la tabla', async ({ page }) => {
  await calibrate(page, 6);
  await page.getByRole('button', { name: 'Medir anillo' }).click();
  await page.getByRole('button', { name: 'Comenzar medición' }).click();
  const circle = page.getByTestId('sizer-circle');
  await setRange(page.getByTestId('sizer-slider'), 15.9);
  expect((await circle.boundingBox()).width).toBeCloseTo(15.9 * 6, 0);
  await expect(circle).toHaveText('15,9 mm');
  await expect(page.getByTestId('sizer-size')).toHaveText('T 10');
  await expect(page.getByTestId('sizer-equivalence')).toHaveText('5½ USA · EU 50 · Ø tabla 15,9 mm');
});

test('PF-06 flechas: saltan a la talla anterior/siguiente de la tabla', async ({ page }) => {
  await calibrate(page, 6);
  await page.goto('/#/how');
  await page.getByRole('button', { name: 'Medir anillo' }).click();
  await page.getByRole('button', { name: 'Comenzar medición' }).click();
  await setRange(page.getByTestId('sizer-slider'), 17.2);
  await page.getByRole('button', { name: 'Talla siguiente' }).click();
  await expect(page.getByTestId('sizer-circle')).toHaveText('17,5 mm');
  await expect(page.getByTestId('sizer-size')).toHaveText('T 15');
  await page.getByRole('button', { name: 'Talla anterior' }).click();
  await page.getByRole('button', { name: 'Talla anterior' }).click();
  await expect(page.getByTestId('sizer-size')).toHaveText('T 13');
  await page.getByTestId('sizer-system').selectOption('USA');
  await expect(page.getByTestId('sizer-size')).toHaveText('61/2');
});

test('PF-07 resultado cuadrado con la tabla (T 14 · 7 USA · EU 54)', async ({ page }) => {
  await calibrate(page, 6);
  await page.getByRole('button', { name: 'Medir anillo' }).click();
  await page.getByRole('button', { name: 'Comenzar medición' }).click();
  await setRange(page.getByTestId('sizer-slider'), 17.3);
  await page.getByRole('button', { name: 'Medición completada' }).click();
  await expect(page.getByTestId('result-size')).toHaveText('T 14');
  await expect(page.getByTestId('result-equivalence')).toHaveText('T 14 · 7 USA · EU 54');
  const main = page.locator('main');
  await expect(main).toContainText('Diámetro interior medido17,30 mm');
  await expect(main).toContainText('Talla en la tablaT 14 · Ø 17,2 mm');
  await expect(main).toContainText('Diámetros de esta talla17,00 – 17,35 mm');
  await page.getByTestId('result-system').getByRole('radio', { name: 'USA' }).click();
  await expect(page.getByTestId('result-size')).toHaveText('7 USA');
});

test('PF-08 guardar, validar, editar, compartir y eliminar', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await calibrate(page, 6);
  await page.evaluate(() => window.__ringSizer.store.setResult({ method: 'SCREEN', innerDiameterMm: 17.5 }));
  await page.evaluate(() => window.__ringSizer.router.nav.push('result'));
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('alert')).toHaveText('Escribe un nombre para la talla.');
  await page.locator('#saved-name').fill('Mi talla');
  await page.getByTestId('dialog-finger').getByRole('radio', { name: 'anular' }).click();
  await expect(page.locator('#saved-name')).toHaveValue('Mi talla');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('Talla guardada');
  await page.goto('/#/saved');
  const card = page.getByTestId('saved-card');
  await expect(card).toContainText('T 15');
  await expect(card).toContainText('7½ USA · EU 55 · mano derecha · anular');
  await card.getByRole('button', { name: 'Opciones de Mi talla' }).click();
  await card.getByRole('menuitem', { name: 'Compartir' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Mi talla: talla de anillo T 15 (USA 7½, EU 55; diámetro interior 17,5 mm, mano derecha, dedo anular).');
  await card.getByRole('button', { name: 'Opciones de Mi talla' }).click();
  await card.getByRole('menuitem', { name: 'Editar' }).click();
  await page.locator('#saved-name').fill('Anillo de mi esposa');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByTestId('saved-card')).toContainText('Anillo de mi esposa');
  await page.goto('/');
  await page.getByRole('button', { name: 'Guardadas', exact: true }).click();
  await page.getByRole('button', { name: 'Opciones de Anillo de mi esposa' }).click();
  await page.getByRole('menuitem', { name: 'Eliminar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByText('Aún no has guardado tallas.')).toBeVisible();
});

test('PF-09 convertidor con la tabla: T 10 → 5½ USA, 8¾ USA → T 19, ⇄', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Convertidor', exact: true }).click();
  await page.getByTestId('converter-size').selectOption('T 10');
  await expect(page.getByTestId('converter-result')).toHaveText('51/2');
  await page.getByRole('button', { name: 'Intercambiar sistemas' }).click();
  await page.getByTestId('converter-size').selectOption('8¾');
  await expect(page.getByTestId('converter-result')).toHaveText('T 19');
  await page.getByTestId('converter-to').selectOption('EU');
  await expect(page.getByTestId('converter-result')).toHaveText('59');
});

test('PF-10 medidor de dedo: ancho real, ⇄, resultado con advertencia', async ({ page }) => {
  await calibrate(page, 6);
  await page.getByRole('button', { name: 'Dedo', exact: true }).click();
  await setRange(page.getByTestId('finger-slider'), 18.1);
  expect((await page.getByTestId('finger-shape').boundingBox()).width).toBeCloseTo(18.1 * 6, 0);
  await expect(page.getByTestId('finger-value')).toHaveText('18,1 mm · T 17 · 8 USA');
  await page.getByRole('button', { name: 'Cambiar el control de lado' }).click();
  await expect(page.locator('.finger-area')).toHaveClass(/side-left/);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByTestId('precision')).toContainText('ancho del dedo');
  await page.getByRole('button', { name: 'Volver a medir' }).click();
  await expect(page.getByTestId('finger-shape')).toBeVisible();
});

test('PF-11 «Cómo funciona»: tarjeta de referencia, fórmulas y tabla T1–T36', async ({ page }) => {
  await page.goto('/#/how');
  const main = page.locator('main');
  await expect(main).toContainText('85,60 × 53,98 mm');
  await expect(main).toContainText('Circunferencia = Diámetro × π');
  const rows = page.getByTestId('size-table').locator('tbody tr');
  await expect(rows).toHaveCount(36);
  await expect(rows.nth(13)).toHaveText('T 1417,254,0754');
});


test('PF-13 navegación atrás y sin errores técnicos', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await calibrate(page, 6);
  await page.getByRole('button', { name: 'Medir anillo' }).click();
  await page.getByRole('button', { name: 'Comenzar medición' }).click();
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Comenzar medición' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver' }).click();
  await expect(page.getByRole('button', { name: 'Medir anillo' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/NaN|undefined|Infinity|null/);
  expect(errors).toEqual([]);
});
