CREATE OR REPLACE VIEW vw_resumen_ventas_categoria AS
SELECT 
    ec.*,
    RANK() OVER (ORDER BY ec.total_ingresos DESC) as ranking_ingresos,
    RANK() OVER (ORDER BY ec.total_unidades_vendidas DESC) as ranking_unidades,
    CASE 
        WHEN ec.crecimiento_mensual > 10 THEN 'Alto Crecimiento'
        WHEN ec.crecimiento_mensual > 0 THEN 'Crecimiento Moderado'
        WHEN ec.crecimiento_mensual = 0 THEN 'Estable'
        ELSE 'Decrecimiento'
    END as tendencia_categoria
FROM tab_estadisticas_categorias ec
WHERE ec.categoria_activa = TRUE;