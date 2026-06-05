# Decisiones pendientes

Preguntas abiertas que **deben cerrarse** antes o durante el MVP para evitar suposiciones incorrectas en la integración con Factus. Cada opción incluye pros, contras y recomendación.

Las decisiones ya tomadas están en [06-respuestas-equipo.md](./06-respuestas-equipo.md).

---

## 1. Política de IVA en precios del catálogo

**Contexto:** Los precios en `tab_combinaciones_variante_producto.precio` y en el snapshot de orden no indican si incluyen o excluyen IVA. Factus exige `items.price` (base) y `items.taxes[]` coherentes con el total facturado.

**Estado:** Pendiente de definición por producto/contador.

### Opción A — Precios incluyen IVA 19% (recomendada para MVP B2C)

| Aspecto | Detalle |
|---------|---------|
| Convención | El precio mostrado al cliente ya lleva IVA |
| Cálculo al facturar | `base = precio / 1.19`; IVA = `precio - base` |
| Tasa por defecto | 19% para todos los productos en MVP |
| Pros | Alineado con e-commerce B2C en Colombia; menos cambios en UI de tienda |
| Contras | Productos exentos requieren excepción manual o fase posterior |
| Esfuerzo | Bajo en MVP |

### Opción B — Precios sin IVA

| Aspecto | Detalle |
|---------|---------|
| Convención | Catálogo muestra valor antes de impuesto |
| Cálculo al facturar | `base = precio`; IVA = `base * 0.19` |
| Pros | Contabilidad explícita; claro para B2B |
| Contras | Cambio de percepción de precios en tienda; total checkout debe mostrar IVA |
| Esfuerzo | Medio (UX y copy) |

### Opción C — IVA por producto (mixto)

| Aspecto | Detalle |
|---------|---------|
| Convención | Cada producto/variante tiene `tasa_iva` y/o `cod_impuesto` |
| Casos | 19%, 5%, 0% exento |
| Pros | Correcto fiscalmente para catálogos heterogéneos |
| Contras | Migración BD, admin de productos, mapper más complejo |
| Esfuerzo | Alto — recomendado para **implementación completa**, no MVP |

### Recomendación

| Fase | Elección sugerida |
|------|-------------------|
| MVP sandbox | **Opción A** — IVA 19% incluido en precio, desglosar al emitir |
| Implementación completa | Evaluar **Opción C** si el catálogo tiene exentos o tasas distintas |

### Preguntas para cerrar con contador / producto

1. ¿Todos los productos del piloto gravados con IVA 19%?
2. ¿Hay productos exentos (libros, medicamentos, etc.)?
3. ¿El precio en vitrina es el precio final al consumidor (IVA incluido)?

---

## 2. Datos del receptor exigidos en checkout

**Contexto:** Factus requiere `customer` completo. Hoy solo se captura tipo y número de documento (y solo si no se usa dirección de envío como facturación), sin persistir en BD.

**Estado:** Pendiente de definición UX / legal.

### Opción A — Formulario fiscal obligatorio (recomendada)

| Campo en checkout | Obligatorio |
|-------------------|-------------|
| Tipo de identificación | Sí |
| Número de identificación | Sí |
| DV (si NIT) | Sí |
| Nombres / razón social | Sí |
| Email | Sí (puede heredarse del usuario) |
| Municipio | Sí — select con códigos Factus/DIAN |
| Tipo persona (natural/jurídica) | Sí |
| Responsable de IVA (sí/no) | Sí — default no responsable (ZZ) |

| Pros | Contras |
|------|---------|
| Payload Factus completo desde el primer intento | Más fricción en checkout |
| Menos rechazos en validación DIAN | Requiere catálogo de municipios en UI |

### Opción B — Mínimos + inferencia

| Captura | Inferencia |
|---------|------------|
| Tipo doc + número + nombre | Municipio desde `ciudad` + tabla homologación |
| Email del usuario | Automático |
| Tributo | Default ZZ |

| Pros | Contras |
|------|---------|
| Checkout más corto | Homologación ciudad → código municipio es frágil |
| Menos campos nuevos | Errores silenciosos en facturas |

### Opción C — Consumidor final sin identificación

| Regla | Detalle |
|-------|---------|
| Umbral | Montos bajos según normativa DIAN vigente |
| Identificación | Genérica o código consumidor final |
| Uso | Solo B2C minorista |

| Pros | Contras |
|------|---------|
| Checkout mínimo para tickets pequeños | Requiere validación legal del umbral actual |
| Común en retail | Factus puede exigir campos igualmente en sandbox |

### Recomendación

| Fase | Elección sugerida |
|------|-------------------|
| MVP | **Opción A** con municipio en select (API o JSON estático Factus) |
| Mejora futura | **Opción C** como atajo automático bajo umbral, si contador lo aprueba |

### Preguntas para cerrar con producto / legal

1. ¿El negocio vende solo B2C o también B2B con NIT?
2. ¿Se acepta checkout invitado o siempre usuario registrado?
3. ¿Qué porcentaje de pedidos esperan con NIT vs cédula?
4. ¿Se permite facturar a nombre distinto al titular de la tarjeta?

---

## 3. Municipios — fuente de catálogo

**Contexto:** Factus exige `municipality_code` numérico, no nombre de ciudad libre.

| Opción | Descripción |
|--------|-------------|
| A | Descargar tabla de municipios Factus; servir como JSON estático en backend |
| B | Endpoint de referencia Factus (si existe en cuenta) consumido al iniciar |
| C | Homologación manual ciudad texto → código (no recomendado) |

**Recomendación:** Opción A para MVP; refrescar tabla cuando Factus actualice.

---

## 4. Envío gratis en factura — representación en Factus

**Contexto:** Decisión del equipo: envío en FE, exento de IVA, con promos.

| Opción | Descripción |
|--------|-------------|
| A | Omitir línea de envío si costo neto = 0 |
| B | Incluir línea "Servicio de envío" con precio 0 |
| C | Incluir línea con precio bruto + `discount_rate` 100% |

**Recomendación:** Probar A y B en **sandbox Factus** en la primera semana de integración; documentar cuál valida DIAN sin rechazo.

---

## 5. Versión API Factus

| Documento interno antiguo | Documentación actual Factus |
|---------------------------|----------------------------|
| Referencias a `/v1/bills/validate` | **`/v2/bills/validate`** |

**Decisión propuesta:** Implementar solo **v2**. Actualizar referencias en docs legacy cuando se toquen.

---

## Tabla resumen — qué falta decidir

| # | Tema | Responsable sugerido | Bloquea MVP |
|---|------|----------------------|-------------|
| 1 | IVA incluido vs excluido | Contador + producto | Sí |
| 2 | Campos receptor en checkout | Producto + UX | Sí |
| 3 | Fuente catálogo municipios | Backend | Sí |
| 4 | Línea envío $0 en Factus | QA + sandbox | Parcial |
| 5 | Umbral consumidor final | Legal | No (post-MVP) |

---

## Cómo registrar el cierre de una decisión

Cuando el equipo cierre una opción:

1. Actualizar [06-respuestas-equipo.md](./06-respuestas-equipo.md) con la decisión y fecha.
2. Marcar la opción elegida en este documento (sección "Decisión cerrada").
3. Ajustar [03-propuesta-tecnica.md](./03-propuesta-tecnica.md) y [04-plan-por-etapas.md](./04-plan-por-etapas.md) si cambia el alcance.

---

## Historial

| Fecha | Notas |
|-------|-------|
| 2025-06-05 | Documento inicial con opciones y recomendaciones MVP |
