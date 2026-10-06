import { card, choiceRow, h, infoRow, primaryButton, secondaryButton, sizeNode } from '../components.js';
import { METHOD_LABEL } from '../messages.js';
import { ALL_SYSTEMS, circumferenceFromDiameter, convert, equivalences, rangeOf, sizeFor, sizeOptions, SYSTEM_LABEL } from '../../domain/sizing.js';
import { oneDecimal, twoDecimals } from '../../domain/format.js';
import { createSavedSize, Finger, FINGER_LABEL, Hand, HAND_LABEL, shareText, validateName } from '../../domain/savedSizes.js';
import { shareTextOut } from '../share.js';

async function share(store, saved) {
  const outcome = await shareTextOut(shareText(saved));
  if (outcome === 'copied') store.set({ toast: 'Texto copiado al portapapeles' });
  if (outcome === 'failed') store.set({ toast: 'No se pudo compartir' });
}

function precisionNote(result) {
  if (result.method === 'FINGER') {
    return h('div', { class: 'notice warn', role: 'note', 'data-testid': 'precision' },
      'Estimación a partir del ancho del dedo (se supone sección circular). Es menos precisa que medir un anillo.');
  }
  return h('div', { class: 'notice', role: 'note', 'data-testid': 'precision' },
    'La exactitud depende de la calibración de la pantalla y de que el círculo coincida con el borde interior del anillo. Si quedas entre dos tallas, elige la mayor.');
}

/** P4 – Resultado de la medición (RF-06, RF-07, RF-08), cuadrado con la tabla T1–T36. */
export function resultScreen({ state, store, nav }) {
  const r = state.result;
  if (!r) {
    queueMicrotask(() => nav.reset('home'));
    return { title: 'Resultado', content: [] };
  }
  const d = r.innerDiameterMm;
  const eq = equivalences(d);
  const [low, high] = rangeOf(eq.row);
  const size = sizeFor(d, state.system);
  const again = () => nav.reset(r.method === 'FINGER' ? 'finger' : 'prepare');

  return {
    title: 'Resultado de la medición',
    back: true,
    help: true,
    className: 'two-col',
    content: [
      h('div', { class: 'col' },
        h('section', { class: 'result-card', 'aria-live': 'polite', 'data-testid': 'result' },
          h('span', { class: 'eyebrow light' }, 'TALLA RECOMENDADA'),
          h('div', { class: 'result-size', 'data-testid': 'result-size' }, sizeNode(size.label, 'inline-size'), state.system === 'USA' ? ' USA' : ''),
          h('span', { 'data-testid': 'result-equivalence' }, `${eq.T} · ${eq.USA} USA · EU ${eq.EU}`)),
        choiceRow({ label: 'Mostrar en', options: ALL_SYSTEMS, selected: state.system, optionLabel: (s) => SYSTEM_LABEL[s], onSelect: (system) => store.set({ system }), testId: 'result-system' }),
        precisionNote(r)),
      h('div', { class: 'col' },
        card({},
          infoRow('Diámetro interior medido', `${twoDecimals(d)} mm`),
          infoRow('Circunferencia aproximada', `${oneDecimal(circumferenceFromDiameter(d))} mm`),
          infoRow('Talla en la tabla', `${eq.T} · Ø ${oneDecimal(eq.row.d)} mm`),
          infoRow('Diámetros de esta talla', `${twoDecimals(low)} – ${twoDecimals(high)} mm`),
          infoRow('Equivalencia USA', eq.USA),
          infoRow('Equivalencia EU / ISO', eq.EU),
          infoRow('Método', METHOD_LABEL[r.method]))),
    ],
    bottom: [
      h('div', { class: 'row-2' },
        secondaryButton('Guardar', () => store.set({ dialog: { mode: 'save', name: '', hand: Hand.RIGHT, finger: Finger.RING, error: null } })),
        secondaryButton('Compartir', () => share(store, { name: 'Mi talla', diameterMm: d, hand: Hand.RIGHT, finger: Finger.RING })),
      ),
      primaryButton('Volver a medir', again),
    ],
  };
}

/** Diálogo inferior (zona verde) para guardar, editar o eliminar una talla. */
export function dialog({ state, store }) {
  const d = state.dialog;
  const close = () => store.set({ dialog: null });
  if (d.mode === 'delete') {
    const item = state.saved.find((s) => s.id === d.id);
    return sheet('Eliminar talla', [h('p', {}, `¿Eliminar «${item?.name ?? ''}»? Esta acción no se puede deshacer.`)], [
      secondaryButton('Cancelar', close),
      primaryButton('Eliminar', () => store.removeSaved(d.id), { class: 'btn btn-primary danger' }),
    ]);
  }
  const input = h('input', { id: 'saved-name', class: 'text-input', maxlength: '40', value: d.name, placeholder: 'Ej.: Mi talla, Anillo de mi esposa', 'aria-invalid': d.error ? 'true' : 'false' });
  input.value = d.name;
  const keepName = (changes) => store.set({ dialog: { ...d, name: input.value, ...changes } });
  const submit = () => {
    const error = validateName(input.value);
    if (error) return keepName({ error });
    if (d.mode === 'edit') return store.updateSaved(d.id, { name: input.value.trim(), hand: d.hand, finger: d.finger });
    return store.addSaved(createSavedSize({ name: input.value, diameterMm: state.result.innerDiameterMm, system: state.system, hand: d.hand, finger: d.finger, method: state.result.method }));
  };
  return sheet(d.mode === 'edit' ? 'Editar talla' : 'Guardar talla', [
    h('label', { for: 'saved-name', class: 'field-label' }, 'Nombre'),
    input,
    d.error ? h('p', { class: 'field-error', role: 'alert' }, d.error) : null,
    choiceRow({ label: 'Mano', options: [Hand.RIGHT, Hand.LEFT], selected: d.hand, optionLabel: (x) => HAND_LABEL[x], onSelect: (hand) => keepName({ hand }), testId: 'dialog-hand' }),
    choiceRow({ label: 'Dedo', options: Object.values(Finger), selected: d.finger, optionLabel: (x) => FINGER_LABEL[x], onSelect: (finger) => keepName({ finger }), testId: 'dialog-finger' }),
  ], [secondaryButton('Cancelar', close), primaryButton('Guardar', submit)]);
}

function sheet(title, body, actions) {
  return h('div', { class: 'sheet-backdrop' },
    h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('h2', {}, title), ...body, h('div', { class: 'row-2 sheet-actions' }, actions)));
}

/** P5 – Convertidor (captura «Converter»), con las equivalencias de la tabla T1–T36. */
export function converterScreen({ state, store }) {
  const c = state.converter;
  const options = sizeOptions(c.from);
  const label = options.some((o) => o.label === c.label) ? c.label : options[13].label;
  const converted = convert(label, c.from, c.to);
  const select = (value, list, onChange, testId, aria) =>
    h('select', { class: 'select', 'data-testid': testId, 'aria-label': aria, onChange: (e) => onChange(e.target.value) },
      list.map(([v, text]) => h('option', { value: v, selected: v === value }, text)));
  const systems = ALL_SYSTEMS.map((s) => [s, SYSTEM_LABEL[s]]);
  return {
    title: 'Convertidor',
    align: 'bottom',
    className: 'narrow',
    content: [
      h('div', { 'data-testid': 'converter-result' }, sizeNode(converted.label)),
      h('div', { class: 'converter-pill' }, `${SYSTEM_LABEL[c.from]} ${label} → ${SYSTEM_LABEL[c.to]} ${converted.label} · Ø ${oneDecimal(converted.row.d)} mm`),
      h('p', { class: 'hint center' }, 'Elige la talla que quieres convertir'),
      h('div', { class: 'converter-size' }, select(label, options.map((o) => [o.label, o.label]), (v) => store.set({ converter: { ...c, label: v } }), 'converter-size', 'Talla de origen')),
      h('div', { class: 'converter-systems' },
        select(c.from, systems, (v) => store.set({ converter: { ...c, from: v, label: convert(label, c.from, v)?.label ?? label } }), 'converter-from', 'Sistema de origen'),
        h('button', { type: 'button', class: 'icon-btn swap-systems', 'aria-label': 'Intercambiar sistemas', onClick: () => store.set({ converter: { from: c.to, to: c.from, label: converted.label } }) }, '⇄'),
        select(c.to, systems, (v) => store.set({ converter: { ...c, to: v } }), 'converter-to', 'Sistema de destino'),
      ),
    ],
  };
}

/** P6 – Tallas guardadas (capturas «Collections» y «Share»). */
export function savedScreen({ state, store }) {
  if (state.saved.length === 0) {
    return { title: 'Tallas guardadas', align: 'center', content: [h('p', { class: 'hint center' }, 'Aún no has guardado tallas. Mide un anillo y pulsa «Guardar».')] };
  }
  const items = state.saved.map((s) => {
    const eq = equivalences(s.diameterMm);
    const menu = h('div', { class: 'menu', role: 'menu', hidden: true },
      h('button', { type: 'button', role: 'menuitem', onClick: () => share(store, s) }, 'Compartir'),
      h('button', { type: 'button', role: 'menuitem', onClick: () => store.set({ dialog: { mode: 'edit', id: s.id, name: s.name, hand: s.hand, finger: s.finger, error: null } }) }, 'Editar'),
      h('button', { type: 'button', role: 'menuitem', onClick: () => store.set({ dialog: { mode: 'delete', id: s.id } }) }, 'Eliminar'));
    const toggle = h('button', { type: 'button', class: 'icon-btn kebab', 'aria-label': `Opciones de ${s.name}`, 'aria-haspopup': 'menu', onClick: () => { menu.hidden = !menu.hidden; } }, '⋮');
    return h('article', { class: 'saved-card', 'data-testid': 'saved-card' },
      h('div', { class: 'saved-head' }, h('span', {}, s.name), toggle),
      sizeNode(eq.T),
      h('p', { class: 'saved-meta' }, `${eq.USA} USA · EU ${eq.EU} · ${HAND_LABEL[s.hand]} · ${FINGER_LABEL[s.finger]} · ${oneDecimal(s.diameterMm)} mm`),
      menu);
  });
  return { title: 'Tallas guardadas', className: 'grid-cards', content: items };
}
