### Programmatic SEO en Compralo (borrador inicial)

Este documento define patrones candidatos de programmatic SEO para `revital_ecommerce/frontend` y los requisitos mínimos para implementarlos sin generar contenido thin.

#### Contexto

- Catálogo con:
  - Categorías jerárquicas (categoría → línea → sublínea).
  - Marcas.
  - Atributos de producto (color, talla, etc.).
- Página de catálogo/búsqueda: `/products` con filtros por categoría, marca, atributos, precio y búsqueda por nombre.

#### Patrones candidatos

1. **Colecciones por categoría principal**
   - URL patrón: `/colecciones/{categoria-slug}`
   - Tipo: landing editorial para cada categoría raíz importante.
   - Contenido:
     - Introducción explicando la categoría.
     - Bloques destacados: subcategorías clave, marcas relevantes.
     - Listado curado de productos destacados (no todo el catálogo).
   - Datos necesarios:
     - Nombre/slug de categoría raíz.
     - Descripciones enriquecidas por categoría.
     - Selección editorial / reglas de negocio para productos destacados.
   - Indexación:
     - `index,follow` solo para categorías con suficiente demanda y contenido editorial propio.

2. **Colecciones por categoría x marca (solo high-signal)**
   - URL patrón: `/colecciones/{categoria-slug}/{marca-slug}`
   - Condiciones para crear:
     - Volumen de productos suficiente (p. ej. ≥ 15 productos).
     - Demanda de búsqueda detectada para combinaciones específicas (según keyword research).
   - Contenido:
     - Introducción específica para la combinación (no solo “productos de {marca} en {categoría}”).
     - Diferenciadores de la marca dentro de esa categoría.
   - Datos necesarios:
     - Series históricas de ventas o popularidad para priorizar combinaciones.
   - Indexación:
     - Solo indexar combinaciones con demanda validada.
     - Resto `noindex` o no generadas.

3. **Guías / contenido de ayuda indexable por tema**
   - Patrón más cercano hoy: `/blog` y `/ayuda`.
   - Futuro programmatic: plantillas de guías por “tema de compra” (ej. “cómo elegir {tipo de producto}”).
   - URL patrón: `/guias/{tema-slug}`
   - Contenido:
     - Bloques fijos (checklists, comparaciones).
     - Inserción contextual de productos/categorías relevantes (no predominante).
   - Datos necesarios:
     - Taxonomía de temas y mapeo a categorías/productos.

#### Feasibility Index (resumen)

- **Search Pattern Validity (0–20)**: 16/20
  - Hay patrones claros (categoría, categoría x marca, temas de ayuda), pero falta validación de demanda por combinación.
- **Unique Value per Page (0–25)**: 18/25
  - Es viable si se aporta texto editorial específico por categoría/colección. Riesgo de caer en plantillas vacías si se automatiza sin contenido adicional.
- **Data Availability & Quality (0–20)**: 15/20
  - Hay datos de catálogo suficientes; falta capa de datos editoriales (descripciones de categoría, reglas de curación).
- **Search Intent Alignment (0–15)**: 12/15
  - Intents transaccionales/informacionales claros, pero aún no se han definido SERPs objetivo por patrón.
- **Competitive Feasibility (0–10)**: 6/10
  - E‑commerce es espacio competitivo; programmatic ayuda, pero deberá acompañarse de contenido de calidad y performance.
- **Operational Sustainability (0–10)**: 7/10
  - Con una buena capa de configuración (YAML/DB para colecciones) es sostenible; sin ella, difícil de mantener.

**Score aproximado**: 74/100 → **Fair/Moderate Fit**  
→ Recomendado avanzar con **scope limitado** (colecciones prioritarias, no todo el espacio combinatorio).

#### Requisitos de datos por patrón

- **Colecciones por categoría**
  - Campos mínimos:
    - `title`, `slug`, `intro`, `body` (markdown/rich text).
    - `hero_image` opcional.
    - Lista curada de `product_ids` o reglas (`top_sellers`, `new_arrivals`).

- **Colecciones por categoría x marca**
  - Campos mínimos:
    - `category_id`, `brand_id`, `slug`.
    - `intro`, `body` específicos para la combinación.
    - Límite máximo de combinaciones por categoría/brand para evitar index bloat.

- **Guías temáticas**
  - Campos mínimos:
    - `topic_slug`, `title`, `intro`, `sections[]`.
    - Mapeo a categorías (`primary_category_id`, `related_category_ids[]`).

#### Reglas de indexación iniciales

- Home, categorías, listado `/products`, producto → `index,follow` (ya cubierto por metadatos).
- Secciones legales/informativas principales → `index,follow`.
- Carrito, checkout, seguimiento, resultado de pago → `noindex,follow` (ya aplicado en metadatos).
- Programmatic:
  - Indexar solo colecciones con:
    - Contenido editorial propio (no solo bloques de productos).
    - Demanda confirmada.
  - Mantener sitemaps segmentados por tipo de página (core vs colecciones).

