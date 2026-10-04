/**
 * Conversión píxel ↔ milímetro de la PANTALLA. En la web el «px» CSS no es una unidad física
 * (CSS supone 96 px/in), por eso la calibración con una tarjeta ID-1 es obligatoria.
 */
export const CARD_WIDTH_MM = 85.6; // ISO/IEC 7810 ID-1 (tarjetas bancarias y de identificación)
export const CARD_HEIGHT_MM = 53.98;
export const CSS_REFERENCE_PX_PER_MM = 96 / 25.4;
export const MIN_PX_PER_MM = 2;
export const MAX_PX_PER_MM = 12;

/** El usuario ajusta el ancho del recuadro al lado corto de la tarjeta (53,98 mm). */
export const pxPerMmFromCardShortSide = (widthPx) => widthPx / CARD_HEIGHT_MM;

export const mmToPx = (mm, pxPerMm) => mm * pxPerMm;

export const isValidCalibration = (pxPerMm) =>
  Number.isFinite(pxPerMm) && pxPerMm >= MIN_PX_PER_MM && pxPerMm <= MAX_PX_PER_MM;
