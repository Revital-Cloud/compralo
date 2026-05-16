# Roadmap Revital — Cierre V1

**Fecha de creación:** 2026-05-16
**Plazo objetivo:** 2026-06-30 (~6 semanas)
**Estado del proyecto:** V1.0 en fase de testing/QA con instancias piloto
**Arquitectura:** **single-tenant** (una instancia aislada por cliente, no multi-tenant)

---

## Resumen ejecutivo

Este documento define el plan para cerrar V1 de Revital con las siguientes mejoras prioritarias:

1. Limpieza de la narrativa multi-tenant heredada en código y docs.
2. Test scaffolding (frontend desde 0) y ampliación de cobertura backend.
3. Shipping completo: guía Envia + factura comercial + email + visualización en admin.
4. Factura electrónica para Colombia (vía proveedor autorizado DIAN).
5. CMS Builder completo: theme global con tokens + editor de páginas (blog, legales) + templates + overrides por sección.
6. Quick wins V1 (si hay margen): checkout invitado, Sentry, JSON-LD productos, audit log admin, 2FA admin.

Mejoras de mayor alcance (más métodos de pago, multi-bodega, PWA, multi-idioma, modularización de servicios grandes, etc.) quedan capturadas en el backlog post-V1 al final del documento.

---

## Fase 0 — Limpieza previa (semana 1, ~2-3 días)

**Bloqueador conceptual: el código habla de multi-tenant pero la arquitectura es single-tenant por instancia.**

### Tareas

- [ ] Eliminar `revital_ecommerce/backend/app/core/tenant.py` o reescribir como `instance_config.py` para un único cliente.
- [ ] Mover credenciales Wompi/Cloudinary/Resend de "tenant config" a `settings` directo (`core/config.py`).
- [ ] Reemplazar `datetime.utcnow()` por `datetime.now(timezone.utc)` en `core/circuit_breaker.py` (Python 3.13 lo marca como deprecado).
- [ ] Actualizar docs para narrativa single-tenant:
  - `README.md`
  - `CLAUDE.md`
  - `docs/MANUAL_TECNICO.md`
  - `docs/REVITAL_ARQUITECTURA_Y_INTEGRACIONES.md`
  - `docs/SRS_REVITAL_IEEE830.md`
- [ ] Eliminar o renombrar `docs/PANEL_ECOMMERCE_PROVISIONING.md` (referencia a feature no existente).

### Definition of done

- `grep -r "multi-tenant\|multi tenant\|tenant config" .` no devuelve resultados activos en código.
- Docs reflejan que cada cliente = un deployment independiente.

---

## Fase 1 — Test scaffolding (semana 1-2, paralelizable con Fase 0)

### Frontend (desde 0)

Stack propuesto:

- **Vitest** + Testing Library → tests unit/component.
- **Playwright** → tests E2E.

Tests prioritarios para V1:

- [ ] **Cart**: agregar/quitar items, persistencia localStorage, migración tras login, cálculo de totales con descuentos.
- [ ] **Checkout**: paso info, paso shipping (rates Envia), paso pago (Wompi widget mockeado).
- [ ] **Auth**: registro (validación + CAPTCHA), login, refresh token, logout.
- [ ] **Productos**: listado con filtros, búsqueda lexical + semántica fallback, favoritos.
- [ ] **Admin**: CRUD producto (happy path), creación de orden manual.

### Backend (ampliar)

Cobertura actual: 10 archivos (pagos, AI, security). Subir a ~25 cubriendo:

- [ ] `cart_product_router` — flujos anónimos y autenticados, merge al login.
- [ ] `order_router` — flujo completo de checkout incluyendo `fun_create_order_from_checkout_ref`.
- [ ] `product_router` — CRUD admin + filtros públicos.
- [ ] `auth_router` — registro, login, lockout, refresh, OTP.
- [ ] `email_router` + `email_service` — con mocks Resend.

### Definition of done

- `pnpm test` y `pnpm test:e2e` corren verde en CI.
- Coverage backend ≥ 60% en módulos críticos (cart, orders, auth).
- CI bloquea PRs si tests fallan.

---

## Fase 2 — Shipping completo (semana 2-3)

Estado actual: integración Envia funciona (rates + webhook), faltan documentos y visualización.

### Tareas

- [ ] **Guía Envia (etiqueta PDF)**:
  - Completar `services/shipping_service.py` para descargar el PDF que retorna Envia (`ENVIA_PRINT_FORMAT=PDF`, `ENVIA_PRINT_SIZE=STOCK_4X6`).
  - Manejar fallbacks Servientrega (config ya prevista en `ENVIA_PRINT_SIZE_SERVIENTREGA`).
  - Guardar URL del PDF (o blob en Cloudinary) en la orden.

- [ ] **Factura comercial (PDF interno separado de la guía)**:
  - Endpoint `/admin/orders/{id}/invoice.pdf` genera PDF con: datos empresa, datos cliente, items, IVA desglosado, totales, método de pago.
  - Stack sugerido: WeasyPrint (HTML→PDF, Python puro) o Playwright PDF.
  - Plantilla reutilizable bajo `templates/invoices/`.

- [ ] **Email al cliente**:
  - Extender `email_service.py` para adjuntar guía + factura comercial en el email de confirmación de orden pagada.
  - Template Resend con CTA "Descarga tu factura" + "Rastrea tu envío".

- [ ] **Visualización admin**:
  - En `/admin/orders/[id]`: mostrar estado del envío (pulled del webhook Envia), botones de descarga para guía y factura, tracking number con link al carrier.

### Definition of done

- Cliente recibe email con guía + factura adjuntas al confirmarse el pago.
- Admin puede descargar ambos PDFs y ver tracking actualizado.
- Webhook Envia actualiza estado en tiempo real.

---

## Fase 3 — Factura electrónica Colombia (semana 3-5) ⚠️ Riesgo alto

### Decisión técnica

Proveedor más sencillo y rápido de integrar: **Alegra** (DIAN-autorizado, REST API, planes desde ~$30 USD/mes con facturación electrónica incluida).

Alternativas evaluadas:
- **Facturapi**: similar pero presencia Colombia más reciente.
- **Siigo**: más enterprise, integración más compleja.
- **DIAN directo**: descartado para V1 (semanas solo en certificación + XML UBL 2.1 + firma digital).

### ⚠️ Pre-requisito legal NO técnico

Cada cliente piloto debe estar habilitado por DIAN como facturador electrónico:

- RUT con responsabilidad de facturación electrónica.
- Resolución DIAN de numeración para facturas electrónicas.
- Habilitación en el ambiente de producción DIAN.

**Acción inmediata: confirmar status DIAN de los clientes piloto antes del 2026-05-23. Si no están habilitados, esto puede atrasar la Fase 3 semanas.**

### Tareas

- [ ] Investigación + decisión final de proveedor (2 días, semana 3).
- [ ] Cuenta y credenciales del proveedor en sandbox.
- [ ] `services/electronic_invoice_service.py`:
  - Mapeo orden Revital → payload del proveedor.
  - Cliente HTTP con retry + circuit breaker.
  - Manejo de errores DIAN (numeración agotada, validación fallida, items inválidos).
- [ ] Disparar generación al confirmarse pago Wompi (extender `payment_widget_service.py`).
- [ ] Persistir en la orden: CUFE, número de factura electrónica, fecha emisión, URL del XML, URL del PDF representación gráfica.
- [ ] Email al cliente con factura electrónica adjunta (separada del email de envío).
- [ ] Admin: ver/descargar XML + PDF, reenviar manualmente si falla.

### Definition of done

- Orden pagada genera factura electrónica válida ante DIAN.
- Cliente recibe email con XML + PDF (cumplimiento DIAN).
- Admin puede ver el CUFE y descargar documentos.
- Fallos de generación quedan logueados y reintentables manualmente.

---

## Fase 4 — CMS Builder full (semana 2-6, paralelo con Fases 2 y 3)

Es el ítem más grande del roadmap. Dividido en 4 sub-fases.

### 4.1 Theme global (semana 2-3)

- [ ] Esquema en DB: `tab_theme_config` con campos para logo, paleta de colores (primary, secondary, accent, background, foreground, etc.), tipografías (heading, body), espaciados base, border radius.
- [ ] Endpoint `/admin/theme` (GET/PATCH) en backend.
- [ ] Sistema de tokens en frontend:
  - CSS variables generadas server-side desde el theme en `app/layout.tsx`.
  - Refactor de hardcodes de color en componentes a usar variables (`var(--color-primary)` vs `text-blue-600`).
- [ ] Editor en `/admin/builder/theme`:
  - Color pickers para cada token.
  - Upload de logo (Cloudinary).
  - Selector de tipografías (Google Fonts preview).
  - Preview en vivo en iframe.

### 4.2 Editor de páginas estáticas (semana 3-4)

- [ ] Modelo `tab_pages` (slug, title, blocks JSON, SEO meta, published_at).
- [ ] Migrar páginas hardcoded a páginas editables:
  - Blog (lista + posts)
  - Política de privacidad
  - Términos y condiciones
  - Sobre nosotros
  - Contacto
  - Política de devoluciones
- [ ] Editor rich-text por bloque (TipTap recomendado).
- [ ] Campos SEO por página: title, description, OG image.
- [ ] Renderizado dinámico en frontend desde DB en lugar de archivos `.tsx` estáticos.

### 4.3 Sistema de templates desbloqueado (semana 4-5)

- [ ] Quitar overlays "Próximamente" de Nueva Página + Templates.
- [ ] Templates predefinidos:
  - Landing page
  - Blog post
  - Página informativa
  - Página de categoría/colección custom
- [ ] CRUD de páginas (crear, duplicar, eliminar, publicar/despublicar).
- [ ] Routing dinámico desde slug en DB.

### 4.4 Overrides por sección (semana 5-6)

- [ ] Cada sección puede sobrescribir tokens del theme global.
- [ ] UI clara: "Heredado del tema" vs "Personalizado" con badge.
- [ ] Botón "Resetear al tema global" por token.
- [ ] **Esta sub-fase es la primera candidata a cortarse a V1.1 si el plazo aprieta.**

### Definition of done

- Admin puede cambiar logo, colores y tipografías del sitio completo desde el panel.
- Admin puede crear y editar páginas (blog, legales, custom) sin tocar código.
- Cualquier cambio en el theme se refleja en todo el sitio (no solo home).
- Templates funcionales (al menos 2 desbloqueados).

---

## Fase 5 — QA & polish (semana 6)

- [ ] Tests E2E completos por instancia piloto (Playwright en CI).
- [ ] Performance: mover catálogo y home a SSR donde sea posible (actualmente 78/217 componentes son `"use client"`).
- [ ] Audit accesibilidad rápido con `axe-core`:
  - ARIA labels en badges custom, cart count, theme toggle.
  - Contraste en dark mode.
  - Navegación por teclado en filtros y modales.
- [ ] Debounce en búsqueda semántica (actualmente cada keystroke pega el backend).
- [ ] Completar TODO de checkout (`checkout/page.tsx:~280`): UI condicional para "último pago falló".

---

## Fase 6 — Quick wins V1 (semana 6, si hay margen)

Cinco mejoras de bajo esfuerzo y alto impacto que pueden caber en el plazo si las fases anteriores no se atrasan.

- [ ] **Checkout invitado**: permitir comprar sin registrarse (crear cuenta opcional post-pago). Reduce abandono ~20-30%.
- [ ] **Sentry frontend + backend**: tracking de errores en producción. ~1 día de setup, salva incidentes en pilotos.
- [ ] **JSON-LD Schema.org en productos**: rich snippets en Google (precio, stock, rating). ~1 día.
- [ ] **Audit log admin**: registrar quién hizo qué cambio (productos, precios, órdenes, theme). Tabla `tab_audit_log` + middleware.
- [ ] **2FA admin** (TOTP): segundo factor obligatorio para usuarios con rol admin. Librería `pyotp` + QR code en perfil.

### Definition of done

- Las 5 features están en producción y verificadas por al menos un cliente piloto.
- Si alguna no llega, pasa a primer item del backlog post-V1.

---

## Riesgos a vigilar

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|:------------:|:-------:|-----------|
| 1 | Cliente piloto sin habilitación DIAN | Alta | Bloquea Fase 3 | Confirmar status antes del 2026-05-23 |
| 2 | CMS Builder full no termina | Media | Cortar 4.4 (overrides) a V1.1 | Re-evaluar al final de semana 4 |
| 3 | Tests + features en paralelo es difícil | Alta | Cobertura V1 baja | Tests solo para flujos críticos; ampliar en V1.1 |
| 4 | Migración páginas hardcoded → DB introduce regresiones SEO | Media | Pérdida de tráfico orgánico | Mantener URLs y meta tags exactos; redirects si cambian slugs |
| 5 | Proveedor factura electrónica con rate limits inesperados | Baja | Demora generación | Circuit breaker + cola con reintentos |

---

## Cronograma resumido

| Semana | Fechas | Foco |
|--------|--------|------|
| 1 | 19-25 mayo | Fase 0 (limpieza) + Fase 1 (test scaffold) |
| 2 | 26 mayo - 1 jun | Fase 2 (shipping) + Fase 4.1 (theme global) + tests |
| 3 | 2-8 jun | Fase 2 (cierre) + Fase 4.2 (páginas) + Fase 3 (decisión proveedor) |
| 4 | 9-15 jun | Fase 3 (factura electrónica integración) + Fase 4.3 (templates) |
| 5 | 16-22 jun | Fase 3 (cierre) + Fase 4.4 (overrides, si llega) |
| 6 | 23-29 jun | Fase 5 (QA & polish) + Fase 6 (quick wins) + freeze |
| 7 | 30 jun | Release V1 |

---

## Backlog post-V1

Mejoras identificadas pero fuera del cierre V1. Se priorizarán según feedback de pilotos.

### Conversión y UX

- Más métodos de pago en Wompi: PSE, Nequi, Bancolombia transfer, Daviplata.
- Apple Pay / Google Pay vía Wompi para mobile.
- Address autocomplete con Google Places API en checkout.
- Recently viewed products.
- "También te puede gustar" (recomendaciones con embeddings ya integrados).
- Reviews con fotos en productos (ampliar `comentary_router`).
- Q&A en productos (preguntas de clientes).
- Wishlist compartible por link público.
- Stock urgency ("Solo quedan 3 disponibles").
- Social proof ("12 personas vieron esto").
- Exit intent popup con descuento.
- WhatsApp Business button flotante + carrito por WhatsApp.

### Marketing y crecimiento

- SEO técnico: sitemap dinámico, Open Graph automático por producto, breadcrumbs Schema.org.
- Cupones avanzados: códigos, BOGO, free shipping threshold, descuento primera compra.
- Programa de referidos integrado con el sistema de puntos existente.
- Email marketing: campañas masivas con Resend Audiences (no solo transaccionales).
- Newsletter signup con doble opt-in.
- Pixel tracking: Meta Pixel, TikTok Pixel, Google Ads conversion tracking.
- Google Analytics 4 + Google Tag Manager integrados.

### Mobile

- PWA instalable con offline mode para catálogo.
- App móvil con Expo (clarificar plan — hay carpeta `/docs/expose/`).
- Notificaciones push web (orden enviada, oferta nueva, carrito abandonado).

### Operaciones admin

- Import masivo de productos vía Excel/CSV.
- Bulk update de precios y stock (con preview de cambios).
- Multi-bodega (stock por ubicación).
- Workflow de devoluciones/RMA completo (ampliar `exchange_router`).
- Pre-orders y backorders.
- Suscripciones / productos recurrentes.
- Dashboard de alertas de stock bajo (visualizar lo que ya envía `out_of_stock_notification_service`).

### Analytics avanzados

- Customer LTV (lifetime value).
- Cohort analysis (retención).
- Funnel de conversión (visitas → carrito → checkout → pago).
- Heatmaps con Microsoft Clarity (gratis) o Hotjar.
- A/B testing framework (Vercel Flags ya está como skill disponible).

### Seguridad y compliance

- GDPR / Ley 1581 Colombia: data export + deletion endpoints autoservicio para el cliente final.
- Backup automatizado verificado (probar restores periódicamente).
- WAF tuning (Cloudflare ya está, falta afinar rules).
- Rotación automática de secrets en CI.

### Performance

- ISR / on-demand revalidation para catálogo en Next.js.
- `next/image` correctamente configurado con Cloudinary loader.
- Revisión de índices en DB, especialmente para filtros de productos.
- Redis para sesiones, rate limiting y cache de productos top.
- Migrar búsqueda semántica a Meilisearch o Typesense con vector support (el código actual está marcado como "no escala").

### Internacionalización

- Multi-idioma con `next-intl` para clientes bilingües dentro de una misma instancia.
- Multi-moneda con conversión automática.
- Tax rules por región (IVA Colombia 19%, tasas diferenciales por departamento).

### Integraciones

- Contabilidad: sinergia con Alegra (si se elige para factura electrónica) para sincronización contable.
- ERP: conectores básicos para Siigo y World Office.
- Live chat IA con productos (Groq ya integrado).
- Trustpilot / Google Reviews widget.

### Calidad de código y DevOps

- Modularización de `admin_ai_service.py` (1431 líneas) en intent / data fetch / format.
- Modularización de `payment_widget_service.py` (1258 líneas) en polling / signature / state.
- Migrar SQL crudo en `order_service.py` (820 líneas) a ORM o query builder.
- Migrar migraciones SQL crudas a Alembic.
- Dockerización + IaC (Terraform) para deploys reproducibles.
- Pre-commit hooks: ruff, eslint, prettier obligatorios.
- OpenAPI types generados en frontend desde FastAPI (eliminar tipos duplicados).
- Storybook para componentes admin.
- Observabilidad: métricas con OpenTelemetry, dashboards en Grafana o Datadog.

---

## Decisiones pendientes

- [ ] Proveedor de factura electrónica (Alegra vs Facturapi) — decidir antes del 2026-06-02.
- [ ] Stack PDF para factura comercial (WeasyPrint vs Playwright PDF) — decidir antes del 2026-05-23.
- [ ] Editor rich-text del CMS (TipTap vs Lexical vs Slate) — decidir antes del 2026-05-26.
