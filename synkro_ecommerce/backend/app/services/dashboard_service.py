"""
Servicio para obtener datos del dashboard administrativo.
"""
import json
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, List, Any


def get_dashboard_data(db: Session, time_range: str = 'monthly') -> Dict[str, Any]:
    """
    Obtiene todos los datos necesarios para el dashboard administrativo.
    
    Args:
        db (Session): Sesión de base de datos
        time_range (str): Rango de tiempo ('daily', 'weekly', 'monthly')
        
    Returns:
        dict: Datos completos del dashboard
    """
    try:
        # Calcular fechas según el rango de tiempo
        end_date = datetime.now()
        if time_range == 'daily':
            start_date = end_date - timedelta(days=30)  # Últimos 30 días
            period_format = 'YYYY-MM-DD'
            period_label = 'day'
        elif time_range == 'weekly':
            start_date = end_date - timedelta(weeks=12)  # Últimas 12 semanas
            period_format = 'IYYY-"W"IW'  # Año-Semana ISO
            period_label = 'week'
        else:  # monthly
            start_date = end_date - timedelta(days=365)  # Último año
            period_format = 'YYYY-MM'
            period_label = 'month'
        
        # Obtener KPIs
        kpis = _get_kpis(db, start_date, end_date)
        
        # Obtener datos de ventas para el gráfico
        sales_data = _get_sales_data(db, start_date, end_date, period_format, period_label)
        
        # Obtener productos más vendidos
        best_sellers = _get_best_sellers(db, limit=10)
        
        # Obtener órdenes recientes
        recent_orders = _get_recent_orders(db, limit=10)
        
        # Calcular resumen de ventas
        summary = _get_sales_summary(db, sales_data)
        
        return {
            'kpis': kpis,
            'salesData': sales_data,
            'bestSellers': best_sellers,
            'recentOrders': recent_orders,
            'summary': summary,
            'timeRange': time_range
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener datos del dashboard: {str(e)}")


def _get_kpis(db: Session, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """Obtiene los KPIs del dashboard."""
    # Obtener estadísticas del período actual
    current_query = text("""
        SELECT 
            COUNT(*) as total_orders,
            COUNT(*) FILTER (WHERE ind_estado = 1) as active_orders,
            COUNT(*) FILTER (WHERE ind_estado = 2) as shipped_orders,
            COALESCE(SUM(val_total_pedido) FILTER (WHERE ind_estado = 2), 0) as total_revenue
        FROM tab_ordenes
        WHERE fec_pedido >= :start_date AND fec_pedido <= :end_date
    """)
    
    current_result = db.execute(current_query, {
        'start_date': start_date,
        'end_date': end_date
    })
    current = current_result.mappings().first()
    
    # Calcular período anterior para comparación
    period_days = (end_date - start_date).days
    previous_start = start_date - timedelta(days=period_days)
    previous_end = start_date
    
    previous_query = text("""
        SELECT 
            COUNT(*) as total_orders,
            COUNT(*) FILTER (WHERE ind_estado = 1) as active_orders,
            COUNT(*) FILTER (WHERE ind_estado = 2) as shipped_orders,
            COALESCE(SUM(val_total_pedido) FILTER (WHERE ind_estado = 2), 0) as total_revenue
        FROM tab_ordenes
        WHERE fec_pedido >= :start_date AND fec_pedido < :end_date
    """)
    
    previous_result = db.execute(previous_query, {
        'start_date': previous_start,
        'end_date': previous_end
    })
    previous = previous_result.mappings().first()
    
    # Valores actuales - manejar Decimal y None
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
    active_orders = safe_int(current.get('active_orders', 0))
    shipped_orders = safe_int(current.get('shipped_orders', 0))
    total_revenue = safe_float(current.get('total_revenue', 0))
    
    # Valores anteriores
    prev_total_orders = safe_int(previous.get('total_orders', 0))
    prev_active_orders = safe_int(previous.get('active_orders', 0))
    prev_shipped_orders = safe_int(previous.get('shipped_orders', 0))
    prev_total_revenue = safe_float(previous.get('total_revenue', 0))
    
    # Calcular crecimiento
    def calculate_growth(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100
    
    def format_value(value, is_revenue=False):
        if is_revenue:
            if value >= 1000000:
                return f"${value/1000000:.1f}M"
            elif value >= 1000:
                return f"${value/1000:.1f}K"
            return f"${value:.0f}"
        else:
            if value >= 1000:
                return f"{value/1000:.1f}K"
            return f"{value:.0f}"
    
    return {
        'totalOrders': {
            'value': total_orders,
            'growth': calculate_growth(total_orders, prev_total_orders),
            'trend': 'up' if total_orders >= prev_total_orders else 'down',
            'formatted': format_value(total_orders)
        },
        'activeOrders': {
            'value': active_orders,
            'growth': calculate_growth(active_orders, prev_active_orders),
            'trend': 'up' if active_orders >= prev_active_orders else 'down',
            'formatted': format_value(active_orders)
        },
        'shippedOrders': {
            'value': shipped_orders,
            'growth': calculate_growth(shipped_orders, prev_shipped_orders),
            'trend': 'up' if shipped_orders >= prev_shipped_orders else 'down',
            'formatted': format_value(shipped_orders)
        },
        'totalRevenue': {
            'value': total_revenue,
            'growth': calculate_growth(total_revenue, prev_total_revenue),
            'trend': 'up' if total_revenue >= prev_total_revenue else 'down',
            'formatted': format_value(total_revenue, is_revenue=True)
        }
    }


def _get_sales_data(db: Session, start_date: datetime, end_date: datetime, 
                    period_format: str, period_label: str) -> List[Dict[str, Any]]:
    """Obtiene datos de ventas agrupados por período."""
    # Construir la query con el formato de período directamente en el SQL
    query = text(f"""
        SELECT 
            TO_CHAR(fec_pedido, '{period_format}') as period,
            COUNT(*) as orders,
            COALESCE(SUM(val_total_pedido) FILTER (WHERE ind_estado = 2), 0) as revenue
        FROM tab_ordenes
        WHERE fec_pedido >= :start_date AND fec_pedido <= :end_date
        GROUP BY TO_CHAR(fec_pedido, '{period_format}')
        ORDER BY period ASC
    """)
    
    result = db.execute(query, {
        'start_date': start_date,
        'end_date': end_date
    })
    
    sales_data = []
    for row in result.mappings().all():
        revenue = row.get('revenue', 0)
        if revenue is None:
            revenue = 0.0
        elif isinstance(revenue, Decimal):
            revenue = float(revenue)
        else:
            revenue = float(revenue or 0)
        
        sales_data.append({
            'period': str(row.get('period', '')),
            'sales': revenue,
            'orders': int(row.get('orders', 0) or 0)
        })
    
    return sales_data


def _get_best_sellers(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """Obtiene los productos más vendidos."""
    query = text("""
        SELECT 
            p.id_categoria,
            p.id_linea,
            p.id_sublinea,
            p.id_producto,
            p.nom_producto,
            p.img_producto,
            COALESCE(SUM(op.cant_producto), 0) as total_sold,
            COALESCE(SUM(op.subtotal), 0) as total_revenue
        FROM tab_productos p
        LEFT JOIN tab_orden_productos op ON 
            p.id_categoria = op.id_categoria_producto 
            AND p.id_linea = op.id_linea_producto
            AND p.id_sublinea = op.id_sublinea_producto
            AND p.id_producto = op.id_producto
        LEFT JOIN tab_ordenes o ON op.id_orden = o.id_orden AND o.ind_estado = 2
        WHERE p.ind_activo = TRUE
        GROUP BY p.id_categoria, p.id_linea, p.id_sublinea, p.id_producto, p.nom_producto, p.img_producto
        HAVING COALESCE(SUM(op.cant_producto), 0) > 0
        ORDER BY total_sold DESC, total_revenue DESC
        LIMIT :limit
    """)
    
    result = db.execute(query, {'limit': limit})
    
    best_sellers = []
    for row in result.mappings().all():
        revenue = row.get('total_revenue', 0)
        if revenue is None:
            revenue = 0.0
        elif isinstance(revenue, Decimal):
            revenue = float(revenue)
        else:
            revenue = float(revenue or 0)
        
        # Construir ID único usando la clave compuesta
        id_categoria = str(row.get('id_categoria', ''))
        id_linea = str(row.get('id_linea', ''))
        id_sublinea = str(row.get('id_sublinea', ''))
        id_producto = str(row.get('id_producto', ''))
        unique_id = f"{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}"
        
        # Extraer URL de imagen desde img_producto (JSONB: { "main": "url" } o { "url": "..." })
        image_url = None
        img_producto = row.get('img_producto')
        if img_producto:
            try:
                if isinstance(img_producto, str):
                    img_producto = json.loads(img_producto)
                if isinstance(img_producto, dict):
                    image_url = img_producto.get('main') or img_producto.get('url') or None
                    if image_url and not isinstance(image_url, str):
                        image_url = None
            except (json.JSONDecodeError, TypeError):
                pass

        best_sellers.append({
            'id': unique_id,
            'id_categoria': id_categoria,
            'id_linea': id_linea,
            'id_sublinea': id_sublinea,
            'id_producto': id_producto,
            'name': str(row.get('nom_producto', '')),
            'image': image_url,
            'sales': int(row.get('total_sold', 0) or 0),
            'revenue': revenue
        })
    
    return best_sellers


def _get_recent_orders(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """Obtiene las órdenes más recientes."""
    query = text("""
        SELECT 
            o.id_orden,
            o.fec_pedido,
            COALESCE(u.nom_usuario, '') || ' ' || COALESCE(u.ape_usuario, '') as customer_name,
            o.val_total_pedido,
            o.ind_estado,
            (SELECT COUNT(*) FROM tab_orden_productos WHERE id_orden = o.id_orden) as items_count
        FROM tab_ordenes o
        JOIN tab_usuarios u ON o.id_usuario = u.id_usuario
        WHERE o.fec_pedido IS NOT NULL
        ORDER BY o.fec_pedido DESC
        LIMIT :limit
    """)
    
    result = db.execute(query, {'limit': limit})
    
    # Mapeo de estados
    status_map = {
        1: 'pending',
        2: 'delivered',
        3: 'canceled'
    }
    
    recent_orders = []
    for row in result.mappings().all():
        estado = row.get('ind_estado', 1)
        fec_pedido = row.get('fec_pedido')
        
        amount = row.get('val_total_pedido', 0)
        if amount is None:
            amount = 0.0
        elif isinstance(amount, Decimal):
            amount = float(amount)
        else:
            amount = float(amount or 0)
        
        recent_orders.append({
            'id': str(row.get('id_orden', '')),
            'customer': row.get('customer_name', '').strip() or 'Cliente',
            'date': fec_pedido.isoformat() if fec_pedido else '',
            'amount': amount,
            'status': status_map.get(estado, 'pending'),
            'items': int(row.get('items_count', 0) or 0)
        })
    
    return recent_orders


def _get_sales_summary(db: Session, sales_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calcula el resumen de ventas."""
    total_sales = sum(item.get('sales', 0) for item in sales_data)
    total_orders = sum(item.get('orders', 0) for item in sales_data)
    
    # Calcular tasa de conversión (simplificado - asumiendo que tenemos visitas)
    # Por ahora, usaremos un placeholder
    conversion_rate = 0.0
    if total_orders > 0:
        # Esto es un placeholder - necesitarías tracking de visitas para calcularlo correctamente
        conversion_rate = 3.2  # Ejemplo
    
    return {
        'totalSales': total_sales,
        'totalOrders': total_orders,
        'conversionRate': f"{conversion_rate:.1f}"
    }

