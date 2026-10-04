import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: necesario para cargar los archivos desde el WebView de Capacitor.
  base: './',
  build: { outDir: 'dist', target: 'es2020' },
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
  },
});
