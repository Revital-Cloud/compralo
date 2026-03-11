-- 20260311_01_enable_pgvector_and_product_embeddings.sql
--
-- Objetivo:
-- - Habilitar la extensión pgvector (VECTOR) para embeddings.
-- - Crear una tabla para almacenar embeddings por producto, sin usar SERIAL/IDENTITY.
--
-- Importante:
-- - En este proyecto, `tab_products.id` es DECIMAL(10) (ver `db_revital.sql`).
--   Por eso `product_id` usa el mismo tipo.
-- - Esta tabla es un "índice/caché derivado" para búsqueda semántica.
--
-- Cómo ejecutar (ejemplo):
--   psql "$DATABASE_URL" -f revital_ecommerce/db/migrations/20260311_01_enable_pgvector_and_product_embeddings.sql
--
-- Verificación rápida:
--   \dx
--   \d tab_product_embeddings

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS tab_product_embeddings (
  product_id  DECIMAL(10) PRIMARY KEY REFERENCES tab_products(id),
  embedding   vector(1536) NOT NULL,
  source_text TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;

