// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  compressHTML: true,
  build: {
    // Inline todo o CSS no <head> para eliminar requests render-blocking de
    // stylesheet — o first paint não espera nenhum recurso de rede além do HTML.
    inlineStylesheets: 'always',
  },
});
