/** Utilidades para construir DOM de forma declarativa y componentes reutilizables. */

/**
 * h('button', { class: 'x', onClick: fn }, 'Texto', otroNodo)
 * Las claves "on*" registran eventos; las demás se asignan como atributos.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'html') {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** Acción principal: ancho completo en la barra inferior (zona verde). */
export const primaryButton = (text, onClick, attrs = {}) =>
  h('button', { type: 'button', class: 'btn btn-primary', 'data-thumb': text, onClick, ...attrs }, text);

export const secondaryButton = (text, onClick, attrs = {}) =>
  h('button', { type: 'button', class: 'btn btn-secondary', 'data-thumb': text, onClick, ...attrs }, text);

export const linkButton = (text, onClick) =>
  h('button', { type: 'button', class: 'btn btn-link', 'data-thumb': text, onClick }, text);

/** Grupo de opciones tipo "segmented button" accesible como radiogroup. */
export function choiceRow({ label, options, selected, optionLabel, onSelect, thumbLabel, testId }) {
  const labelId = `lbl-${Math.random().toString(36).slice(2, 8)}`;
  return h(
    'div',
    { class: 'choice' },
    h('span', { class: 'choice-label', id: labelId }, label),
    h(
      'div',
      { class: 'choice-row', role: 'radiogroup', 'aria-labelledby': labelId, 'data-thumb': thumbLabel, 'data-testid': testId },
      options.map((option) =>
        h(
          'button',
          {
            type: 'button',
            role: 'radio',
            class: `choice-option${option === selected ? ' selected' : ''}`,
            'aria-checked': option === selected ? 'true' : 'false',
            onClick: () => onSelect(option),
          },
          optionLabel(option),
        ),
      ),
    ),
  );
}

export const infoRow = (label, value) =>
  h('div', { class: 'info-row' }, h('span', { class: 'info-label' }, label), h('span', { class: 'info-value' }, value));

export const card = (attrs, ...children) => h('section', { ...attrs, class: `card ${attrs?.class ?? ''}` }, ...children);

/** Texto con saltos de línea "\n" convertidos en párrafos/viñetas legibles. */
export const multiline = (text) => h('p', { class: 'multiline' }, text);

const FRACTIONS = { '¼': '1/4', '½': '1/2', '¾': '3/4' };

/** Talla con fracción como superíndice, como en la tabla («7 ½ USA»). */
export function sizeNode(label, cls = 'big-size') {
  const match = /^(.*?)([¼½¾])$/.exec(label);
  return h('div', { class: cls }, match ? [match[1], h('sup', {}, FRACTIONS[match[2]])] : label);
}
