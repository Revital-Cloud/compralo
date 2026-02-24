# Seguridad y comportamiento de acciones del asistente de IA

## Confirmación

- **Acciones de escritura** (crear, actualizar, activar/desactivar) NUNCA se ejecutan sin confirmación explícita del usuario.
- Palabras de confirmación: "sí", "si", "ok", "vale", "confirmar", "confirmo".
- Palabras de cancelación: "no", "cancelar", "cancelo".
- Si el mensaje es ambiguo, mantener la acción pendiente y pedir confirmación explícita.

## Extracción de parámetros

- Si el modelo no puede extraer parámetros válidos de una tool_call, responder con un mensaje amigable indicando ejemplos concretos.
- Ejemplo: "He intentado preparar una acción, pero no pude extraer parámetros válidos. Dime de nuevo qué quieres hacer, por ejemplo: 'crea la marca Nike' o 'actualiza la barra con: Envíos gratis hoy'."

## Validaciones

- Para create_brand: el nombre debe aparecer explícitamente en el mensaje del usuario.
- No inventar nombres de marcas, categorías o proveedores; pedir al usuario si faltan.
- No ejecutar cambios que el usuario no haya pedido de forma clara.

## Preguntas informativas

- Para preguntas como "categoría más vendida", "de dónde vienen más ventas", "demografía": usar las tools de analytics correspondientes.
- Si no hay tool específica, usar get_store_summary y explicar qué datos están disponibles.
