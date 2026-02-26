-- Conteo de objetos en la base de datos (schema public)
-- Uso desde repo root:
--   cd revital_ecommerce/backend && psql "$DATABASE_URL" -f ../db/scripts/count_objects.sql
-- O cargando .env:
--   set -a && source .env && set +a && psql "$DATABASE_URL" -f ../db/scripts/count_objects.sql

\echo '=== RESUMEN (schema public) ==='

SELECT 'Tablas'   AS objeto, count(*) AS total FROM information_schema.tables   WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'Vistas',   count(*) FROM information_schema.tables   WHERE table_schema = 'public' AND table_type = 'VIEW'
UNION ALL
SELECT 'Funciones', count(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
UNION ALL
SELECT 'Triggers', count(*) FROM information_schema.triggers  WHERE trigger_schema = 'public'
UNION ALL
SELECT 'Secuencias', count(*) FROM information_schema.sequences WHERE sequence_schema = 'public'
UNION ALL
SELECT 'Índices',  count(*) FROM pg_indexes WHERE schemaname = 'public';

-- Si pegas en psql y da error, ejecuta el script desde shell:
--   psql "$DATABASE_URL" -f count_objects.sql
-- O esta consulta en una sola línea (copia y pega en psql):
-- SELECT 'Tablas' AS objeto, count(*) AS total FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' UNION ALL SELECT 'Vistas', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'VIEW' UNION ALL SELECT 'Funciones', count(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' UNION ALL SELECT 'Triggers', count(*) FROM information_schema.triggers WHERE trigger_schema = 'public' UNION ALL SELECT 'Secuencias', count(*) FROM information_schema.sequences WHERE sequence_schema = 'public' UNION ALL SELECT 'Índices', count(*) FROM pg_indexes WHERE schemaname = 'public';
