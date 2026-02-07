-- Migración: Agregar campos reference y parent_payment_id a tab_pagos
-- Fecha: 2025-01-XX
-- Descripción: Agrega campos necesarios para integración completa de Wompi Checkout Widget
--               - reference: Referencia única del pago (formato revital_{order_id}_{random})
--               - parent_payment_id: Para tracking de reintentos
--               - provider_transaction_id: Hacer nullable (inicialmente no existe hasta attach)

-- 1. Hacer provider_transaction_id nullable (puede no existir inicialmente)
ALTER TABLE tab_pagos 
ALTER COLUMN provider_transaction_id DROP NOT NULL;

-- 2. Agregar campo reference (único)
ALTER TABLE tab_pagos 
ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

-- 3. Agregar índice único en reference
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_reference 
ON tab_pagos(reference) 
WHERE reference IS NOT NULL;

-- 4. Agregar campo parent_payment_id para reintentos
ALTER TABLE tab_pagos 
ADD COLUMN IF NOT EXISTS parent_payment_id INTEGER;

-- 5. Agregar foreign key a parent_payment_id (self-reference)
ALTER TABLE tab_pagos 
ADD CONSTRAINT fk_pagos_parent_payment 
FOREIGN KEY (parent_payment_id) 
REFERENCES tab_pagos(id_pago) 
ON DELETE SET NULL;

-- 6. Agregar campo raw_last_event para guardar último webhook/evento
ALTER TABLE tab_pagos 
ADD COLUMN IF NOT EXISTS raw_last_event JSONB;

-- 7. Actualizar constraint UNIQUE para permitir NULL en provider_transaction_id
-- Primero eliminar el constraint existente si existe
ALTER TABLE tab_pagos 
DROP CONSTRAINT IF EXISTS tab_pagos_provider_transaction_id_provider_name_key;

-- Crear nuevo constraint que permite NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_provider_transaction_unique 
ON tab_pagos(provider_transaction_id, provider_name) 
WHERE provider_transaction_id IS NOT NULL;

-- Nota: El constraint original UNIQUE (provider_transaction_id, provider_name) 
-- se reemplaza por un índice parcial que permite múltiples NULLs

