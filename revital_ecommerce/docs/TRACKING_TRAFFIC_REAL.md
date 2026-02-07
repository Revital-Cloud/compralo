# Tracking real de tráfico

## Cómo sería el tracking real

Hoy **Fuentes de tráfico** y **Tráfico por horas** usan:
- Fuentes: reparto fijo 50% / 35% / 15% sobre el total de órdenes (estimado).
- Horas: hora de cada orden (`fec_pedido`), no visitas a la web.

El tracking real implica **registrar de dónde viene el usuario** (y opcionalmente **cuándo visita**) y guardarlo en tu base de datos para luego agregar en analytics.

---

## 1. Fuentes de tráfico (origen por orden)

### Idea
- En la **primera visita** (o al entrar a la tienda) capturar:
  - **Referrer:** `document.referrer` (página desde la que llegó).
  - **UTM:** parámetros de la URL (`utm_source`, `utm_medium`, `utm_campaign`).
- Guardar esa **atribución** (ej. "Google", "Direct", "Facebook") y asociarla a la **orden** cuando el usuario compre.
- En analytics, agrupar órdenes por esa fuente → porcentajes y tendencias reales.

### Implementación mínima

1. **Base de datos**
   - Añadir en `tab_ordenes` una columna, por ejemplo:
     - `origen_trafico VARCHAR(100)` (ej. `'Direct'`, `'Google Organic'`, `'Social Media'`, `'Facebook'`, etc.).
   - Opcional: `utm_source`, `utm_medium` si quieres detalle por campaña.

2. **Frontend**
   - Al cargar la app (o layout de la tienda):
     - Leer `document.referrer` y `window.location.search` (UTM).
     - Clasificar en una etiqueta (ej. "Direct", "Google Organic", "Social Media", "Email", "Otro").
     - Guardar en `localStorage` (ej. clave `attribution`) para que persista en la sesión.
   - Al crear la orden (o al crear la sesión de checkout):
     - Enviar en el payload `origen_trafico` (o `utm_source`) con el valor guardado.

3. **Backend**
   - Aceptar `origen_trafico` (opcional) en el schema de creación de orden y pasarlo a `fun_crear_orden_desde_carrito` (o guardar en `tab_ordenes` después de crear la orden).
   - En el servicio de analytics, reemplazar la estimación por una query real:
     - `SELECT origen_trafico, COUNT(*), SUM(val_total_pedido) FROM tab_ordenes WHERE ... GROUP BY origen_trafico`.

### Reglas de clasificación (referrer + UTM)

- Si hay `utm_source` → usarlo (mapear a "Google Organic", "Social Media", "Email", etc.).
- Si no hay UTM:
  - `referrer` vacío o mismo dominio → **Direct**.
  - Dominio de Google → **Google Organic**.
  - Dominios de redes (facebook, instagram, twitter, etc.) → **Social Media**.
  - Otro → **Referral** o "Otro".

---

## 2. Tráfico por horas (visitas reales)

### Idea
- Registrar **cada visita** (o cada vista de página) con **hora** y, opcionalmente, fuente.
- En analytics, **Tráfico por horas** = visitas por hora (no órdenes por hora).

### Implementación

1. **Base de datos**
   - Nueva tabla, por ejemplo:
     - `tab_visitas` (id, session_id, fec_visita, hora, referrer o origen_trafico, opcional: path, usuario si logueado).
   - No hace falta tocar `tab_ordenes`.

2. **Backend**
   - Endpoint público, ej. `POST /api/track-visit` (o `/api/analytics/visit`):
     - Body: `{ "session_id": "...", "referrer": "...", "utm_source": "..." }` (y opcional path).
     - Insertar una fila en `tab_visitas` con la hora actual.

3. **Frontend**
   - En el layout de la tienda (o en una página de landing):
     - Llamar a `POST /api/track-visit` con la misma lógica de referrer/UTM que para la orden (y session_id si ya lo tienen).
   - Opcional: no disparar en cada navegación para no inflar (ej. una vez por sesión o por página clave).

4. **Analytics**
   - Tráfico por horas:
     - `SELECT EXTRACT(HOUR FROM fec_visita) as hour, COUNT(*) FROM tab_visitas WHERE fec_visita >= ... GROUP BY hour`.
   - Fuentes de tráfico por visitas (opcional):
     - Misma idea que por órdenes pero sobre `tab_visitas` y agrupando por origen/referrer.

---

## Resumen

| Qué quieres | Dónde guardar | Qué capturar |
|------------|----------------|--------------|
| **Fuentes de tráfico reales (por orden)** | Columna en `tab_ordenes` (ej. `origen_trafico`) | Referrer + UTM al entrar; enviar al crear orden |
| **Tráfico por horas = visitas** | Nueva tabla `tab_visitas` | Llamada a `/track-visit` con hora y opcional referrer/UTM |

El paso más útil y con menos cambio es **1. Fuentes de tráfico por orden**: una columna, un poco de lógica en frontend para clasificar y enviar, y que analytics lea de esa columna en lugar del reparto fijo.
