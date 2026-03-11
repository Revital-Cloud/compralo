-- 20260311_03_switch_product_embeddings_to_ollama_768.sql
--
-- Objetivo:
-- - Cambiar el tamaño del vector de embeddings a 768 dimensiones para usar
--   `nomic-embed-text` (Ollama) como proveedor local.
-- - Re-crear las funciones SQL para que sus firmas usen vector(768).
--
-- IMPORTANTE:
-- - Si ya tienes datos en tab_product_embeddings, al cambiar la dimensión:
--   - Si los embeddings existentes NO son de 768 dims, este ALTER fallará.
--   - Lo más seguro es truncar la tabla antes (o reindexar inmediatamente).
--
-- Ejecución sugerida:
--   BEGIN;
--   TRUNCATE tab_product_embeddings;
--   (correr este archivo)
--   COMMIT;
--
-- Cómo ejecutar:
--   psql "$DATABASE_URL" -f revital_ecommerce/db/migrations/20260311_03_switch_product_embeddings_to_ollama_768.sql

BEGIN;

-- 1) Ajustar tipo de la columna embedding
ALTER TABLE tab_product_embeddings
  ALTER COLUMN embedding TYPE vector(768);

-- 2) Re-crear funciones con firmas vector(768)
-- Para cambiar el tipo en parámetros, hay que dropear la versión anterior.
DROP FUNCTION IF EXISTS fun_upsert_product_embedding(DECIMAL, vector(1536), TEXT);
DROP FUNCTION IF EXISTS fun_semantic_search_product_embeddings(vector(1536), INT);

CREATE OR REPLACE FUNCTION fun_upsert_product_embedding(
  p_product_id  DECIMAL(10),
  p_embedding   vector(768),
  p_source_text TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO tab_product_embeddings (product_id, embedding, source_text, created_at, updated_at)
  VALUES (p_product_id, p_embedding, p_source_text, NOW(), NOW())
  ON CONFLICT (product_id) DO UPDATE
    SET embedding = EXCLUDED.embedding,
        source_text = EXCLUDED.source_text,
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION fun_semantic_search_product_embeddings(
  p_query_embedding vector(768),
  p_top_k INT
)
RETURNS TABLE (
  product_id DECIMAL(10),
  score DOUBLE PRECISION
)
LANGUAGE sql
AS $$
  SELECT
    e.product_id,
    (1 - (e.embedding <=> p_query_embedding))::double precision AS score
  FROM tab_product_embeddings e
  ORDER BY e.embedding <=> p_query_embedding ASC
  LIMIT GREATEST(p_top_k, 0);
$$;

COMMIT;

