-- 20260311_02_pgvector_product_embeddings_functions.sql
--
-- Objetivo:
-- - Centralizar en DB (PostgreSQL) la lógica de:
--   1) UPSERT de embeddings por producto
--   2) Búsqueda por similaridad (pgvector)
--
-- Motivación:
-- - Reutilización: backend, scripts, jobs, etc.
-- - Auditoría: la lógica queda versionada como SQL.
-- - Consistencia: un único punto de verdad para el UPSERT y la query topK.
--
-- Seguridad:
-- - Aunque la lógica esté en DB, el backend debe seguir usando parámetros ligados.
--   Eso evita inyección SQL.
--
-- Cómo ejecutar:
--   psql "$DATABASE_URL" -f revital_ecommerce/db/migrations/20260311_02_pgvector_product_embeddings_functions.sql
--
-- Verificación rápida:
--   \\df+ fun_upsert_product_embedding
--   \\df+ fun_semantic_search_product_embeddings

BEGIN;

-- UPSERT: guarda/actualiza embedding y source_text.
CREATE OR REPLACE FUNCTION fun_upsert_product_embedding(
  p_product_id  DECIMAL(10),
  p_embedding   vector(1536),
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


-- Búsqueda topK por cosine distance (<=>). Devuelve score en [aprox -inf..1].
CREATE OR REPLACE FUNCTION fun_semantic_search_product_embeddings(
  p_query_embedding vector(1536),
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

