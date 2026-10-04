/** Ilustración de la preparación: anillo apoyado sobre el círculo de la pantalla. */
export const screenMethodSvg = `
<svg viewBox="0 0 320 200" role="img" aria-label="Anillo apoyado sobre la pantalla del teléfono" class="illustration">
  <rect x="90" y="8" width="140" height="184" rx="18" fill="#fff" stroke="#1c1a17" stroke-width="4"/>
  <g stroke="#e8e0d2" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<line x1="100" y1="${30 + i * 12}" x2="220" y2="${30 + i * 12}"/>`).join('')}</g>
  <circle cx="160" cy="92" r="30" fill="none" stroke="#c9a464" stroke-width="3" stroke-dasharray="5 4"/>
  <circle cx="160" cy="92" r="36" fill="none" stroke="#b08d57" stroke-width="12" opacity="0.85"/>
  <rect x="110" y="150" width="100" height="4" rx="2" fill="#d9cfbf"/><circle cx="160" cy="152" r="8" fill="#1c1a17"/>
</svg>`;
