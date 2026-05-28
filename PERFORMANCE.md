# Regras de Performance para Páginas (FCP < 1s)

Guia prático para criar páginas (white / landing) com carregamento rápido.
Stack: **Astro estático** servido via **proxy reverso no Cloudflare Worker (shield)**.

> **Princípio central:** o navegador não pinta **nada** até resolver todos os
> recursos *render-blocking* do `<head>`. O First Contentful Paint (FCP) é, na
> prática, `TTFB + download/parse dos recursos bloqueantes`. A meta é deixar
> **só o HTML** no caminho crítico — nenhum CSS, fonte ou script de rede antes
> do primeiro paint.

---

## 1. Fontes — o maior vilão de FCP

- **NUNCA** use `<link rel="stylesheet" href="fonts.googleapis.com/...">`. É um
  stylesheet de terceiro que bloqueia o render (DNS + TLS + download em outro
  domínio, mesmo com `preconnect`).
- **Self-hospede** com Fontsource. Prefira a **fonte variável** — um único
  arquivo cobre todos os pesos:
  ```bash
  npm i @fontsource-variable/<fonte>
  ```
  ```astro
  ---
  import '@fontsource-variable/outfit';
  ---
  ```
- Use a família correta no CSS (ex.: `'Outfit Variable'`) com fallback de
  sistema, para o primeiro paint não esperar fonte nenhuma:
  ```css
  --font-sans: 'Outfit Variable', system-ui, -apple-system, sans-serif;
  ```
- Garanta `font-display: swap` (o Fontsource já traz). O texto aparece na hora
  com a fonte do sistema e troca pela web font quando ela chega.
- **Carregue só o que usa.** Não importe famílias que estão apenas como fallback
  no stack (elas nunca renderizam). Não baixe 6 pesos se a fonte é variável.

## 2. CSS — sempre inline

- No `astro.config.mjs`:
  ```js
  export default defineConfig({
    output: 'static',
    compressHTML: true,
    build: { inlineStylesheets: 'always' },
  });
  ```
- `inlineStylesheets: 'always'` embute o CSS no `<style>` do `<head>`, eliminando
  o request render-blocking do `.css` externo. Para página única, é sempre vantajoso.

## 3. Zero render-blocking no `<head>`

- Sem `<link rel="stylesheet">` externo. Sem `<script>` síncrono no `<head>`.
- Scripts só com `defer`/`async`, ou no fim do `<body>`. Numa landing, idealmente
  **sem JS** (ou mínimo).
- `preconnect`/`preload` **apenas** para um recurso de terceiro que você realmente
  usa e está no caminho crítico. Se não há terceiro, não há preconnect.

## 4. Imagens

- Sempre `width` e `height` explícitos (evita CLS).
- Formatos modernos: **WebP/AVIF**. Use `<Image />` do Astro quando possível.
- Abaixo da dobra: `loading="lazy"`. Imagem do LCP (herói): `loading="eager"` +
  `fetchpriority="high"`, **sem** lazy.
- Comprima/redimensione — nada de PNG de 2MB.

## 5. JavaScript

- Landing não precisa de framework client-side. Evite `client:load` no Astro;
  prefira HTML/CSS puro. Use `client:visible`/`client:idle` só se for inevitável.
- Nada de jQuery, libs de animação pesadas, sliders gigantes. CSS resolve a
  maioria das animações (`@keyframes`, `transition`).

## 6. HTML enxuto

- Mantenha o HTML pequeno (alvo < 30KB). Quanto menor, mais rápido chega e pinta.
- Evite blocos de SVG inline gigantes repetidos; reuse via `<use>` ou componente.

## 7. Proxy / Worker (cache de borda)

- O shield worker cacheia na borda da Cloudflare os **assets** (`/_astro/*`,
  fontes, imagens) e a **página safe**, eliminando o hop até a origem no TTFB.
- Para o cache funcionar bem, **mantenha nomes de arquivo com hash de conteúdo**
  (padrão do Astro em `/_astro/`). Não use `?v=` para cache-busting.
- A página real (lead) recebe telemetria por sessão e **não** é cacheada — isso
  é esperado.

## 8. Checklist antes de publicar

- [ ] `astro.config.mjs` com `output: 'static'`, `compressHTML: true`,
      `inlineStylesheets: 'always'`.
- [ ] Nenhuma referência a `fonts.googleapis.com` / `fonts.gstatic.com` no build
      (`dist/index.html`).
- [ ] Nenhum `<link rel="stylesheet">` externo no `<head>` do build.
- [ ] Fonte self-hosted em `/_astro/*.woff2` com `font-display: swap`.
- [ ] Imagens com dimensões, lazy abaixo da dobra, LCP com `fetchpriority="high"`.
- [ ] Medir no **PageSpeed Insights / Lighthouse em modo Mobile** (throttled) —
      é onde o FCP aperta.

---

### Como conferir o build rapidamente

```bash
npm run build
# procurar por terceiros e stylesheets externos no HTML gerado:
grep -i "googleapis\|gstatic\|rel=.stylesheet" dist/index.html   # deve não achar nada
```
