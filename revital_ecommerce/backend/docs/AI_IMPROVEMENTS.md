# Mejoras del Modelo AI - Aprendizaje Incremental y Resúmenes

## Resumen de Cambios

Se ha implementado un sistema completo de aprendizaje incremental y capacidad de resúmenes para el asistente AI del panel administrativo.

## Características Implementadas

### 1. **Aprendizaje Incremental**
- **Historial de Conversaciones**: Todas las conversaciones se guardan en la base de datos (`tab_ai_conversations`)
- **Contexto Persistente**: El modelo puede acceder a conversaciones anteriores (últimas 5 conversaciones de los últimos 7 días)
- **Preferencias del Usuario**: El sistema aprende de los patrones de uso del usuario (qué herramientas usa más, qué tipo de información pregunta)

### 2. **Capacidad de Resúmenes**
- **Herramienta `get_store_summary`**: Nueva herramienta que obtiene un resumen completo de la tienda
- **Detección Automática**: El sistema detecta automáticamente cuando el usuario pide un resumen y proporciona contexto
- **Datos Incluidos**: KPIs, productos más vendidos, órdenes recientes, alertas de stock

### 3. **Mejoras en el Flujo**
- **Contexto Automático**: Cuando se detecta una pregunta de resumen, se proporcionan datos automáticamente
- **Historial en Prompts**: Las conversaciones anteriores se incluyen en el contexto del LLM
- **Persistencia**: Todas las interacciones se guardan para aprendizaje futuro

## Archivos Modificados/Creados

### Nuevos Archivos
1. **`db/migrations/add_ai_conversations_table.sql`**
   - Tabla `tab_ai_conversations` para almacenar historial
   - Índices para búsquedas eficientes

2. **`backend/app/services/admin_ai_memory.py`**
   - `save_conversation()`: Guarda conversaciones en BD
   - `get_recent_conversations()`: Obtiene conversaciones recientes
   - `build_conversation_context()`: Construye contexto de texto
   - `get_user_preferences_from_history()`: Extrae preferencias del usuario

### Archivos Modificados
1. **`backend/app/services/admin_ai_tools.py`**
   - Agregada herramienta `get_store_summary`

2. **`backend/app/services/admin_ai_actions.py`**
   - Agregada acción `ACTION_GET_STORE_SUMMARY`
   - Implementada función `_execute_get_store_summary()`

3. **`backend/app/services/admin_ai_service.py`**
   - Integrado sistema de memoria persistente
   - Detección automática de preguntas de resumen
   - Guardado automático de conversaciones
   - Uso de historial en prompts

4. **`backend/app/services/admin_ai_instructions.py`**
   - Actualizado `SYSTEM_PROMPT_ADMIN_AI` con capacidades de resumen
   - Instrucciones sobre aprendizaje incremental

## Instalación

### 1. Ejecutar Migración de Base de Datos

```bash
# Conectarse a la base de datos PostgreSQL
psql -U tu_usuario -d tu_base_de_datos

# Ejecutar el script de migración
\i revital_ecommerce/db/migrations/add_ai_conversations_table.sql
```

O desde Python:

```python
from sqlalchemy import text
from app.database import get_db

with open('revital_ecommerce/db/migrations/add_ai_conversations_table.sql', 'r') as f:
    migration_sql = f.read()

db = next(get_db())
db.execute(text(migration_sql))
db.commit()
```

### 2. Verificar Instalación

El sistema debería funcionar automáticamente. Para verificar:

1. Inicia una conversación con el asistente AI
2. Pregunta: "dame un resumen de la tienda"
3. El asistente debería responder con información completa
4. En conversaciones posteriores, el modelo debería recordar el contexto

## Uso

### Preguntas de Resumen

El asistente ahora puede responder a preguntas como:
- "dame un resumen de la tienda"
- "cómo va la tienda"
- "estado de la tienda"
- "resumen general"
- "qué tal vamos"

### Aprendizaje Incremental

El modelo aprende automáticamente de:
- Conversaciones anteriores (últimas 5 de los últimos 7 días)
- Patrones de uso del usuario
- Preferencias de información

### Historial de Conversaciones

Todas las conversaciones se guardan automáticamente en `tab_ai_conversations` con:
- Mensaje del usuario
- Respuesta del asistente
- Datos de contexto usados
- Herramientas llamadas

## Estructura de la Tabla

```sql
CREATE TABLE tab_ai_conversations (
    id_conversation SERIAL PRIMARY KEY,
    id_usuario DECIMAL(10) NOT NULL,  -- Referencia a tab_usuarios (FK manejada a nivel app)
    message TEXT NOT NULL,
    reply TEXT NOT NULL,
    context_data JSONB,        -- Datos de contexto (KPIs, resúmenes)
    tool_calls JSONB,          -- Herramientas llamadas
    fec_conversation TIMESTAMP,
    usr_insert DECIMAL(10),
    fec_insert TIMESTAMP
);
```

**Nota:** La foreign key a `tab_usuarios` se maneja a nivel de aplicación debido a permisos limitados en la base de datos remota. La integridad referencial está garantizada por el código de la aplicación.

## Beneficios

1. **Mejor Experiencia**: El asistente puede responder preguntas de resumen sin problemas
2. **Aprendizaje Continuo**: El modelo mejora con cada interacción
3. **Contexto Persistente**: Mantiene contexto entre conversaciones
4. **Personalización**: Se adapta a las preferencias del usuario

## Próximos Pasos (Opcional)

- [ ] Dashboard de análisis de conversaciones
- [ ] Exportación de historial de conversaciones
- [ ] Análisis de sentimiento de las conversaciones
- [ ] Sugerencias automáticas basadas en historial
- [ ] Limpieza automática de conversaciones antiguas

## Notas Técnicas

- El historial se limita a las últimas 5 conversaciones de los últimos 7 días para mantener el contexto manejable
- Los datos de contexto se almacenan en JSONB para flexibilidad
- El sistema es tolerante a fallos: si falla el guardado de conversación, no interrumpe el flujo principal
- Las conversaciones se guardan después de cada respuesta, no durante el procesamiento
