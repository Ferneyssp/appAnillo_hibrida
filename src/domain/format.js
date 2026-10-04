/**
 * Formato numérico en español (coma decimal). Implementación manual idéntica a
 * DecimalFormatter.kt para que ambas apps muestren exactamente los mismos números.
 */
function fixed(value, decimals) {
  const factor = decimals === 1 ? 10 : 100;
  const scaled = Math.floor(Math.abs(value) * factor + 0.5);
  const integerPart = Math.floor(scaled / factor);
  const decimalPart = String(scaled % factor).padStart(decimals, '0');
  const sign = value < 0 && scaled !== 0 ? '-' : '';
  return `${sign}${integerPart},${decimalPart}`;
}

/** 17.3249 -> "17,32" */
export const twoDecimals = (value) => fixed(value, 2);

/** 54.41 -> "54,4" */
export const oneDecimal = (value) => fixed(value, 1);

/** 54 -> "54", 17.30 -> "17,3" */
export const compact = (value) => twoDecimals(value).replace(/0+$/, '').replace(/,$/, '');

/** 7 -> "7", 7.5 -> "7½" */
export function sizeNumber(value) {
  const whole = Math.floor(value);
  return value - whole >= 0.5 ? `${whole}½` : String(whole);
}
