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
        
        # Fuentes de tráfico (basado en datos reales de órdenes, distribución estimada)
        traffic_sources = _get_traffic_sources_mock(db)
        
        # Demografía de clientes (grupos de edad desde fec_nacimiento)
        customer_demographics = _get_customer_demographics(db)
        
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
    
    # Órdenes pagadas/completadas actuales (estado 2 = pagada, 3 = completada)
    current_query = text("""
        SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(val_total_pedido), 0) as total_revenue,
            COALESCE(AVG(val_total_pedido), 0) as avg_order_value
        FROM tab_ordenes
        WHERE ind_estado IN (2, 3)
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
    
    # Carritos totales (periodo actual)
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
    
    # Carritos periodo anterior (para calcular conversión previa)
    prev_carts_result = db.execute(carts_query, {
        'start_date': previous_start,
        'end_date': previous_end
    })
    prev_carts = prev_carts_result.mappings().first()
    
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
    prev_total_carts = safe_int(prev_carts.get('total_carts', 0))
    prev_avg_order_value = safe_float(previous.get('avg_order_value', 0))
    prev_total_revenue = safe_float(previous.get('total_revenue', 0))
    
    # Calcular conversión (aproximado: órdenes / carritos)
    conversion_rate = (total_orders / total_carts * 100) if total_carts > 0 else 0.0
    prev_conversion_rate = (prev_total_orders / prev_total_carts * 100) if prev_total_carts > 0 else 0.0
    
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
    """Obtiene performance por categoría desde estadísticas o calcula directamente."""
    try:
        categories_stats = get_categories_stadistics(db)
        
        # Si hay estadísticas pre-calculadas con ventas > 0, usarlas
        if categories_stats and len(categories_stats) > 0:
            total_revenue = sum(
                float(row.get('total_ingresos', 0) or 0)
                if not isinstance(row.get('total_ingresos', 0), Decimal)
                else float(row.get('total_ingresos', 0))
                for row in categories_stats
            )
            # Si la tabla de estadísticas tiene al menos una categoría con ventas, usarla
            if total_revenue > 0:
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
                product_performance.sort(key=lambda x: x['sales'], reverse=True)
                return product_performance
            # Si todas tienen 0 ventas en la tabla de estadísticas, usar fallback (datos reales de órdenes)
        
        # Fallback: Calcular directamente desde órdenes (siempre datos reales)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        previous_start = start_date - timedelta(days=30)
        previous_end = start_date
        
        # Primero obtener todas las categorías activas
        categories_query = text("""
            SELECT id_categoria, nom_categoria
            FROM tab_categorias
            WHERE ind_activo = TRUE
            ORDER BY nom_categoria
        """)
        categories_result = db.execute(categories_query)
        all_categories = {}
        for row in categories_result.mappings().all():
            cat_id = row.get('id_categoria')
            cat_name = row.get('nom_categoria')
            if cat_id is not None and cat_name:
                # Convertir a int para consistencia
                cat_id_key = int(cat_id) if isinstance(cat_id, (int, Decimal)) else cat_id
                all_categories[cat_id_key] = str(cat_name)
        
        if not all_categories:
            return []
        
        # Luego obtener ventas por categoría desde órdenes (LEFT JOIN para incluir todas las categorías)
        sales_query = text("""
            SELECT 
                c.id_categoria,
                COALESCE(SUM(op.subtotal) FILTER (
                    WHERE o.fec_pedido >= :start_date 
                    AND o.fec_pedido <= :end_date
                    AND o.ind_estado IN (2, 3)
                ), 0) as ingresos_actuales,
                COALESCE(SUM(op.subtotal) FILTER (
                    WHERE o.fec_pedido >= :prev_start 
                    AND o.fec_pedido <= :prev_end
                    AND o.ind_estado IN (2, 3)
                ), 0) as ingresos_anteriores
            FROM tab_categorias c
            LEFT JOIN tab_productos p ON c.id_categoria = p.id_categoria AND p.ind_activo = TRUE
            LEFT JOIN tab_orden_productos op ON p.id_categoria = op.id_categoria_producto 
                AND p.id_linea = op.id_linea_producto 
                AND p.id_sublinea = op.id_sublinea_producto 
                AND p.id_producto = op.id_producto
            LEFT JOIN tab_ordenes o ON op.id_orden = o.id_orden 
                AND o.ind_estado IN (2, 3)
            WHERE c.ind_activo = TRUE
            GROUP BY c.id_categoria
        """)
        
        sales_result = db.execute(sales_query, {
            'start_date': start_date,
            'end_date': end_date,
            'prev_start': previous_start,
            'prev_end': previous_end
        })
        sales_by_category = {}
        for row in sales_result.mappings().all():
            cat_id = row.get('id_categoria')
            if cat_id is not None:
                # Convertir a int para consistencia
                cat_id_key = int(cat_id) if isinstance(cat_id, (int, Decimal)) else cat_id
                ingresos_actuales = row.get('ingresos_actuales', 0) or 0
                ingresos_anteriores = row.get('ingresos_anteriores', 0) or 0
                sales_by_category[cat_id_key] = {
                    'ingresos_actuales': float(ingresos_actuales) if not isinstance(ingresos_actuales, Decimal) else float(ingresos_actuales),
                    'ingresos_anteriores': float(ingresos_anteriores) if not isinstance(ingresos_anteriores, Decimal) else float(ingresos_anteriores)
                }
        
        # Combinar todas las categorías con sus ventas (0 si no tienen)
        total_revenue = sum(s['ingresos_actuales'] for s in sales_by_category.values())
        
        product_performance = []
        for cat_id, cat_name in all_categories.items():
            sales_data = sales_by_category.get(cat_id, {'ingresos_actuales': 0.0, 'ingresos_anteriores': 0.0})
            revenue_actual = sales_data['ingresos_actuales']
            revenue_anterior = sales_data['ingresos_anteriores']
            
            # Calcular crecimiento
            if revenue_anterior == 0:
                growth = 100.0 if revenue_actual > 0 else 0.0
            else:
                growth = ((revenue_actual - revenue_anterior) / revenue_anterior) * 100
            
            percentage = (revenue_actual / total_revenue * 100) if total_revenue > 0 else 0.0
            
            product_performance.append({
                'category': str(cat_name),
                'sales': revenue_actual,
                'growth': growth,
                'percentage': percentage
            })
        
        # Ordenar por ventas descendente
        product_performance.sort(key=lambda x: x['sales'], reverse=True)
        return product_performance
    except Exception as e:
        # Si falla todo, retornar lista vacía
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
    """Ventas por región: dirección principal del usuario o cualquier activa (departamento o ciudad)."""
    query = text("""
        WITH dir_por_usuario AS (
            SELECT DISTINCT ON (id_usuario) id_usuario, departamento, ciudad
            FROM tab_direcciones_usuario
            WHERE ind_activa = TRUE
            ORDER BY id_usuario, ind_principal DESC, id_direccion
        )
        SELECT 
            COALESCE(NULLIF(TRIM(d.departamento), ''), NULLIF(TRIM(d.ciudad), ''), 'Sin especificar') as region,
            COUNT(DISTINCT o.id_orden) as orders,
            COALESCE(SUM(o.val_total_pedido) FILTER (WHERE o.ind_estado IN (2, 3)), 0) as revenue
        FROM tab_ordenes o
        JOIN tab_usuarios u ON o.id_usuario = u.id_usuario
        LEFT JOIN dir_por_usuario d ON u.id_usuario = d.id_usuario
        WHERE o.fec_pedido >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY COALESCE(NULLIF(TRIM(d.departamento), ''), NULLIF(TRIM(d.ciudad), ''), 'Sin especificar')
        ORDER BY revenue DESC NULLS LAST, orders DESC
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
    """Obtiene fuentes de tráfico basado en datos reales de órdenes."""
    # Como no tenemos tracking de referrers, usamos datos aproximados basados en órdenes
    # Contamos órdenes del último mes y distribuimos de forma aproximada
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    previous_start = start_date - timedelta(days=30)
    previous_end = start_date
    
    # Total de órdenes actuales
    current_query = text("""
        SELECT COUNT(*) as total_orders
        FROM tab_ordenes
        WHERE fec_pedido >= :start_date AND fec_pedido <= :end_date
    """)
    
    current_result = db.execute(current_query, {
        'start_date': start_date,
        'end_date': end_date
    })
    current_orders = current_result.mappings().first()
    total_current = int(current_orders.get('total_orders', 0) or 0)
    
    # Total de órdenes periodo anterior
    prev_result = db.execute(current_query, {
        'start_date': previous_start,
        'end_date': previous_end
    })
    prev_orders = prev_result.mappings().first()
    total_previous = int(prev_orders.get('total_orders', 0) or 0)
    
    # Si no hay órdenes, retornar datos vacíos
    if total_current == 0:
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
    
    # Distribución aproximada basada en patrones comunes de e-commerce
    # Nota: Para datos reales, se requiere implementar tracking de referrers
    direct_visitors = int(total_current * 0.5)  # 50% directo (estimado)
    google_visitors = int(total_current * 0.35)  # 35% Google (estimado)
    social_visitors = total_current - direct_visitors - google_visitors  # Resto
    
    prev_direct = int(total_previous * 0.5) if total_previous > 0 else 0
    prev_google = int(total_previous * 0.35) if total_previous > 0 else 0
    prev_social = total_previous - prev_direct - prev_google if total_previous > 0 else 0
    
    def calculate_change(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100
    
    total_visitors = total_current
    direct_pct = (direct_visitors / total_visitors * 100) if total_visitors > 0 else 0
    google_pct = (google_visitors / total_visitors * 100) if total_visitors > 0 else 0
    social_pct = (social_visitors / total_visitors * 100) if total_visitors > 0 else 0
    
    return [
        {
            'source': 'Direct',
            'visitors': direct_visitors,
            'percentage': round(direct_pct, 1),
            'change': round(calculate_change(direct_visitors, prev_direct), 1)
        },
        {
            'source': 'Google Organic',
            'visitors': google_visitors,
            'percentage': round(google_pct, 1),
            'change': round(calculate_change(google_visitors, prev_google), 1)
        },
        {
            'source': 'Social Media',
            'visitors': social_visitors,
            'percentage': round(social_pct, 1),
            'change': round(calculate_change(social_visitors, prev_social), 1)
        }
    ]


def _get_customer_demographics(db: Session) -> List[Dict[str, Any]]:
    """Obtiene demografía de clientes por grupos de edad (fec_nacimiento en tab_usuarios)."""
    query = text("""
        WITH edades AS (
            SELECT 
                u.id_usuario,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nacimiento))::INT as edad,
                CASE
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nacimiento)) < 18 THEN '0-17'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nacimiento)) BETWEEN 18 AND 24 THEN '18-24'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nacimiento)) BETWEEN 25 AND 34 THEN '25-34'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nacimiento)) BETWEEN 35 AND 44 THEN '35-44'
                    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nacimiento)) BETWEEN 45 AND 54 THEN '45-54'
                    ELSE '55+'
                END as grupo_edad
            FROM tab_usuarios u
            WHERE u.fec_nacimiento IS NOT NULL
              AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.fec_nacimiento)) BETWEEN 0 AND 120
        ),
        ingresos_por_grupo AS (
            SELECT 
                e.grupo_edad,
                COUNT(DISTINCT e.id_usuario) as clientes,
                COALESCE(SUM(o.val_total_pedido), 0) as revenue
            FROM edades e
            LEFT JOIN tab_ordenes o ON o.id_usuario = e.id_usuario AND o.ind_estado IN (2, 3)
            GROUP BY e.grupo_edad
        ),
        totales AS (
            SELECT 
                SUM(clientes) as total_clientes,
                SUM(revenue) as total_revenue
            FROM ingresos_por_grupo
        )
        SELECT 
            g.grupo_edad,
            g.clientes,
            g.revenue,
            CASE WHEN t.total_revenue > 0 THEN (g.revenue / t.total_revenue * 100) ELSE 0 END as percentage
        FROM ingresos_por_grupo g
        CROSS JOIN totales t
        ORDER BY 
            CASE g.grupo_edad
                WHEN '0-17' THEN 1
                WHEN '18-24' THEN 2
                WHEN '25-34' THEN 3
                WHEN '35-44' THEN 4
                WHEN '45-54' THEN 5
                ELSE 6
            END
    """)
    try:
        result = db.execute(query)
        rows = result.mappings().all()
        total_revenue = sum(float(r.get('revenue') or 0) if not isinstance(r.get('revenue'), Decimal) else float(r.get('revenue')) for r in rows)
        demographics = []
        for row in rows:
            revenue = row.get('revenue', 0)
            if isinstance(revenue, Decimal):
                revenue = float(revenue)
            else:
                revenue = float(revenue or 0)
            pct = row.get('percentage', 0)
            if isinstance(pct, Decimal):
                pct = float(pct)
            else:
                pct = float(pct or 0)
            # Porcentaje por clientes si no hay ingresos para repartir
            if total_revenue == 0 and rows:
                total_clientes = sum(int(r.get('clientes') or 0) for r in rows)
                pct = (int(row.get('clientes') or 0) / total_clientes * 100) if total_clientes else 0
            demographics.append({
                'ageGroup': str(row.get('grupo_edad', '')),
                'percentage': round(pct, 1),
                'revenue': revenue
            })
        return demographics
    except Exception:
        return []

