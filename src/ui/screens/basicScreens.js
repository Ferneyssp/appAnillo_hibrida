import { card, choiceRow, h, multiline, primaryButton, secondaryButton } from '../components.js';
import { screenMethodSvg } from '../illustrations.js';
import { classify, Hand, ThumbZone } from '../../domain/thumbZone.js';
import { sizeChart } from '../../domain/sizing.js';
import { oneDecimal, twoDecimals } from '../../domain/format.js';

/** P1 – Inicio (RF-01). */
export function homeScreen({ state, nav }) {
  const calibrated = state.pxPerMm !== null;
  return {
    title: '',
    align: 'center',
    className: 'home',
    content: [
      h('div', { class: 'hero' },
        h('p', { class: 'eyebrow' }, 'MEDIDOR DE ANILLO'),
        h('h2', { class: 'hero-title' }, 'Encuentra tu talla de anillo ', h('em', {}, 'en segundos')),
        h('div', { class: 'hero-ring', 'aria-hidden': 'true' }, h('div', { class: 'gold-ring' })),
        h('p', { class: 'hero-text' }, 'Apoya tu anillo sobre la pantalla y ajusta el círculo: la app lo mide y te dice la talla (T1 a T36, con su equivalencia USA).'),
        h('p', { class: `calibration-status ${calibrated ? 'ok' : 'warn'}`, 'data-testid': 'calibration-status' },
          calibrated ? `Pantalla calibrada (${twoDecimals(state.pxPerMm)} px/mm)` : 'Pantalla sin calibrar'),
      ),
    ],
    bottom: [
      h('div', { class: 'row-2' }, secondaryButton('Cómo funciona', () => nav.push('how')), secondaryButton('Ver Thumb Zone', () => nav.push('thumb'))),
      primaryButton('Medir anillo', () => nav.push('prepare')),
    ],
  };
}

/** P2 – Preparación (RF-10): explica cómo colocar el anillo. */
export function prepareScreen({ state, nav }) {
  const steps = [
    'Calibra la pantalla una sola vez con cualquier tarjeta bancaria o de identificación.',
    'Apoya el teléfono (o la tableta) sobre una mesa y pon el anillo plano encima del círculo dorado.',
    'Mueve el control hasta que el círculo coincida con el borde INTERIOR del anillo. Las flechas saltan a la talla anterior o siguiente de la tabla.',
    'Pulsa «Medición completada».',
  ];
  const warnings = [
    'Usa un anillo que te quede cómodo en el dedo donde usarás el nuevo.',
    'Mira la pantalla de frente para que el borde coincida bien.',
    'No presiones el anillo contra la pantalla.',
  ];
  return {
    title: 'Preparación',
    back: true,
    help: true,
    className: 'two-col',
    content: [
      h('div', { class: 'col' },
        h('p', { class: 'lead' }, 'Coloca el anillo siguiendo la guía mostrada en pantalla.'),
        h('div', { class: 'illustration-box', html: screenMethodSvg })),
      h('div', { class: 'col' },
        h('ol', { class: 'steps' }, steps.map((s) => h('li', {}, s))),
        card({ class: 'muted' }, h('strong', {}, 'Antes de empezar'), h('ul', { class: 'tips' }, warnings.map((w) => h('li', {}, w))))),
    ],
    bottom: [primaryButton('Comenzar medición', () => nav.push(state.pxPerMm === null ? 'calibration' : 'sizer'))],
  };
}

/** P8 – Cómo funciona (RF-19) con la tabla de tallas T1–T36. */
export function howScreen({ nav }) {
  const sections = [
    ['1. Cómo mide la app', 'Una pantalla solo conoce píxeles. Para convertirlos en milímetros, calibras una vez con una tarjeta de formato estándar ISO/IEC 7810 ID-1 (bancaria o de identificación), que mide exactamente 85,60 × 53,98 mm. Así la app sabe cuántos píxeles hay en 1 mm de TU pantalla y dibuja el círculo a tamaño real.'],
    ['2. Del círculo al diámetro', 'Cuando el círculo coincide con el borde interior del anillo, su tamaño es el diámetro interior del anillo:\nDiámetro (mm) = tamaño del círculo (px) ÷ px por mm.\nCircunferencia = Diámetro × π.'],
    ['3. Del diámetro a la talla', 'La app busca en la tabla de tallas la talla cuyo diámetro (Ø) está más cerca del medido. Si quedas exactamente entre dos tallas, recomienda la mayor. La equivalencia USA es la de la misma fila de la tabla; EU/ISO es la circunferencia en milímetros.'],
    ['4. Precisión', 'Entre una talla y la siguiente hay solo 0,3–0,4 mm. Calibra con cuidado y mira de frente. Para una compra importante confirma con tu joyero.'],
  ];
  return {
    title: 'Cómo funciona',
    back: true,
    className: 'two-col',
    content: [
      h('div', { class: 'col' }, ...sections.map(([title, body]) => card({}, h('h3', {}, title), multiline(body)))),
      h('div', { class: 'col' }, card({},
        h('h3', {}, 'Tallas y equivalencias'),
        h('div', { class: 'table-wrap' }, h('table', { class: 'size-table', 'data-testid': 'size-table' },
          h('thead', {}, h('tr', {}, ['Talla', 'Ø mm', 'Circ. mm', 'USA', 'EU'].map((x) => h('th', { scope: 'col' }, x)))),
          h('tbody', {}, sizeChart().map((r) => h('tr', {}, [`T ${r.t}`, oneDecimal(r.diameterMm), oneDecimal(r.circumferenceMm), r.usa, String(r.eu)].map((v) => h('td', {}, v))))))))),
    ],
    bottom: [primaryButton('Medir anillo', () => nav.reset('prepare'))],
  };
}

const ZONE_CLASS = { [ThumbZone.EASY]: 'zone-easy', [ThumbZone.NATURAL]: 'zone-natural', [ThumbZone.HARD]: 'zone-hard' };

function phoneDiagram(hand) {
  const cells = [];
  for (let y = 0; y < 780; y += 15) {
    for (let x = 0; x < 360; x += 15) {
      cells.push(`<rect x="${x}" y="${y}" width="15" height="15" class="${ZONE_CLASS[classify(x + 7.5, y + 7.5, 360, 780, hand)]}"/>`);
    }
  }
  return h('div', {
    class: 'phone-diagram',
    html: `<svg viewBox="0 0 360 780" role="img" aria-label="Mapa de zonas de alcance del pulgar"><g opacity="0.6">${cells.join('')}</g>
      <rect x="2" y="2" width="356" height="776" rx="36" fill="none" stroke="currentColor" stroke-width="6"/></svg>`,
  });
}

/** P11 – Thumb Zone (RF-11). */
export function thumbScreen({ state, store }) {
  const legend = (zone, text) => h('div', { class: 'legend' }, h('span', { class: `swatch ${ZONE_CLASS[zone]}` }), text);
  return {
    title: 'Thumb Zone',
    back: true,
    className: 'two-col',
    content: [
      h('div', { class: 'col' },
        h('p', {}, 'Zona de la pantalla que alcanzas con el pulgar sosteniendo el teléfono con una mano. Las acciones principales (Medir, Comenzar medición, Medición completada, Volver a medir) están en la zona verde.'),
        phoneDiagram(state.hand)),
      h('div', { class: 'col' },
        legend(ThumbZone.EASY, 'Verde: fácil alcance'),
        legend(ThumbZone.NATURAL, 'Amarilla: alcance medio'),
        legend(ThumbZone.HARD, 'Roja: difícil alcance'),
        choiceRow({
          label: 'Mano con la que sostienes el teléfono',
          options: [Hand.RIGHT, Hand.LEFT],
          selected: state.hand,
          optionLabel: (x) => (x === Hand.RIGHT ? 'Derecha' : 'Izquierda'),
          onSelect: (hand) => store.set({ hand }),
          thumbLabel: 'Mano',
          testId: 'hand',
        })),
    ],
    bottom: [
      primaryButton(state.thumbZoneVisible ? 'Ocultar zonas de la app' : 'Mostrar zonas sobre la app', () =>
        store.set({ thumbZoneVisible: !state.thumbZoneVisible }),
      ),
    ],
  };
}
