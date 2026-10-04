import { equivalences } from './sizing.js';
import { oneDecimal } from './format.js';

/** Colecciones: tallas guardadas (pantallas "Collections" y "Share" de las imágenes). */
export const Hand = Object.freeze({ RIGHT: 'RIGHT', LEFT: 'LEFT' });
export const Finger = Object.freeze({ THUMB: 'THUMB', INDEX: 'INDEX', MIDDLE: 'MIDDLE', RING: 'RING', LITTLE: 'LITTLE' });
export const HAND_LABEL = { RIGHT: 'mano derecha', LEFT: 'mano izquierda' };
export const FINGER_LABEL = { THUMB: 'pulgar', INDEX: 'índice', MIDDLE: 'medio', RING: 'anular', LITTLE: 'meñique' };
export const MAX_NAME_LENGTH = 40;

export function validateName(name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return 'Escribe un nombre para la talla.';
  if (trimmed.length > MAX_NAME_LENGTH) return `El nombre debe tener máximo ${MAX_NAME_LENGTH} caracteres.`;
  return null;
}

export function createSavedSize({ name, diameterMm, system, hand, finger, method }, now = Date.now()) {
  return {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(name).trim(),
    diameterMm,
    system,
    hand,
    finger,
    method,
    createdAt: now,
  };
}

/** Texto para «Compartir»: «Mi talla: talla de anillo T 14 (USA 7, EU 54; …)». */
export function shareText(saved) {
  const eq = equivalences(saved.diameterMm);
  return `${saved.name}: talla de anillo ${eq.T} (USA ${eq.USA}, EU ${eq.EU}; diámetro interior ${oneDecimal(saved.diameterMm)} mm, ${HAND_LABEL[saved.hand]}, dedo ${FINGER_LABEL[saved.finger]}).`;
}

/** Repositorio sobre un almacenamiento clave-valor (localStorage en la web/WebView). */
export function createSavedSizesRepository(storage, key = 'ring-sizer.saved') {
  const read = () => {
    try {
      const parsed = JSON.parse(storage.getItem(key) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((s) => s && typeof s.diameterMm === 'number') : [];
    } catch {
      return [];
    }
  };
  const write = (items) => {
    try {
      storage.setItem(key, JSON.stringify(items));
      return true;
    } catch {
      return false;
    }
  };
  return {
    list: () => read().sort((a, b) => b.createdAt - a.createdAt),
    add: (item) => write([...read(), item]),
    update: (id, changes) => write(read().map((s) => (s.id === id ? { ...s, ...changes } : s))),
    remove: (id) => write(read().filter((s) => s.id !== id)),
  };
}
