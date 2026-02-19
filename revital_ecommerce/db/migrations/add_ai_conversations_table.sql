-- =============================================================
-- TABLA PARA HISTORIAL DE CONVERSACIONES AI
-- =============================================================
-- Esta tabla almacena el historial de conversaciones del asistente AI
-- para permitir aprendizaje incremental y contexto persistente

CREATE TABLE IF NOT EXISTS tab_ai_conversations (
    id_conversation              SERIAL PRIMARY KEY,
    id_usuario                  DECIMAL(10) NOT NULL,
    message                     TEXT NOT NULL,
    reply                       TEXT NOT NULL,
    context_data                JSONB, -- Datos de contexto usados (KPIs, resúmenes, etc.)
    tool_calls                  JSONB, -- Herramientas llamadas en esta conversación
    fec_conversation            TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    -- Nota: Foreign key a tab_usuarios omitida por permisos limitados
    -- La integridad referencial se maneja a nivel de aplicación
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_usuario_fecha 
    ON tab_ai_conversations(id_usuario, fec_conversation DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_fecha 
    ON tab_ai_conversations(fec_conversation DESC);

-- Índice GIN para búsquedas en context_data (JSONB)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context_gin 
    ON tab_ai_conversations USING GIN(context_data);

COMMENT ON TABLE tab_ai_conversations IS 'Historial de conversaciones del asistente AI para aprendizaje incremental';
COMMENT ON COLUMN tab_ai_conversations.context_data IS 'Datos de contexto (KPIs, resúmenes) usados en la conversación';
COMMENT ON COLUMN tab_ai_conversations.tool_calls IS 'Herramientas llamadas durante la conversación';
