from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

def get_products_stadistics(db:Session):
    """
    Obtiene las estadísticas de los productos (tab_estadisticas_productos, modelo products/variants).
    """
    try:
        query = text("""
        SELECT
            product_id AS id_producto,
            nom_producto,
            precio_actual,
            stock_actual,
            producto_activo,
            total_ordenes,
            total_unidades_vendidas,
            total_ingresos,
            ventas_mes_actual,
            ingresos_mes_actual,
            ventas_mes_anterior,
            ingresos_mes_anterior,
            promedio_venta_mensual,
            promedio_ingreso_mensual,
            precio_promedio_venta,
            fecha_primera_venta,
            fecha_ultima_venta,
            mes_mejor_venta,
            mejor_venta_unidades,
            dias_desde_ultima_venta,
            rotacion_inventario,
            nivel_rotacion,
            periodo_calculo
        FROM tab_estadisticas_productos
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener las estadísticas de los productos: {str(e)}")
    
def get_categories_stadistics(db:Session):
    """
    Obtiene las estadísticas de las categorías (tab_estadisticas_categorias, modelo tab_categories).
    """
    try:
        query = text("""
        SELECT
            category_id AS id_categoria,
            nom_categoria,
            categoria_activa,
            total_productos,
            productos_activos,
            productos_con_ventas,
            total_ordenes,
            total_unidades_vendidas,
            total_ingresos,
            ventas_mes_actual,
            ingresos_mes_actual,
            ventas_mes_anterior,
            ingresos_mes_anterior,
            participacion_ventas,
            crecimiento_mensual,
            precio_promedio_categoria,
            producto_mas_vendido,
            producto_mayor_ingreso,
            unidades_top_producto,
            fecha_primera_venta,
            fecha_ultima_venta,
            mejor_mes_ventas,
            ultima_actualizacion,
            periodo_calculo
        FROM tab_estadisticas_categorias
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener las estadísticas de las categorías: {str(e)}")
