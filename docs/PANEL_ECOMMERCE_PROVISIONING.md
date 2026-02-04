# Conexión Panel ↔ E-commerce: pipeline de provisioning de instancias

## Objetivo

Que cuando un usuario cree una instancia desde **synkro_panel**, se dispare un **pipeline** que:

- Cree la base de datos PostgreSQL para esa instancia
- Despliegue **synkro_ecommerce** (backend + frontend) en el **destino que el usuario elija**

**Restricción**: Crear la instancia en el mismo servidor donde corre el panel **no es posible**. El panel solo orquesta (registra la instancia, captura la elección del usuario y dispara el pipeline); el trabajo pesado se hace en otro servicio/servidor o en la nube.

Sin HA por ahora: una sola instancia del orquestador y flujo simple.

---

## Pipeline y elección del usuario

Es un **pipeline** (no solo un webhook puntual): el usuario, **al crear su instancia**, elige **qué quiere hacer y dónde** quiere desplegar. Las opciones de destino típicas son:

| Destino | Descripción |
|--------|--------------|
| **Vercel** | Frontend/backend serverless (Vercel Functions). BD externa (ej. Neon, Supabase, RDS). |
| **AWS** | App Runner, ECS/Fargate, Lambda + RDS/Aurora, Amplify, etc. |
| **Azure** | App Service, Container Apps, Azure Database for PostgreSQL, etc. |
| **Servidor propio** | VPS, bare metal o VM (Docker, K8s, etc.) que el cliente o Synkro administra. |
| **Otros** | GCP (Cloud Run, GKE), Railway, Render, Fly.io, etc. |

El panel debe guardar en la instancia el **destino elegido** (ej. en `config_json.deployment_target`: `"vercel" | "aws" | "azure" | "own_server"`) y pasarlo en el payload del webhook al pipeline para que el orquestador ejecute los pasos correctos (crear BD en el proveedor adecuado, desplegar en ese destino). El hook actual ya envía `config_json` en el POST; si el usuario eligió destino, debe ir ahí.

---

## BeeAI como orquestador del pipeline

[BeeAI](https://beeai.dev/) es una plataforma open-source para descubrir, ejecutar y componer **agentes de IA desde cualquier framework**. Puede ayudar a orquestar este pipeline de provisioning:

- **Descubrir y ejecutar** pasos del pipeline (crear BD, desplegar en Vercel, AWS, Azure o servidor propio) como agentes o tareas.
- **Componer** flujos según el destino elegido por el usuario (un flujo para Vercel, otro para AWS, etc.) sin duplicar toda la lógica en un solo script.

En la práctica: el panel envía al pipeline (webhook o cola) el payload de la instancia **incluyendo el destino** (`deployment_target`). El orquestador (donde BeeAI podría integrarse) ejecuta la secuencia adecuada para ese destino y al finalizar llama al callback del panel para actualizar `backend_url`, `frontend_url`, `estado_instancia`, etc.

**Complejidad**:  
- **Panel + webhook + callback**: complejidad baja; ya está esbozado en esta guía.  
- **Pipeline multi-destino (Vercel, AWS, Azure, propio)**: media; cada destino tiene sus APIs/CLIs (Vercel API, AWS SDK, Azure SDK, SSH/Ansible para servidor propio).  
- **Integrar BeeAI** para orquestar esos pasos como agentes: añade flexibilidad y reutilización, con la complejidad de definir y mantener los agentes/tareas por destino.  
Conviene empezar con **un solo destino** (ej. Vercel o un servidor propio con Docker), validar el flujo y luego extender a más opciones y, si aplica, a BeeAI.

---

## Complejidad del pipeline por destino

Qué tan complicado le toca al pipeline conectar a cada opción (crear BD + desplegar backend + frontend):

| Destino | Complejidad | Qué necesita el pipeline | Notas |
|--------|-------------|---------------------------|--------|
| **Railway / Render / Fly.io** | **Baja** | API o CLI del proveedor; crear proyecto + servicio + BD (Postgres gestionado). Deploy vía Git o imagen Docker. | Una API, documentación clara, Postgres incluido. Buen punto de partida. |
| **Vercel** | **Media** | Vercel API/CLI para proyecto y deploy. **BD por separado**: Neon, Supabase o similar (otra API). Backend FastAPI suele ir en otro host (Vercel es fuerte en frontend Next.js; el backend podría ser Vercel Functions o Railway/Render). | Dos piezas: frontend en Vercel + BD (Neon/Supabase) + opcionalmente backend en otro servicio. |
| **Servidor propio (VPS)** | **Media** | SSH + clave o usuario; ejecutar scripts (crear BD en Postgres local, migrar, `docker-compose up` o similar). El pipeline no crea el servidor; el usuario (o Synkro) ya tiene el host. | Sin APIs de cloud; hay que gestionar SSH, seguridad y que el servidor tenga Postgres/Docker. |
| **AWS** | **Alta** | IAM, boto3/SDK: RDS (o Aurora) para BD, App Runner/ECS/Lambda para app, Amplify o S3+CloudFront para frontend. VPC, security groups, roles. | Muchos servicios y permisos; conviene usar Terraform/Pulumi o un template por destino. |
| **Azure** | **Alta** | Service principal, SDK: Azure Database for PostgreSQL, App Service o Container Apps, etc. Resource groups, redes. | Similar a AWS: varios recursos y permisos; templates o IaC ayudan. |
| **GCP** | **Alta** | Cloud SQL, Cloud Run o GKE, IAM. Misma idea que AWS/Azure. | También alta; IaC recomendable. |

**Resumen**:

- **Más fácil**: Railway, Render, Fly.io — una API/CLI, Postgres gestionado, deploy sencillo. El pipeline puede ser un script o un pequeño servicio que llame a la API y luego haga callback al panel.
- **Media**: Vercel (combinando con Neon/Supabase y quizá backend en Railway) y servidor propio (SSH + Docker). Requieren orquestar 2–3 pasos bien definidos.
- **Más difícil**: AWS, Azure, GCP — muchas piezas, IAM/permisos, redes. Aquí un “agente” por destino (o BeeAI orquestando) ayuda a no mezclar toda la lógica; se puede usar Terraform/OpenTofu por destino para mantener el estado.

**Recomendación**: empezar con **un solo destino de complejidad baja** (ej. Railway o Render), implementar el flujo completo (crear BD → migrar → desplegar → callback). Cuando esté estable, añadir Vercel o servidor propio, y después AWS/Azure si hace falta.

---

## Estado actual

| Paso | Dónde | Qué hace hoy |
|------|--------|----------------|
| 1 | Panel | Inserta fila en `tab_instancias` (estado `creando`, `db_nombre`, slug, etc.) |
| 2 | Panel | Opcional: inserta en `tab_deployments` (solo registro/historial) |
| 3 | — | **No existe**: creación real de BD ni despliegue de e-commerce |

El panel **no** crea bases de datos ni despliega código; solo guarda metadatos.

---

## Idea general: pipeline de provisioning

1. **Panel** (tu servidor):
   - Crea la instancia en BD (`tab_instancias`, estado `creando`) con el **destino elegido** por el usuario (ej. `deployment_target` en `config_json` o columna dedicada).
   - Justo después, **dispara el pipeline** (webhook o cola) con el payload de la instancia, incluyendo el destino.
2. **Pipeline / orquestador** (fuera del servidor del panel; opcionalmente con [BeeAI](https://beeai.dev/)):
   - Según el destino (Vercel, AWS, Azure, servidor propio, etc.), ejecuta los pasos adecuados.
   - Crea la BD para la instancia (en el proveedor que corresponda).
   - Despliega synkro_ecommerce (backend + frontend) en ese destino.
   - Llama al callback del panel para actualizar la instancia (URLs, `db_host`, estado `activa`).

Así el panel nunca ejecuta scripts de BD ni de deploy; solo escribe en su BD y envía el mensaje al pipeline. Todo el provisioning corre **fuera** del servidor del panel.

---

## Opciones de implementación

### Opción A – Webhook al pipeline (recomendada para empezar)

- **Panel**: tras `create_instancia` exitoso, hace un `POST` a una URL configurable (ej. `PROVISIONING_WEBHOOK_URL`) con el payload de la instancia: `id_instancia`, `slug_instancia`, `db_nombre`, `region_deployment`, **`deployment_target`** (Vercel, AWS, Azure, own_server, etc.) y el resto de metadatos.
- **Pipeline / provisionador** (servicio aparte, en otro host o en cloud; puede usar [BeeAI](https://beeai.dev/) para orquestar):
  1. Según `deployment_target`, ejecuta la rama correspondiente (Vercel, AWS, Azure, servidor propio).
  2. Crea la BD (Neon/Supabase/RDS/Cloud SQL, etc., según destino).
  3. Ejecuta migraciones del e-commerce sobre esa BD.
  4. Despliega backend + frontend en ese destino (Vercel, App Runner, Container Apps, Docker en VPS, etc.).
  5. Llama al panel (endpoint de callback) para actualizar la instancia: `backend_url`, `frontend_url`, `db_host`, `estado_instancia = 'activa'`.

Ventajas: simple, el panel no necesita colas ni infra extra; solo una URL y un pipeline externo que puede crecer a varios destinos.

### Opción B – Cola + worker en otro servidor

- **Panel**: tras crear la instancia, publica un mensaje en una cola (Redis/RabbitMQ/SQS) con `id_instancia` y datos necesarios.
- **Worker** (proceso en **otro** servidor) consume la cola, hace el mismo flujo (crear BD, deploy, actualizar instancia en panel).

Ventajas: reintentos, desacoplamiento fuerte. Requiere mantener cola y worker.

### Opción C – APIs de cloud desde el panel (sin ejecutar deploy en el panel)

- **Panel** llama a APIs de tu proveedor (ej. AWS RDS para crear BD, Cloud Run/App Runner para crear servicio) y luego actualiza `tab_instancias` con las URLs/hosts devueltos.
- El “trabajo pesado” lo hace la nube; el panel solo hace HTTP a la API. Sigue siendo recomendable que la BD y el e-commerce **no** vivan en el mismo host que el panel (por ejemplo, RDS + Fargate/Cloud Run en otra VPC).

---

## Flujo recomendado (pipeline, Opción A, sin HA)

```
[Usuario] → Panel (crear instancia + elegir destino: Vercel | AWS | Azure | servidor propio)
                ↓
         INSERT tab_instancias (estado = 'creando', deployment_target en config_json)
                ↓
         POST a PROVISIONING_WEBHOOK_URL (async, payload con id_instancia, deployment_target, etc.)
                ↓
[Pipeline / orquestador, otro servidor — opcional: BeeAI]
         → Según deployment_target: rama Vercel | AWS | Azure | own_server
         → Crear BD (proveedor según destino)
         → Migrar schema e-commerce
         → Desplegar backend + frontend en ese destino
         → Callback panel API: actualizar instancia (urls, db_host, estado = 'activa')
```

- El panel no ejecuta ningún comando de BD ni de deploy en su propio servidor; **crear la instancia en el mismo servidor del panel no es posible**.
- El pipeline puede ser un servicio (FastAPI/Flask) o agentes orquestados con [BeeAI](https://beeai.dev/); cada destino (Vercel, AWS, Azure, servidor propio) puede ser un flujo distinto dentro del mismo orquestador.

---

## Callback: actualizar instancia desde el provisionador

El provisionador debe poder actualizar la instancia en el panel. Dos enfoques:

1. **API del panel con auth**  
   Endpoint tipo `PATCH /api/instances/{id_instancia}` (o interno `/api/internal/instances/{id}/provisioning-callback`) protegido con API key o JWT de servicio, donde el provisionador envía `backend_url`, `frontend_url`, `db_host`, `db_usuario` (si aplica), `estado_instancia = 'activa'` y opcionalmente `estado_instancia = 'error'` si falla.

2. **Acceso directo a la BD del panel**  
   Solo si el provisionador tiene acceso de red y credenciales a la BD del panel; hace `UPDATE tab_instancias SET ...`. Menos recomendable si quieres mantener todo por API.

Recomendación: usar un endpoint de callback en el panel protegido por API key/secret, y que el provisionador llame a ese endpoint al terminar (éxito o error).

---

## Resumen

- **Pipeline de provisioning**: el usuario, al crear su instancia, **elige el destino** (Vercel, AWS, Azure, servidor propio, etc.). El panel crea el registro con ese destino y **dispara el pipeline**; el orquestador (externo) crea BD y despliega e-commerce en el destino elegido y luego **actualiza** el registro en el panel.
- **Crear la instancia en el mismo servidor del panel no es posible**: todo el provisioning debe ejecutarse fuera (webhook a pipeline, cola+worker o APIs de cloud).
- [**BeeAI**](https://beeai.dev/) puede ayudar a orquestar el pipeline (descubrir, ejecutar y componer pasos por destino). Empezar con un solo destino y luego extender reduce la complejidad.

**Hook en el repo (panel)**:

- **Variable de entorno**: `PROVISIONING_WEBHOOK_URL` (opcional). Si está definida, tras crear la instancia se envía un `POST` en segundo plano con payload JSON: `id_instancia`, `slug_instancia`, `db_nombre`, `nom_instancia`, `region_deployment`, etc. El frontend/API debe permitir enviar también **`deployment_target`** (Vercel, AWS, Azure, own_server) para que el pipeline sepa dónde desplegar.
- **Código**: `synkro_panel/backend/app/core/config.py`, `app/services/provisioning_hook.py`, `app/services/instancia_service.py`.

El **pipeline** (servicio o agentes BeeAI que reciben el webhook, crean BD y despliegan e-commerce en el destino elegido) se implementa fuera del servidor del panel. Esta guía describe el flujo, las opciones de destino y el callback para actualizar la instancia en el panel.
