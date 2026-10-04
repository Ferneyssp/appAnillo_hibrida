/** Prueba espejo: talla T/USA/EU para cada diámetro de 12,80 a 24,35 mm (paso 0,01). Igual que EquivalenceReport.kt. */
import { equivalences } from '../src/domain/sizing.js';
const lines = [];
for (let i = 1280; i <= 2435; i++) {
  const d = i / 100;
  const e = equivalences(d);
  lines.push(`${d.toFixed(2)};${e.T};${e.USA};${e.EU}`);
}
console.log(lines.join('\n'));
