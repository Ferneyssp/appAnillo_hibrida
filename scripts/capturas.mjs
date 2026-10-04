/**
 * Capturas reales de la app híbrida (con y sin «Ver Thumb Zone») y en varios tamaños de
 * pantalla → Documentacion/img. Requiere `npm run build && npm run preview` en otra terminal.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../../Documentacion/img/hibrida/', import.meta.url).pathname;
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
mkdirSync(`${OUT}adaptable`, { recursive: true });
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

async function newPage(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: viewport.width < 700 ? 2 : 1, isMobile: viewport.width < 700, hasTouch: true });
  await page.goto(BASE);
  return page;
}
const api = (page) => ({
  set: (s) => page.evaluate((x) => window.__ringSizer.store.set(x), s),
  push: (r) => page.evaluate((x) => window.__ringSizer.router.nav.push(x), r),
  range: (id, v) => page.getByTestId(id).evaluate((el, x) => { el.value = String(x); el.dispatchEvent(new Event('input', { bubbles: true })); }, v),
});

// 1) Teléfono 360×780: cada pantalla con y sin Thumb Zone + análisis de posiciones.
const page = await newPage({ width: 360, height: 780 });
const a = api(page);
const analysis = {};
async function capture(id) {
  await a.set({ toast: null });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}${id}.png` });
  await a.set({ thumbZoneVisible: true });
  await page.waitForSelector('[data-testid="thumb-overlay"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}${id}_thumbzone.png` });
  analysis[id] = await page.$$eval('.thumb-target', (els) => els.map((el) => ({
    control: el.textContent.split(' · ')[0], zone: el.dataset.zone,
    x: Math.round(el.offsetLeft), y: Math.round(el.offsetTop), w: Math.round(el.offsetWidth), h: Math.round(el.offsetHeight),
  })));
  await a.set({ thumbZoneVisible: false });
}
await capture('P01_inicio');
await page.getByRole('button', { name: 'Medir anillo' }).click();
await capture('P02_preparacion');
await page.getByRole('button', { name: 'Comenzar medición' }).click();
await a.range('calibration-slider', 6);
await capture('P09_calibracion');
await page.getByRole('button', { name: 'Guardar calibración' }).click();
await page.getByRole('button', { name: 'Comenzar medición' }).click();
await a.range('sizer-slider', 17.2);
await capture('P03_medidor');
await page.getByRole('button', { name: 'Medición completada' }).click();
await capture('P04_resultado');
await page.getByRole('button', { name: 'Guardar', exact: true }).click();
await page.locator('#saved-name').fill('Mi talla');
await page.screenshot({ path: `${OUT}P04_dialogo_guardar.png` });
await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
await page.goto(`${BASE}/#/finger`);
await a.range('finger-slider', 16.5);
await capture('P05_medidor_dedo');
await page.goto(`${BASE}/#/converter`);
await page.getByTestId('converter-size').selectOption('T 10');
await page.getByTestId('converter-to').selectOption('USA');
await capture('P06_convertidor');
await page.goto(`${BASE}/#/saved`);
await capture('P07_guardadas');
await page.getByRole('button', { name: /Opciones de/ }).first().click();
await page.screenshot({ path: `${OUT}P07_guardadas_menu.png` });
await page.goto(`${BASE}/#/how`);
await capture('P08_como_funciona');
await page.goto(`${BASE}/#/thumb`);
await capture('P11_thumb_zone');
writeFileSync(`${OUT}thumbzone_analisis.json`, JSON.stringify(analysis, null, 2));

// 2) Adaptación a otras pantallas.
const sizes = { telefono_pequeno: [320, 568], telefono_horizontal: [780, 360], tableta: [768, 1024], tableta_horizontal: [1180, 820], escritorio: [1440, 900] };
for (const [name, [width, height]] of Object.entries(sizes)) {
  const p = await newPage({ width, height });
  const b = api(p);
  await p.evaluate(() => localStorage.setItem('ring-sizer.pxPerMm', '6'));
  await p.reload();
  await p.screenshot({ path: `${OUT}adaptable/${name}_inicio.png` });
  await b.push('sizer');
  await b.range('sizer-slider', 17.2);
  await p.screenshot({ path: `${OUT}adaptable/${name}_medidor.png` });
  await p.getByRole('button', { name: 'Medición completada' }).click();
  await p.screenshot({ path: `${OUT}adaptable/${name}_resultado.png` });
  await p.close();
}
await browser.close();
console.log('Capturas en', OUT);
