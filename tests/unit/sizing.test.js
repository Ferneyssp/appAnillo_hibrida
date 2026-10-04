import { describe, expect, it } from 'vitest';
import { SIZE_TABLE } from '../../src/domain/sizeTable.js';
import {
  convert, equivalences, euFor, MAX_DIAMETER_MM, MIN_DIAMETER_MM, neighbour, rangeOf, rowFor, sizeChart, sizeFor, sizeOptions, SizingSystem,
} from '../../src/domain/sizing.js';
import { CARD_HEIGHT_MM, isValidCalibration, pxPerMmFromCardShortSide } from '../../src/domain/calibration.js';
import { createSavedSize, createSavedSizesRepository, shareText, validateName } from '../../src/domain/savedSizes.js';

// Mismos casos que SizingTest.kt (app nativa).
describe('Tabla de tallas T1–T36 (imagen «Tallas y equivalencias»)', () => {
  it('contiene las 36 filas de la imagen, ordenadas', () => {
    expect(SIZE_TABLE).toHaveLength(36);
    expect(SIZE_TABLE.map((r) => r.t)).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
    for (let i = 1; i < 36; i++) expect(SIZE_TABLE[i].d).toBeGreaterThan(SIZE_TABLE[i - 1].d);
  });
  it('filas de control de la imagen', () => {
    const at = (t) => SIZE_TABLE[t - 1];
    expect(at(1)).toEqual({ t: 1, d: 13.0, usa: '1' });
    expect(at(10)).toEqual({ t: 10, d: 15.9, usa: '5½' });
    expect(at(14)).toEqual({ t: 14, d: 17.2, usa: '7' });
    expect(at(19)).toEqual({ t: 19, d: 18.8, usa: '8¾' });
    expect(at(30)).toEqual({ t: 30, d: 22.3, usa: '13' });
    expect(at(36)).toEqual({ t: 36, d: 24.2, usa: '15½' });
  });
  it('cada diámetro de la tabla da exactamente su talla', () => {
    for (const row of SIZE_TABLE) {
      expect(sizeFor(row.d, SizingSystem.T).label).toBe(`T ${row.t}`);
      expect(sizeFor(row.d, SizingSystem.USA).label).toBe(row.usa);
    }
  });
  it('diámetros intermedios van a la talla más cercana; empate → la mayor', () => {
    expect(rowFor(17.3).t).toBe(14); // 17,3 está a 0,1 de T14 y 0,2 de T15
    expect(rowFor(17.4).t).toBe(15);
    expect(rowFor(17.35).t).toBe(15); // punto medio exacto entre T14 (17,2) y T15 (17,5)
    expect(rowFor(13.2).t).toBe(2); // punto medio entre T1 y T2
  });
  it('rango de cada talla y límites T1/T36', () => {
    const [low, high] = rangeOf(SIZE_TABLE[13]);
    expect(low).toBeCloseTo(17.0, 9);
    expect(high).toBeCloseTo(17.35, 9);
    expect(MIN_DIAMETER_MM).toBeCloseTo(12.8, 9);
    expect(MAX_DIAMETER_MM).toBeCloseTo(24.35, 9);
  });
  it('EU/ISO = circunferencia redondeada de la fila', () => {
    expect(euFor(SIZE_TABLE[13])).toBe(54);
    expect(equivalences(17.2)).toMatchObject({ T: 'T 14', USA: '7', EU: '54' });
    expect(new Set(sizeOptions(SizingSystem.EU).map((o) => o.label)).size).toBe(36);
  });
  it('convertidor por filas de la tabla', () => {
    expect(convert('T 10', SizingSystem.T, SizingSystem.USA).label).toBe('5½');
    expect(convert('8¾', SizingSystem.USA, SizingSystem.T).label).toBe('T 19');
    expect(convert('54', SizingSystem.EU, SizingSystem.USA).label).toBe('7');
    expect(convert('99', SizingSystem.USA, SizingSystem.T)).toBeNull();
    for (const o of sizeOptions(SizingSystem.USA)) {
      const t = convert(o.label, SizingSystem.USA, SizingSystem.T);
      expect(convert(t.label, SizingSystem.T, SizingSystem.USA).label).toBe(o.label);
    }
  });
  it('flechas: talla anterior y siguiente, sin salir de la tabla', () => {
    expect(neighbour(17.2, 1).t).toBe(15);
    expect(neighbour(17.2, -1).t).toBe(13);
    expect(neighbour(13.0, -1).t).toBe(1);
    expect(neighbour(24.2, 1).t).toBe(36);
  });
  it('tabla completa para «Cómo funciona»', () => {
    expect(sizeChart()[13]).toMatchObject({ t: 14, usa: '7', eu: 54 });
  });
});

describe('Calibración de pantalla con tarjeta ID-1', () => {
  it('px/mm a partir del lado corto de la tarjeta', () => {
    expect(pxPerMmFromCardShortSide(CARD_HEIGHT_MM * 6)).toBeCloseTo(6, 9);
    expect(isValidCalibration(3.78)).toBe(true);
    expect(isValidCalibration(0.5)).toBe(false);
    expect(isValidCalibration(NaN)).toBe(false);
  });
});

describe('Tallas guardadas y compartir', () => {
  const memory = () => {
    const data = new Map();
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  };
  it('valida el nombre', () => {
    expect(validateName('  ')).toBe('Escribe un nombre para la talla.');
    expect(validateName('x'.repeat(41))).toMatch('máximo 40');
    expect(validateName('Mi talla')).toBeNull();
  });
  it('agrega, edita, lista y elimina', () => {
    const repo = createSavedSizesRepository(memory());
    const a = createSavedSize({ name: 'Mi talla', diameterMm: 17.5, system: 'T', hand: 'RIGHT', finger: 'RING', method: 'SCREEN' }, 1);
    const b = createSavedSize({ name: 'Anillo de mi esposa', diameterMm: 15.9, system: 'T', hand: 'RIGHT', finger: 'RING', method: 'SCREEN' }, 2);
    repo.add(a);
    repo.add(b);
    expect(repo.list().map((s) => s.name)).toEqual(['Anillo de mi esposa', 'Mi talla']);
    repo.update(a.id, { name: 'Yo' });
    repo.remove(b.id);
    expect(repo.list()).toHaveLength(1);
    expect(repo.list()[0].name).toBe('Yo');
  });
  it('datos corruptos no rompen la app', () => {
    const storage = memory();
    storage.setItem('ring-sizer.saved', '{no es json');
    expect(createSavedSizesRepository(storage).list()).toEqual([]);
  });
  it('texto para compartir con T, USA y EU de la tabla', () => {
    const s = createSavedSize({ name: 'Mi talla', diameterMm: 17.5, system: 'T', hand: 'RIGHT', finger: 'RING', method: 'SCREEN' }, 1);
    expect(shareText(s)).toBe('Mi talla: talla de anillo T 15 (USA 7½, EU 55; diámetro interior 17,5 mm, mano derecha, dedo anular).');
  });
});
