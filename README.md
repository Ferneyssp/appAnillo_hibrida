# Aplicación híbrida Web/Android — Medidor de Anillo

HTML · CSS adaptable · JavaScript (módulos ES) · Vite 8 · Capacitor 8.

## Requisitos
Node.js 22+ · navegador moderno · para el APK: Android Studio 2025.1+ con JDK 21 y SDK 36.

## Ejecutar en el navegador
```bash
npm install
npm run dev                        # http://localhost:5173
npm run build && npm run preview   # versión de producción: http://localhost:4173
```
La primera vez la app pide **calibrar la pantalla** con una tarjeta (en la web el píxel CSS no es una medida física). Se puede recalibrar desde el medidor.

## Tallas
`src/domain/sizeTable.js` contiene la tabla oficial T1–T36 (Ø mm y USA) y es la única fuente de las tallas. `sizing.js` asigna la fila de Ø más cercano (empate → la mayor), calcula EU = round(Ø·π), rangos, flechas y el convertidor. Es idéntico a `SizeTable.kt`/`Sizing.kt` de la app nativa (`node scripts/equivalencia.mjs` genera la salida para la prueba espejo).

## Pantallas adaptables
Funciona de 320 px a 2560 px de ancho, en vertical y horizontal: una columna en teléfono, dos columnas desde 700 px, cabecera y barra compactas en horizontal, sin desplazamiento horizontal. El círculo siempre se dibuja a tamaño real (Ø × px/mm).

## Pruebas
```bash
npm test                           # 14 pruebas unitarias (Vitest): tabla y tallas, calibración, guardadas
npx playwright install chromium    # primera vez
npm run test:e2e                   # Pruebas E2E: funcionales y adaptabilidad (8 tamaños)
```
`PW_CHROMIUM=/ruta/a/chrome npm run test:e2e` usa un Chromium ya instalado. `node scripts/capturas.mjs` (con `npm run preview` activo) regenera las capturas de la documentación.

## Generar la app Android
```bash
npm run build
npx cap sync android
npx cap open android               # Android Studio › Build › Build APK(s)
# o: npm run android:apk  → android/app/build/outputs/apk/debug/app-debug.apk
```

## Estructura
```text
src/domain/          sizeTable, sizing, calibration, savedSizes, format
src/state/store.js   estado (equivalente al ViewModel)
src/ui/              router, components, messages, illustrations, share, screens/
src/styles/main.css  estilos adaptables
tests/               unit/ (Vitest), e2e/ (Playwright: funcional, adaptable)
scripts/             capturas.mjs, equivalencia.mjs
android/             proyecto Android generado por Capacitor
```

Documentación: [`../Documentacion`](../Documentacion).
