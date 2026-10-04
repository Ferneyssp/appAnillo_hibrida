import { describe, expect, it } from 'vitest';
import { classify, easyRadius, Hand, ThumbZone } from '../../src/domain/thumbZone.js';

const zone = (x, y, hand = Hand.RIGHT) => classify(x, y, 360, 780, hand);

// Mismos casos que ThumbZoneModelTest.kt (app nativa).
describe('ThumbZoneModel', () => {
  it('botón principal en la parte inferior es fácil', () => expect(zone(180, 750)).toBe(ThumbZone.EASY));
  it('centro de la pantalla es alcance medio', () => expect(zone(180, 450)).toBe(ThumbZone.NATURAL));
  it('esquina superior opuesta es difícil', () => expect(zone(20, 40)).toBe(ThumbZone.HARD));
  it('esquina inferior opuesta requiere estirar el pulgar', () => expect(zone(10, 770)).toBe(ThumbZone.NATURAL));
  it('mano izquierda refleja las zonas', () => {
    expect(zone(340, 40, Hand.LEFT)).toBe(ThumbZone.HARD);
    expect(zone(20, 760, Hand.LEFT)).toBe(ThumbZone.EASY);
    expect(zone(350, 770, Hand.LEFT)).toBe(ThumbZone.NATURAL);
  });
  it('en pantallas anchas el radio se limita al ancho de un teléfono', () => {
    expect(easyRadius(1000)).toBeCloseTo(456, 9);
    expect(easyRadius(360)).toBeCloseTo(342, 9);
  });
});
