CREATE OR REPLACE VIEW vw_top_productos_vendidos AS
SELECT 
    ep.id_categoria,
    ep.id_linea,
    ep.id_sublinea,
    ep.id_producto,
    ep.nom_producto,
    c.nom_categoria,
    ep.total_unidades_vendidas,
    ep.total_ingresos,
    ep.precio_promedio_venta,
    ep.fecha_ultima_venta,
    ep.nivel_rotacion,
    RANK() OVER (ORDER BY ep.total_unidades_vendidas DESC) as ranking_unidades,
    RANK() OVER (ORDER BY ep.total_ingresos DESC) as ranking_ingresos
FROM tab_estadisticas_productos ep
JOIN tab_categorias c ON ep.id_categoria = c.id_categoria
WHERE ep.producto_activo = TRUE
  AND ep.total_unidades_vendidas > 0;