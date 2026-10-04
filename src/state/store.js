import { SizingSystem } from '../domain/sizing.js';
import { Hand as ThumbHand } from '../domain/thumbZone.js';
import { createSavedSizesRepository } from '../domain/savedSizes.js';
import { isValidCalibration } from '../domain/calibration.js';

/**
 * "ViewModel" de la app híbrida: estado inmutable en memoria + persistencia ligera
 * (calibración y tallas guardadas en localStorage). Flujo unidireccional como en la nativa.
 */
const CALIBRATION_KEY = 'ring-sizer.pxPerMm';

export function safeStorage() {
  try {
    const probe = '__probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const memory = new Map();
    return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, String(v)), removeItem: (k) => memory.delete(k) };
  }
}

export function createStore(storage = safeStorage()) {
  const repository = createSavedSizesRepository(storage);
  const storedCalibration = Number(storage.getItem(CALIBRATION_KEY));
  let state = {
    system: SizingSystem.T,
    pxPerMm: isValidCalibration(storedCalibration) ? storedCalibration : null,
    sizerDiameterMm: 17.2,
    fingerWidthMm: 17.2,
    fingerControlSide: 'RIGHT',
    result: null,
    saved: repository.list(),
    dialog: null,
    toast: null,
    thumbZoneVisible: false,
    hand: ThumbHand.RIGHT,
    converter: { label: 'T 14', from: SizingSystem.T, to: SizingSystem.USA },
  };
  const listeners = new Set();
  const set = (changes) => {
    state = { ...state, ...changes };
    listeners.forEach((l) => l(state, changes));
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set,
    setCalibration(pxPerMm) {
      if (!isValidCalibration(pxPerMm)) return false;
      storage.setItem(CALIBRATION_KEY, String(pxPerMm));
      set({ pxPerMm });
      return true;
    },
    clearCalibration() {
      storage.removeItem?.(CALIBRATION_KEY);
      set({ pxPerMm: null });
    },
    setResult(result) {
      set({ result });
    },
    addSaved(item) {
      repository.add(item);
      set({ saved: repository.list(), dialog: null, toast: 'Talla guardada' });
    },
    updateSaved(id, changes) {
      repository.update(id, changes);
      set({ saved: repository.list(), dialog: null, toast: 'Cambios guardados' });
    },
    removeSaved(id) {
      repository.remove(id);
      set({ saved: repository.list(), dialog: null, toast: 'Talla eliminada' });
    },
  };
}
