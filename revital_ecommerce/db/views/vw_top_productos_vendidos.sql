CREATE OR REPLACE VIEW vw_top_productos_vendidos AS
SELECT 
    ep.product_id,
    ep.nom_producto,
    c.name AS nom_categoria,
    ep.total_unidades_vendidas,
    ep.total_ingresos,
    ep.precio_promedio_venta,
    ep.fecha_ultima_venta,
    ep.nivel_rotacion,
    RANK() OVER (ORDER BY ep.total_unidades_vendidas DESC) AS ranking_unidades,
    RANK() OVER (ORDER BY ep.total_ingresos DESC) AS ranking_ingresos
FROM tab_estadisticas_productos ep
JOIN tab_products p ON ep.product_id = p.id
JOIN tab_categories c ON p.category_id = c.id
WHERE ep.producto_activo = TRUE
  AND ep.total_unidades_vendidas > 0;