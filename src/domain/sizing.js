import { SIZE_TABLE } from './sizeTable.js';

/**
 * Tallas según la tabla T1–T36 (02_Analisis.md §5). Equivalente a domain/Sizing.kt.
 *  - T: talla nacional (principal) · USA: equivalencia de la tabla · EU: circunferencia en mm (ISO 8653).
 *  - Un diámetro medido se asigna a la fila de la tabla con el Ø más cercano; si queda
 *    exactamente entre dos tallas se recomienda la MAYOR.
 */
export const SizingSystem = Object.freeze({ T: 'T', USA: 'USA', EU: 'EU' });
export const ALL_SYSTEMS = Object.freeze([SizingSystem.T, SizingSystem.USA, SizingSystem.EU]);
export const SYSTEM_LABEL = Object.freeze({ T: 'Talla (T)', USA: 'USA', EU: 'EU / ISO' });

export const roundHalfUp = (v) => Math.floor(v + 0.5);
export const circumferenceFromDiameter = (d) => d * Math.PI; // F1
export const diameterFromCircumference = (c) => c / Math.PI; // F2
export const euFor = (row) => roundHalfUp(circumferenceFromDiameter(row.d)); // F4

const first = SIZE_TABLE[0];
const last = SIZE_TABLE[SIZE_TABLE.length - 1];
/** Límites del rango cubierto: media distancia antes de T1 y después de T36. */
export const MIN_DIAMETER_MM = first.d - (SIZE_TABLE[1].d - first.d) / 2; // 12,8
export const MAX_DIAMETER_MM = last.d + (last.d - SIZE_TABLE[SIZE_TABLE.length - 2].d) / 2; // 24,35
export const isInSizeRange = (d) => d >= MIN_DIAMETER_MM && d <= MAX_DIAMETER_MM;

const EPS = 1e-9;

/** F5: fila de la tabla más cercana al diámetro (empate → talla mayor). */
export function rowFor(diameterMm) {
  let best = SIZE_TABLE[0];
  for (const row of SIZE_TABLE) {
    if (Math.abs(diameterMm - row.d) <= Math.abs(diameterMm - best.d) + EPS) best = row;
  }
  return best;
}

/** F6: diámetros que se asignan a una fila: [punto medio anterior, punto medio siguiente). */
export function rangeOf(row) {
  const i = SIZE_TABLE.indexOf(row);
  const low = i === 0 ? MIN_DIAMETER_MM : (SIZE_TABLE[i - 1].d + row.d) / 2;
  const high = i === SIZE_TABLE.length - 1 ? MAX_DIAMETER_MM : (row.d + SIZE_TABLE[i + 1].d) / 2;
  return [low, high];
}

export function labelOf(row, system) {
  if (system === SizingSystem.USA) return row.usa;
  if (system === SizingSystem.EU) return String(euFor(row));
  return `T ${row.t}`;
}

/** Talla de un diámetro en el sistema pedido: {system, label, row}. */
export function sizeFor(diameterMm, system) {
  const row = rowFor(diameterMm);
  return { system, label: labelOf(row, system), row };
}

/** Todas las equivalencias de un diámetro (T, USA y EU de la misma fila). */
export const equivalences = (diameterMm) => {
  const row = rowFor(diameterMm);
  return { row, T: labelOf(row, 'T'), USA: row.usa, EU: String(euFor(row)) };
};

/** Fila anterior/siguiente (flechas ← → del medidor). */
export function neighbour(diameterMm, step) {
  const i = SIZE_TABLE.indexOf(rowFor(diameterMm));
  return SIZE_TABLE[Math.min(SIZE_TABLE.length - 1, Math.max(0, i + step))];
}

/** Opciones del convertidor para un sistema (36 filas). */
export const sizeOptions = (system) => SIZE_TABLE.map((row) => ({ label: labelOf(row, system), row }));

/** Convertidor: misma fila de la tabla en otro sistema. */
export function convert(label, from, to) {
  const option = sizeOptions(from).find((o) => o.label === label);
  return option ? { system: to, label: labelOf(option.row, to), row: option.row } : null;
}

/** Tabla completa para «Cómo funciona». */
export const sizeChart = () =>
  SIZE_TABLE.map((row) => ({ t: row.t, diameterMm: row.d, circumferenceMm: circumferenceFromDiameter(row.d), usa: row.usa, eu: euFor(row) }));
