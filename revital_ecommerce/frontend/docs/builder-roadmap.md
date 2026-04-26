# Builder Roadmap

## Estado actual

- La navegación del admin incluye la sección `Contenido` con:
  - `Barra Informativa`
  - `Builder`
- El constructor de contenido permite:
  - agregar secciones desde catálogo de bloques,
  - reordenar secciones con drag and drop,
  - editar contenido por campo (`text`, `number`, `image`),
  - editar estilo (alineación, márgenes, paddings, fondo),
  - ocultar/mostrar y eliminar secciones.
- La vista previa soporta dos modos:
  - composición editable,
  - sitio en vivo mediante `iframe`.

## Decisiones de arquitectura

- Se separó el builder en componentes modulares en `components/builder/*`.
- `create/page.tsx` quedó como contenedor liviano para evitar archivos monolíticos.
- Tipos y configuración del dominio viven en:
  - `components/builder/builder-types.ts`
  - `components/builder/builder-config.ts`
- Se mantuvo política de copy neutral en UI (sin etiquetas de versionado).

## Deuda técnica pendiente

- Persistencia real de estructura y propiedades en backend.
- Historial de cambios (undo/redo).
- Validaciones avanzadas por tipo de sección.
- Integración de subida de assets (imagen) con storage real.
- Guardado/publicación conectados a estado de sitio.

## Backlog priorizado

1. **Persistencia de página**
   - Guardar estructura en API.
   - Recuperar estructura al abrir el builder.
2. **Paridad de render con storefront**
   - Compartir renderer de secciones entre builder y homepage.
   - Reducir diferencia entre composición y sitio.
3. **Flujo editorial**
   - Borrador, revisión y publicación con estados.
   - Confirmaciones de cambios con feedback claro.
4. **Experiencia de edición**
   - Atajos de teclado.
   - Duplicar sección.
   - Bloquear sección para evitar cambios accidentales.

## Checklist de paridad visual

- [ ] Hero: tipografía, espaciados, CTA y fondo.
- [ ] Categorías: cantidad de columnas y comportamiento responsive.
- [ ] Grid de productos: estructura, densidad y jerarquía de información.
- [ ] Banner: color, contraste y copy.
- [ ] Carrusel: navegación, snapping y estados.
- [ ] Footer: enlaces, distribución y estilo.

## Estrategia de migración a renderer compartido

1. Definir contrato de datos único por sección.
2. Extraer renderer por sección en componentes reutilizables.
3. Consumir esos renderers en homepage y builder.
4. Mantener `iframe` como fallback temporal hasta paridad completa.
5. Retirar fallback cuando los bloques críticos estén alineados.
