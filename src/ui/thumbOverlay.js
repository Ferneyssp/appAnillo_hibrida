import { classify, easyRadius, Hand, naturalRadius, ThumbZone } from '../domain/thumbZone.js';
import { h } from './components.js';
import { t } from './messages.js';

const COLORS = {
  [ThumbZone.EASY]: '21, 128, 61',
  [ThumbZone.NATURAL]: '234, 179, 8',
  [ThumbZone.HARD]: '220, 38, 38',
};

/** Pinta las tres zonas con el mismo modelo radial del dominio. */
function paintZones(canvas, width, height, hand) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  const pivotX = hand === Hand.RIGHT ? width : 0;
  const circle = (radius) => {
    ctx.beginPath();
    ctx.arc(pivotX, height, radius, 0, Math.PI * 2);
  };
  const alpha = 0.22;

  ctx.fillStyle = `rgba(${COLORS.HARD}, ${alpha})`;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'destination-out';
  circle(naturalRadius(width));
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(${COLORS.NATURAL}, ${alpha})`;
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  circle(easyRadius(width));
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(${COLORS.EASY}, ${alpha})`;
  ctx.fill();
}

/**
 * Analiza los controles marcados con data-thumb usando su posición REAL en pantalla
 * (getBoundingClientRect) y devuelve su zona. Lo usa la superposición y las pruebas E2E.
 */
export function analyzeTargets(frame, hand) {
  const frameRect = frame.getBoundingClientRect();
  const contentRect = frame.querySelector('.content')?.getBoundingClientRect();
  return [...frame.querySelectorAll('[data-thumb]')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      const rect = { left: r.left - frameRect.left, top: r.top - frameRect.top, width: r.width, height: r.height };
      // Un control dentro del área desplazable solo es visible si su centro está dentro de ella.
      const clip = el.closest('.content') && contentRect ? contentRect : frameRect;
      const centerY = r.top + r.height / 2;
      const visible = r.width > 0 && r.height > 0 && centerY > clip.top && centerY < clip.bottom;
      const zone = classify(rect.left + rect.width / 2, rect.top + rect.height / 2, frameRect.width, frameRect.height, hand);
      return { label: el.dataset.thumb, rect, zone, visible };
    })
    .filter((target) => target.visible);
}

/** Crea/actualiza la capa "Ver Thumb Zone". No bloquea los toques (pointer-events: none). */
export function mountThumbOverlay(frame, { hand, onHide }) {
  const canvas = h('canvas', { class: 'thumb-canvas', 'aria-hidden': 'true' });
  const labels = h('div', { class: 'thumb-labels', 'aria-hidden': 'true' });
  const hide = h('button', { type: 'button', class: 'thumb-hide', onClick: onHide }, t.hideZones);
  const overlay = h('div', { class: 'thumb-overlay', 'data-testid': 'thumb-overlay' }, canvas, labels, hide);
  frame.append(overlay);

  const update = () => {
    const { width, height } = frame.getBoundingClientRect();
    paintZones(canvas, width, height, hand);
    labels.replaceChildren(
      ...analyzeTargets(frame, hand).map(({ label, rect, zone }) =>
        h(
          'div',
          {
            class: `thumb-target zone-${zone.toLowerCase()}${rect.top < 20 ? ' label-below' : ''}`,
            'data-zone': zone,
            style: `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`,
          },
          h('span', {}, `${label} · ${t.zoneShort[zone]}`),
        ),
      ),
    );
  };

  let frameRequest = 0;
  const schedule = () => {
    cancelAnimationFrame(frameRequest);
    frameRequest = requestAnimationFrame(update);
  };
  const scroller = frame.querySelector('.content');
  scroller?.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();

  return () => {
    cancelAnimationFrame(frameRequest);
    scroller?.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    overlay.remove();
  };
}
