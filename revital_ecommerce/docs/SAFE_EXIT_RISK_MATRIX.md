# Matriz de Riesgo y Priorizacion de Safe Exits

Esta matriz prioriza mejoras de "safe exit" para reducir fallas visibles al usuario, inconsistencias operativas y riesgos de seguridad.

## Escala usada

- **Impacto**: Bajo / Medio / Alto / Critico
- **Probabilidad**: Baja / Media / Alta
- **Esfuerzo**: Bajo / Medio / Alto
- **Prioridad**: P0 (inmediato), P1 (siguiente sprint), P2 (planificado)

## Matriz

| # | Safe exit propuesto | Riesgo que mitiga | Impacto | Probabilidad | Esfuerzo | Prioridad | Recomendacion |
|---|---|---|---|---|---|---|---|
| 1 | Persistir lockout de login en store compartido (Redis/DB) | En despliegues multi-worker, el lockout por email no es consistente entre workers y se debilita la proteccion anti brute-force | Critico | Media | Medio | P0 | Implementar backend lockout distribuido con TTL y clave por email normalizado |
| 2 | Watchdog de UI en flujo de pago (`isProcessing`) | Bloqueo de boton/estado de carga indefinido si callback/postMessage no completa flujo | Alto | Media | Bajo | P0 | Forzar salida segura al expirar timeout: liberar estado, remover listeners, mostrar accion de reintento |
| 3 | Reconciliacion programada de pagos pendientes | Pagos aprobados en proveedor pero no reflejados localmente por fallas transitorias de webhook/red | Alto | Media | Medio | P1 | Job periodico que repolle referencias `CREATED/PENDING` y cierre estado final idempotente |
| 4 | Idempotency-Key en creacion de pago | Duplicados por reintentos de red cliente/proxy o doble submit en borde | Alto | Media | Medio | P1 | Aceptar header/clave de idempotencia y retornar resultado previo cuando aplique |
| 5 | Correlation/Trace ID obligatorio en logs de pago | Investigacion lenta ante incidentes y dificultad para rastrear decisiones de safe exit | Medio | Alta | Bajo | P1 | Propagar `trace_id` desde request a servicios y respuestas de error controlado |
| 6 | Circuit breaker para llamadas externas de pago/captcha | Cascada de timeouts cuando proveedor externo degrada (Wompi/Turnstile) | Alto | Baja | Medio | P2 | Abrir circuito tras umbral de fallas y degradar con mensaje seguro y reintento posterior |
| 7 | Dead-letter o cola de reintentos para webhooks fallidos | Perdida de eventos si el procesamiento falla de forma no recuperable en primer intento | Alto | Baja | Alto | P2 | Persistir payload fallido + politica de reintentos y panel operativo de reproceso |

## Priorizacion sugerida por sprint

### Sprint 1 (P0)

- Lockout distribuido (item 1)
- Watchdog de UI en pagos (item 2)

### Sprint 2 (P1)

- Reconciliacion de pagos pendientes (item 3)
- Idempotency-Key en creacion de pago (item 4)
- Trace ID transversal (item 5)

### Sprint 3 (P2)

- Circuit breaker en integraciones externas (item 6)
- Dead-letter/reproceso de webhooks (item 7)

## Criterios de aceptacion minimos

- Ningun flujo de pago deja la UI bloqueada sin accion posible del usuario.
- Doble click, reintento de red o replay no generan pagos/ordenes duplicadas.
- Cualquier pago exitoso en proveedor converge a estado final correcto en sistema local.
- Eventos de lockout y pagos quedan trazables de extremo a extremo con `trace_id`.
- Ante degradacion de terceros, el sistema falla de forma controlada y recuperable.
