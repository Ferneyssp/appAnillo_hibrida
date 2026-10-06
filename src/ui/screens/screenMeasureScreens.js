import { h, linkButton, primaryButton, sizeNode } from '../components.js';
import { ALL_SYSTEMS, equivalences, MAX_DIAMETER_MM, MIN_DIAMETER_MM, neighbour, sizeFor, SYSTEM_LABEL } from '../../domain/sizing.js';
import { CARD_HEIGHT_MM, CARD_WIDTH_MM, CSS_REFERENCE_PX_PER_MM, MAX_PX_PER_MM, MIN_PX_PER_MM } from '../../domain/calibration.js';
import { oneDecimal, twoDecimals } from '../../domain/format.js';

const STEP_MM = 0.05;
const clampMm = (v) => Math.min(MAX_DIAMETER_MM, Math.max(MIN_DIAMETER_MM, v));

function systemSelect(state, store, testId) {
  return h(
    'label',
    { class: 'system-select' },
    h('span', { class: 'sr-only' }, 'Sistema de tallas'),
    h(
      'select',
      { 'data-testid': testId, onChange: (e) => store.set({ system: e.target.value }) },
      ALL_SYSTEMS.map((s) => h('option', { value: s, selected: s === state.system }, SYSTEM_LABEL[s])),
    ),
  );
}

function screenResult(method, diameterMm) {
  return { method, innerDiameterMm: diameterMm };
}

/** Texto secundario con las equivalencias de la misma fila de la tabla. */
function equivalenceText(diameter, system) {
  const eq = equivalences(diameter);
  const parts = { T: eq.T, USA: `${eq.USA} USA`, EU: `EU ${eq.EU}` };
  return ALL_SYSTEMS.filter((s) => s !== system).map((s) => parts[s]).join(' · ') + ` · Ø tabla ${oneDecimal(eq.row.d)} mm`;
}

/**
 * P3a – Medidor sobre la pantalla (reproduce la captura "Ring Sizer"): círculo dorado a
 * tamaño real sobre cuadrícula, flechas ← → de ajuste fino, deslizador y talla en vivo.
 */
export function sizerScreen({ state, store, nav }) {
  const ppm = state.pxPerMm;
  let diameter = state.sizerDiameterMm;
  const circle = h('div', { class: 'sizer-circle', 'data-testid': 'sizer-circle' }, h('span', { class: 'sizer-mm' }));
  const sizeLabel = h('div', { class: 'size-readout', 'aria-live': 'polite', 'data-testid': 'sizer-size' });
  const eqLabel = h('p', { class: 'size-equivalence', 'data-testid': 'sizer-equivalence' });
  const slider = h('input', {
    type: 'range',
    class: 'slider',
    min: MIN_DIAMETER_MM.toFixed(2),
    max: MAX_DIAMETER_MM.toFixed(2),
    step: String(STEP_MM),
    value: String(diameter),
    'aria-label': 'Diámetro del círculo en milímetros',
    'data-testid': 'sizer-slider',
  });

  const update = () => {
    const px = diameter * ppm;
    circle.style.width = `${px}px`;
    circle.style.height = `${px}px`;
    circle.firstChild.textContent = `${oneDecimal(diameter)} mm`;
    const system = store.getState().system;
    sizeLabel.replaceChildren(sizeNode(sizeFor(diameter, system).label));
    eqLabel.textContent = equivalenceText(diameter, system);
    slider.value = String(diameter);
    slider.setAttribute('aria-valuetext', `${oneDecimal(diameter)} milímetros`);
  };
  const setDiameter = (v) => {
    diameter = clampMm(v);
    update();
    store.set({ sizerDiameterMm: diameter });
  };
  slider.addEventListener('input', () => setDiameter(Number(slider.value)));
  update();

  // Las flechas saltan al Ø de la talla anterior/siguiente de la tabla T1–T36.
  const nudge = (label, step, symbol) =>
    h('button', { type: 'button', class: 'nudge', 'aria-label': label, onClick: () => setDiameter(neighbour(diameter, step).d) }, symbol);

  return {
    title: 'Medidor de anillo',
    back: true,
    help: true,
    interactive: true,
    dependsOn: ['system', 'pxPerMm', 'result'],
    className: 'no-pad measure-screen',
    content: [
      h('div', { class: 'sizer-area grid-bg' }, systemSelect(state, store, 'sizer-system'), h('div', { class: 'sizer-stage' }, circle)),
      h('div', { class: 'measure-info' },
        h('p', { class: 'hint center' }, 'Pon el anillo sobre el círculo y mueve el control hasta que el círculo coincida con su borde interior.'),
        sizeLabel,
        eqLabel,
        linkButton('Calibrar de nuevo la pantalla', () => nav.push('calibration'))),
    ],
    bottom: [
      h('div', { class: 'slider-row with-nudges' }, nudge('Talla anterior', -1, '←'), slider, nudge('Talla siguiente', 1, '→')),
      primaryButton('Medición completada', () => {
        store.setResult(screenResult('SCREEN', diameter));
        nav.push('result');
      }),
    ],
  };
}

/**
 * P3c – Medidor de dedo (captura "Finger Sizer"): silueta amarilla cuyo ancho se ajusta con
 * un deslizador vertical; ⇄ cambia el control de lado (mano izquierda/derecha).
 */
export function fingerScreen({ state, store, nav }) {
  if (state.pxPerMm === null) return calibrationRequired(nav, 'Medidor de dedo');
  const ppm = state.pxPerMm;
  let width = state.fingerWidthMm;
  const finger = h('div', { class: 'finger-shape', 'data-testid': 'finger-shape' }, h('div', { class: 'finger-nail' }));
  const value = h('div', { class: 'finger-value', 'aria-live': 'polite', 'data-testid': 'finger-value' });
  const slider = h('input', {
    type: 'range',
    class: 'slider vertical',
    min: MIN_DIAMETER_MM.toFixed(2),
    max: MAX_DIAMETER_MM.toFixed(2),
    step: String(STEP_MM),
    value: String(width),
    'aria-label': 'Ancho del dedo en milímetros',
    'aria-orientation': 'vertical',
    'data-testid': 'finger-slider',
  });
  const update = () => {
    finger.style.width = `${width * ppm}px`;
    const eq = equivalences(width);
    value.textContent = `${oneDecimal(width)} mm · ${eq.T} · ${eq.USA} USA`;
    slider.value = String(width);
  };
  slider.addEventListener('input', () => {
    width = clampMm(Number(slider.value));
    update();
    store.set({ fingerWidthMm: width });
  });
  update();
  const side = state.fingerControlSide;
  return {
    title: 'Medidor de dedo',
    help: true,
    interactive: true,
    dependsOn: ['system', 'pxPerMm', 'fingerControlSide', 'result'],
    className: 'no-pad',
    content: [
      h('p', { class: 'hint center' }, 'Apoya el dedo sobre la silueta y ajusta el control hasta que tenga el mismo ancho que tu dedo (en la base, donde va el anillo).'),
      h(
        'div',
        { class: `finger-area side-${side.toLowerCase()}` },
        h('div', { class: 'finger-stage' }, finger),
        h(
          'div',
          { class: 'finger-controls' },
          slider,
          h(
            'button',
            {
              type: 'button',
              class: 'swap',
              'aria-label': 'Cambiar el control de lado',
              onClick: () => store.set({ fingerControlSide: side === 'RIGHT' ? 'LEFT' : 'RIGHT' }),
            },
            '⇄',
          ),
        ),
      ),
      value,
      h('p', { class: 'note' }, 'El ancho del dedo se toma como diámetro. Es menos preciso que medir un anillo: úsalo solo si no tienes uno.'),
    ],
    bottom: [
      primaryButton('Continuar', () => {
        store.setResult(screenResult('FINGER', width));
        nav.push('result');
      }),
    ],
  };
}

function calibrationRequired(nav, title) {
  return {
    title,
    back: true,
    content: [
      h('h2', {}, 'Primero, calibra tu pantalla'),
      h('p', {}, 'Para dibujar a tamaño real, la app necesita saber cuántos píxeles hay en un milímetro de tu pantalla. Solo se hace una vez y tarda menos de un minuto.'),
    ],
    bottom: [primaryButton('Calibrar pantalla', () => nav.push('calibration'))],
  };
}

/**
 * P9 – Calibración: un rectángulo del tamaño de una tarjeta ID-1 cuyo ANCHO se ajusta hasta
 * coincidir con el lado corto (53,98 mm) de una tarjeta real apoyada sobre la pantalla.
 */
export function calibrationScreen({ state, store, nav }) {
  let ppm = state.pxPerMm ?? CSS_REFERENCE_PX_PER_MM * 1.5;
  const rect = h('div', { class: 'card-outline', 'data-testid': 'card-outline' }, h('span', {}, 'Tarjeta'));
  const area = h('div', { class: 'calibration-area grid-bg', 'data-testid': 'calibration-area' }, rect);
  const hint = h('p', { class: 'hint center', 'data-testid': 'calibration-hint' });
  // El lado corto (53,98 mm) se mide en el eje con más espacio, para que quepa en cualquier
  // pantalla: en vertical la tarjeta va acostada (se ajusta la ALTURA); en horizontal, de pie (ANCHO).
  const horizontalMeasure = () => area.clientWidth > area.clientHeight;
  const readout = h('div', { class: 'calibration-readout', 'data-testid': 'calibration-readout' });
  const slider = h('input', {
    type: 'range',
    class: 'slider',
    min: String(MIN_PX_PER_MM),
    max: String(MAX_PX_PER_MM),
    step: '0.005',
    value: String(ppm),
    'aria-label': 'Escala de la pantalla',
    'data-testid': 'calibration-slider',
  });
  const update = () => {
    const horizontal = horizontalMeasure();
    rect.style.width = `${(horizontal ? CARD_HEIGHT_MM : CARD_WIDTH_MM) * ppm}px`;
    rect.style.height = `${(horizontal ? CARD_WIDTH_MM : CARD_HEIGHT_MM) * ppm}px`;
    rect.dataset.axis = horizontal ? 'width' : 'height';
    hint.textContent = horizontal
      ? 'Apoya una tarjeta (bancaria o de identificación) DE PIE en la esquina marcada y ajusta hasta que el ANCHO del recuadro coincida con el lado corto de la tarjeta.'
      : 'Apoya una tarjeta (bancaria o de identificación) ACOSTADA en la esquina marcada y ajusta hasta que la ALTURA del recuadro coincida con el lado corto de la tarjeta.';
    readout.textContent = `Escala: ${twoDecimals(ppm)} px/mm · el navegador supone ${twoDecimals(CSS_REFERENCE_PX_PER_MM)} px/mm (diferencia ${oneDecimal(((CSS_REFERENCE_PX_PER_MM - ppm) / ppm) * 100)} %)`;
    slider.value = String(ppm);
  };
  const setPpm = (v) => {
    ppm = Math.min(MAX_PX_PER_MM, Math.max(MIN_PX_PER_MM, v));
    update();
  };
  slider.addEventListener('input', () => setPpm(Number(slider.value)));
  update();
  return {
    title: 'Calibrar pantalla',
    back: true,
    interactive: true,
    dependsOn: ['pxPerMm'],
    className: 'no-pad',
    content: [hint, area, readout],
    onMount() {
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    },
    bottom: [
      h(
        'div',
        { class: 'slider-row with-nudges' },
        h('button', { type: 'button', class: 'nudge small', 'aria-label': 'Más pequeño', onClick: () => setPpm(ppm - 0.01) }, '−'),
        slider,
        h('button', { type: 'button', class: 'nudge small', 'aria-label': 'Más grande', onClick: () => setPpm(ppm + 0.01) }, '+'),
      ),
      primaryButton('Guardar calibración', () => {
        if (store.setCalibration(ppm)) {
          store.set({ toast: 'Pantalla calibrada' });
          nav.back();
        }
      }),
    ],
  };
}

