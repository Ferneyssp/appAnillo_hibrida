/**
 * Tabla oficial de tallas y equivalencias del proyecto (imagen «TALLAS Y EQUIVALENCIAS»,
 * Documentacion/img/referencia/tabla_tallas.jpg). Es la ÚNICA fuente de verdad de las tallas.
 * t = talla nacional (T), d = diámetro interior en mm, usa = equivalencia USA.
 * Igual a domain/SizeTable.kt de la app nativa.
 */
export const SIZE_TABLE = Object.freeze([
  { t: 1, d: 13.0, usa: '1' }, { t: 2, d: 13.4, usa: '2' }, { t: 3, d: 13.7, usa: '2½' },
  { t: 4, d: 14.0, usa: '3' }, { t: 5, d: 14.3, usa: '3½' }, { t: 6, d: 14.6, usa: '3¾' },
  { t: 7, d: 15.0, usa: '4' }, { t: 8, d: 15.3, usa: '4½' }, { t: 9, d: 15.6, usa: '5' },
  { t: 10, d: 15.9, usa: '5½' }, { t: 11, d: 16.2, usa: '5¾' }, { t: 12, d: 16.5, usa: '6' },
  { t: 13, d: 16.8, usa: '6½' }, { t: 14, d: 17.2, usa: '7' }, { t: 15, d: 17.5, usa: '7½' },
  { t: 16, d: 17.8, usa: '7¾' }, { t: 17, d: 18.1, usa: '8' }, { t: 18, d: 18.4, usa: '8½' },
  { t: 19, d: 18.8, usa: '8¾' }, { t: 20, d: 19.1, usa: '9' }, { t: 21, d: 19.4, usa: '9½' },
  { t: 22, d: 19.7, usa: '10' }, { t: 23, d: 20.0, usa: '10½' }, { t: 24, d: 20.3, usa: '10¾' },
  { t: 25, d: 20.6, usa: '11' }, { t: 26, d: 21.0, usa: '11½' }, { t: 27, d: 21.3, usa: '12' },
  { t: 28, d: 21.6, usa: '12½' }, { t: 29, d: 22.0, usa: '12¾' }, { t: 30, d: 22.3, usa: '13' },
  { t: 31, d: 22.6, usa: '13½' }, { t: 32, d: 22.9, usa: '13¾' }, { t: 33, d: 23.2, usa: '14' },
  { t: 34, d: 23.5, usa: '14½' }, { t: 35, d: 23.9, usa: '15' }, { t: 36, d: 24.2, usa: '15½' },
].map(Object.freeze));
