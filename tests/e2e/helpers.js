
/** Simula una calibración ya hecha (px por mm de la pantalla). */
export async function calibrate(page, pxPerMm = 6) {
  await page.goto('/');
  await page.evaluate((v) => localStorage.setItem('ring-sizer.pxPerMm', String(v)), pxPerMm);
  await page.reload();
}

export const setRange = (locator, value) =>
  locator.evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);


/** Ancho de página mayor que la ventana ⇒ desplazamiento horizontal (no permitido). */
export const hasHorizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1 || document.querySelector('.content').scrollWidth > document.querySelector('.content').clientWidth + 1);
