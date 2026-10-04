/**
 * Modelo radial de alcance del pulgar (igual a ThumbZoneModel.kt). Basado en los mapas de
 * calor de S. Hoober (2013). Pivote en la esquina inferior del lado de la mano que sostiene
 * el teléfono; distancias normalizadas por el ancho de pantalla (máx. 480 px).
 */
export const ThumbZone = Object.freeze({ EASY: 'EASY', NATURAL: 'NATURAL', HARD: 'HARD' });
export const Hand = Object.freeze({ RIGHT: 'RIGHT', LEFT: 'LEFT' });

export const EASY_RADIUS_FACTOR = 0.95;
export const NATURAL_RADIUS_FACTOR = 1.45;
export const MAX_PHONE_WIDTH = 480;

const reference = (width) => Math.min(width, MAX_PHONE_WIDTH);
export const easyRadius = (width) => EASY_RADIUS_FACTOR * reference(width);
export const naturalRadius = (width) => NATURAL_RADIUS_FACTOR * reference(width);

/** Clasifica el punto (x, y) medido desde la esquina superior izquierda del área de la app. */
export function classify(x, y, width, height, hand) {
  const pivotX = hand === Hand.RIGHT ? width : 0;
  const distance = Math.hypot(x - pivotX, y - height);
  if (distance <= easyRadius(width)) return ThumbZone.EASY;
  if (distance <= naturalRadius(width)) return ThumbZone.NATURAL;
  return ThumbZone.HARD;
}
