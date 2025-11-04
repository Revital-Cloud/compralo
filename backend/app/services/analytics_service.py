"""
Servicio para obtener datos de analytics avanzados.
"""
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, List, Any
from services.statistic_service import get_categories_stadistics


def get_analytics_data(db: Session) -> Dict[str, Any]:
    """
    Obtiene todos los datos necesarios para la página de analytics avanzados.
    
    Args:
        db (Session): Sesión de base de datos
        
    Returns:
        dict: Datos completos de analytics
    """
    try:
        # Obtener métricas de conversión
        conversion_metrics = _get_conversion_metrics(db)
        
        # Obtener performance por categoría
        product_performance = _get_product_performance_by_category(db)
        
        # Obtener métricas de productos
        product_metrics = _get_product_metrics(db)
        
        # Obtener datos geográficos aproximados
        geo_data = _get_geographic_data(db)
        
        # Obtener tráfico por horas (aproximado desde fechas de órdenes)
        hourly_traffic = _get_hourly_traffic(db)
        
        # Fuentes de tráfico (mock data - no tenemos tracking real)
        traffic_sources = _get_traffic_sources_mock(db)
        
        # Demografía de clientes (aproximado)
        customer_demographics = _get_customer_demographics_mock(db)
        
        return {
            'conversionMetrics': conversion_metrics,
            'productPerformance': product_performance,
            'productMetrics': product_metrics,
            'geoData': geo_data,
            'hourlyTraffic': hourly_traffic,
            'trafficSources': traffic_sources,
            'customerDemographics': customer_demographics
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener datos de analytics: {str(e)}")


def _get_conversion_metrics(db: Session) -> List[Dict[str, Any]]:
    """Obtiene métricas de conversión."""
    # Obtener estadísticas de órdenes
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    previous_start = start_date - timedelta(days=30)
    previous_end = start_date
    
    # Órdenes completadas actuales
    current_query = text("""
        SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(val_total_pedido), 0) as total_revenue,
            COALESCE(AVG(val_total_pedido), 0) as avg_order_value
        FROM tab_ordenes
        WHERE ind_estado = 2 
            AND fec_pedido >= :start_date 
            AND fec_pedido <= :end_date
    """)
    
    current_result = db.execute(current_query, {
        'start_date': start_date,
        'end_date': end_date
    })
    current = current_result.mappings().first()
    
    # Órdenes completadas anteriores
    previous_result = db.execute(current_query, {
        'start_date': previous_start,
        'end_date': previous_end
    })
    previous = previous_result.mappings().first()
    
    # Carritos totales
    carts_query = text("""
        SELECT COUNT(*) as total_carts
        FROM tab_carritos
        WHERE fec_insert >= :start_date AND fec_insert <= :end_date
    """)
    
    carts_result = db.execute(carts_query, {
        'start_date': start_date,
        'end_date': end_date
    })
    carts = carts_result.mappings().first()
    
    # Calcular métricas
    def safe_float(value):
        if value is None:
            return 0.0
        if isinstance(value, Decimal):
            return float(value)
        return float(value or 0)
    
    def safe_int(value):
        if value is None:
            return 0
        return int(value or 0)
    
    total_orders = safe_int(current.get('total_orders', 0))
    total_carts = safe_int(carts.get('total_carts', 0))
    avg_order_value = safe_float(current.get('avg_order_value', 0))
    total_revenue = safe_float(current.get('total_revenue', 0))
    
    prev_total_orders = safe_int(previous.get('total_orders', 0))
    prev_avg_order_value = safe_float(previous.get('avg_order_value', 0))
    prev_total_revenue = safe_float(previous.get('total_revenue', 0))
    
    # Calcular conversión (aproximado: órdenes / carritos)
    conversion_rate = (total_orders / total_carts * 100) if total_carts > 0 else 0.0
    prev_conversion_rate = 0.0  # Necesitaríamos datos previos de carritos
    
    # Calcular crecimiento
    def calculate_growth(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100
    
    return [
        {
            'title': 'Tasa de Conversión',
            'value': f"{conversion_rate:.2f}%",
            'change': f"{calculate_growth(conversion_rate, prev_conversion_rate):.1f}%",
            'icon': 'IconTarget'
        },
        {
            'title': 'Valor Promedio de Orden',
            'value': f"${avg_order_value:,.0f}",
            'change': f"{calculate_growth(avg_order_value, prev_avg_order_value):.1f}%",
            'icon': 'IconShoppingCart'
        },
        {
            'title': 'Total de Órdenes',
            'value': f"{total_orders:,}",
            'change': f"{calculate_growth(total_orders, prev_total_orders):.1f}%",
            'icon': 'IconPackage'
        },
        {
            'title': 'Ingresos Totales',
            'value': f"${total_revenue:,.0f}",
            'change': f"{calculate_growth(total_revenue, prev_total_revenue):.1f}%",
            'icon': 'IconCash'
        }
    ]


def _get_product_performance_by_category(db: Session) -> List[Dict[str, Any]]:
    """Obtiene performance por categoría."""
    try:
        categories_stats = get_categories_stadistics(db)
        
        if categories_stats is None or len(categories_stats) == 0:
            return []
        
        # Calcular total para porcentajes
        total_revenue = sum(
            float(row.get('total_ingresos', 0) or 0) 
            if not isinstance(row.get('total_ingresos', 0), Decimal) 
            else float(row.get('total_ingresos', 0))
            for row in categories_stats
        )
        
        product_performance = []
        for row in categories_stats:
            revenue = row.get('total_ingresos', 0)
            if revenue is None:
                revenue = 0.0
            elif isinstance(revenue, Decimal):
                revenue = float(revenue)
            else:
                revenue = float(revenue or 0)
            
            growth = float(row.get('crecimiento_mensual', 0) or 0)
            percentage = (revenue / total_revenue * 100) if total_revenue > 0 else 0.0
            
            product_performance.append({
                'category': str(row.get('nom_categoria', '')),
                'sales': revenue,
                'growth': growth,
                'percentage': percentage
            })
        
        # Ordenar por ventas descendente
        product_performance.sort(key=lambda x: x['sales'], reverse=True)
        
        return product_performance
    except Exception as e:
        return []


def _get_product_metrics(db: Session) -> Dict[str, Any]:
    """Obtiene métricas generales de productos."""
    query = text("""
        SELECT 
            COUNT(*) FILTER (WHERE ind_activo = TRUE) as productos_activos,
            COUNT(*) FILTER (WHERE ind_activo = FALSE) as productos_inactivos,
            COUNT(*) FILTER (WHERE num_stock = 0) as sin_stock,
            AVG(val_precio) FILTER (WHERE ind_activo = TRUE) as precio_promedio
        FROM tab_productos
    """)
    
    result = db.execute(query)
    row = result.mappings().first()
    
    def safe_float(value):
        if value is None:
            return 0.0
        if isinstance(value, Decimal):
            return float(value)
        return float(value or 0)
    
    def safe_int(value):
        if value is None:
            return 0
        return int(value or 0)
    
    # Obtener promedio de rating (si existe tabla de comentarios)
    rating_query = text("""
        SELECT COALESCE(AVG(calificacion), 0) as rating_promedio
        FROM tab_comentarios
        WHERE calificacion IS NOT NULL
    """)
    
    rating_result = db.execute(rating_query)
    rating_row = rating_result.mappings().first()
    avg_rating = safe_float(rating_row.get('rating_promedio', 0)) if rating_row else 0.0
    
    return {
        'productosActivos': safe_int(row.get('productos_activos', 0)),
        'sinStock': safe_int(row.get('sin_stock', 0)),
        'precioPromedio': safe_float(row.get('precio_promedio', 0)),
        'ratingPromedio': avg_rating
    }


def _get_geographic_data(db: Session) -> List[Dict[str, Any]]:
    """Obtiene datos geográficos aproximados usando direcciones de usuarios."""
    query = text("""
        SELECT 
            COALESCE(d.ciudad, 'Sin especificar') as region,
            COUNT(DISTINCT o.id_orden) as orders,
            COALESCE(SUM(o.val_total_pedido) FILTER (WHERE o.ind_estado = 2), 0) as revenue
        FROM tab_ordenes o
        JOIN tab_usuarios u ON o.id_usuario = u.id_usuario
        LEFT JOIN tab_direcciones_usuario d ON u.id_usuario = d.id_usuario AND d.ind_principal = TRUE AND d.ind_activa = TRUE
        WHERE o.fec_pedido >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY d.ciudad
        ORDER BY orders DESC
        LIMIT 10
    """)
    
    result = db.execute(query)
    
    geo_data = []
    for row in result.mappings().all():
        revenue = row.get('revenue', 0)
        if revenue is None:
            revenue = 0.0
        elif isinstance(revenue, Decimal):
            revenue = float(revenue)
        else:
            revenue = float(revenue or 0)
        
        geo_data.append({
            'region': str(row.get('region', 'Sin especificar')),
            'orders': int(row.get('orders', 0) or 0),
            'revenue': revenue
        })
    
    return geo_data


def _get_hourly_traffic(db: Session) -> List[Dict[str, Any]]:
    """Obtiene tráfico por horas usando fechas de órdenes como proxy."""
    query = text("""
        SELECT 
            EXTRACT(HOUR FROM fec_pedido) as hour,
            COUNT(*) as orders
        FROM tab_ordenes
        WHERE fec_pedido >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM fec_pedido)
        ORDER BY hour
    """)
    
    result = db.execute(query)
    
    # Inicializar todas las horas con 0
    hourly_data = {str(i).zfill(2): 0 for i in range(24)}
    
    for row in result.mappings().all():
        hour = int(row.get('hour', 0))
        orders = int(row.get('orders', 0) or 0)
        hourly_data[str(hour).zfill(2)] = orders
    
    return [
        {'hour': hour, 'visitors': count}
        for hour, count in sorted(hourly_data.items())
    ]


def _get_traffic_sources_mock(db: Session) -> List[Dict[str, Any]]:
    """Obtiene fuentes de tráfico (mock - no tenemos tracking real)."""
    # Como no tenemos tracking de fuentes de tráfico, podemos usar datos aproximados
    # basados en órdenes o retornar datos vacíos
    return [
        {
            'source': 'Direct',
            'visitors': 0,
            'percentage': 0,
            'change': 0
        },
        {
            'source': 'Google Organic',
            'visitors': 0,
            'percentage': 0,
            'change': 0
        },
        {
            'source': 'Social Media',
            'visitors': 0,
            'percentage': 0,
            'change': 0
        }
    ]


def _get_customer_demographics_mock(db: Session) -> List[Dict[str, Any]]:
    """Obtiene demografía de clientes (mock - no tenemos datos de edad)."""
    # Como no tenemos datos de edad en la BD, retornamos datos vacíos
    # Esto requeriría agregar campos de edad o fecha de nacimiento a tab_usuarios
    return []

