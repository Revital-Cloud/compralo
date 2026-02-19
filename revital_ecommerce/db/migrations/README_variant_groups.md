# Migración a modelo variant_groups (atributo dominante)

## Orden de ejecución

1. **Backup** (recomendado):
   ```bash
   pg_dump -U usuario -d nombre_bd -F c -f backup_antes_variant_groups.dump
   ```

2. **Migración principal** (crea tablas, migra datos, actualiza FKs, elimina tablas antiguas y funciones):
   ```bash
   psql -U usuario -d nombre_bd -f migrate_to_variant_groups.sql
   ```

3. **Funciones de carrito** (opcional si ya están en el script; si usas los archivos sueltos):
   ```bash
   psql -U usuario -d nombre_bd -f post_migrate_variant_groups_functions.sql
   ```

## Nuevas tablas

- **tab_product_variant_groups**: Un registro por valor del atributo dominante (ej. Color = Negro). Una galería de imágenes por grupo.
- **tab_product_variant_combinations**: Combinaciones vendibles (SKU, precio, stock, atributos no dominantes en JSONB). Referenciadas por carrito y órdenes (`variant_id` = `tab_product_variant_combinations.id`).
- **tab_product_variant_images**: Imágenes por grupo (evita duplicar por talla).

## Caso de prueba (Camiseta negra)

- Variantes actuales: Negro S, Negro M, Negro L.
- Tras migración: 1 `tab_product_variant_groups` (Negro), 3 `tab_product_variant_combinations`, 1 galería de imágenes, stock por talla.
- PDP: al cambiar color cambia la galería; al cambiar talla no.

## Verificación (queries en comentarios al final de `migrate_to_variant_groups.sql`)

- Conteo de grupos por producto.
- Conteo de combinaciones.
- Imágenes duplicadas por grupo (debe ser 0).
- Stock total por grupo.
