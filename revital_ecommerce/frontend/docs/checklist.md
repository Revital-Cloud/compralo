### Checklist rápida SEO para nuevas rutas (frontend e‑commerce)

Usa esta lista cada vez que añadas/modifiques una página en `app/(shop)`:

1. **Metadatos básicos**
   - [ ] La página exporta `metadata` o `generateMetadata`.
   - [ ] Title:
     - [ ] Es único y describe claramente el contenido/intent.
     - [ ] Usa el patrón de marca (`%s | Compralo`) cuando aplique.
   - [ ] Meta description:
     - [ ] Resume la página en 1–2 frases orientadas a clic (sin keyword stuffing).

2. **Open Graph / Twitter**
   - [ ] `openGraph` se construye con `buildOpenGraph` (o hereda de root de forma razonable).
   - [ ] `twitter` se construye con `buildTwitter`.
   - [ ] Para páginas clave (home, categorías, producto):
     - [ ] Hay una imagen OG adecuada (por defecto `/api/og` o imagen específica).

3. **Canonicals y rutas**
   - [ ] La URL canónica implícita es correcta (o se ha configurado explícitamente con `buildCanonical` si hay parámetros).
   - [ ] No se crean múltiples URLs indexables para el mismo contenido (especial cuidado con parámetros de filtros/búsqueda).

4. **Robots / indexación**
   - [ ] Para páginas transaccionales sensibles (carrito, checkout, resultado de pago, seguimiento):
     - [ ] `robots` en metadata marca `index: false` cuando corresponda.
   - [ ] Para páginas informativas/legales importantes (privacidad, términos, cookies, accesibilidad):
     - [ ] `robots` permite `index,follow` (explícito o por defecto).

5. **Contenido y headings**
   - [ ] La página tiene un `h1` claro y único.
   - [ ] El contenido responde al intent esperado (transaccional, informacional, ayuda, etc.).

6. **JSON‑LD (schema.org)**
   - [ ] Para product detail (`/products/[id]`):
     - [ ] Existe un bloque `Product` mínimo viable con nombre, imágenes, precio y disponibilidad.
   - [ ] No se introducen bloques JSON‑LD vacíos o con datos obviously dummy para páginas nuevas.

7. **Performance y DX**
   - [ ] No se han añadido cargas innecesarias en `<head>` (scripts, fuentes) que afecten LCP.
   - [ ] Se reutilizan helpers de `lib/seo.ts` siempre que sea posible.

