import logging
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text, bindparam, Integer

from schemas.order_schema import OrderCreate
from services.out_of_stock_notification_service import notify_after_order_paid_stock_change

logger = logging.getLogger(__name__)

"""
Servicios de órdenes (capa de negocio/persistencia).

Este módulo centraliza:
- consultas de órdenes para usuario y admin,
- creación de orden desde carrito (vía función SQL),
- actualización de estado/método de pago,
- construcción de snapshot de ítems para detalle histórico.

Se consume desde:
- `routers/order_router.py`
- `services/payment_widget_service.py` (cuando pago checkout queda APPROVED)
"""


def get_orders(db:Session):
    """
    Obtiene todas las órdenes registradas en la base de datos.
    """
    try:
        query = text("""
        SELECT
            id_orden,
            fec_pedido,
            id_usuario,
            val_total_productos,
            val_total_descuentos,
            val_total_pedido,
            ind_estado,
            metodo_pago,
            id_descuento,
            detalle_descuentos_aplicados,
            des_observaciones,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_ordenes
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener las órdenes: {str(e)}")


def get_all_orders_admin(db: Session, limit: int = 50, offset: int = 0):
    """
    Obtiene todas las órdenes para el panel de administración.
    
    Args:
        db (Session): Sesión de base de datos
        limit (int): Límite de resultados
        offset (int): Offset para paginación
        
    Returns:
        list: Lista de órdenes con información del usuario

    Pensado para:
    - listados paginados del panel admin.
    - normalización defensiva de nulos para evitar fallos en frontend.
    """
    try:
        query = text("""
        SELECT 
            o.id_orden, 
            o.fec_pedido, 
            o.id_usuario,
            u.nom_usuario, 
            u.ape_usuario, 
            u.email_usuario,
            COALESCE(o.val_total_productos, 0) as val_total_productos, 
            COALESCE(o.val_total_descuentos, 0) as val_total_descuentos, 
            COALESCE(o.val_total_pedido, 0) as val_total_pedido,
            o.ind_estado, 
            o.metodo_pago, 
            o.detalle_descuentos_aplicados,
            (SELECT COUNT(*) FROM tab_orden_productos op WHERE op.id_orden = o.id_orden) as items_count
        FROM tab_ordenes o
        INNER JOIN tab_usuarios u ON o.id_usuario = u.id_usuario
        ORDER BY o.fec_pedido DESC
        LIMIT :limit OFFSET :offset
        """)
        result = db.execute(query, {"limit": limit, "offset": offset})
        orders = result.mappings().all()
        
        # Convertir RowMapping a dict y normalizar valores nulos.
        orders_list = []
        for order in orders:
            order_dict = dict(order)  # Convertir RowMapping a dict
            
            # Convertir `None` a valores por defecto para consumo frontend.
            order_dict['val_total_productos'] = order_dict.get('val_total_productos') or 0
            order_dict['val_total_descuentos'] = order_dict.get('val_total_descuentos') or 0
            order_dict['val_total_pedido'] = order_dict.get('val_total_pedido') or 0
            order_dict['items_count'] = order_dict.get('items_count') or 0
            order_dict['nom_usuario'] = order_dict.get('nom_usuario') or ''
            order_dict['ape_usuario'] = order_dict.get('ape_usuario') or ''
            order_dict['email_usuario'] = order_dict.get('email_usuario') or ''
            order_dict['metodo_pago'] = order_dict.get('metodo_pago') or ''
            
            orders_list.append(order_dict)
            
        return orders_list
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener órdenes para admin: {str(e)}")


def get_order_stats_admin(db: Session):
    """
    Obtiene estadísticas de órdenes para el panel de administración.
    
    Args:
        db (Session): Sesión de base de datos
        
    Returns:
        dict: Estadísticas de órdenes

    Métricas:
    - conteos por estado,
    - total de ventas completadas.
    """
    try:
        query = text("""
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE ind_estado = 1) as pendiente,
            COUNT(*) FILTER (WHERE ind_estado = 2) as completada,
            COUNT(*) FILTER (WHERE ind_estado = 3) as cancelada,
            COALESCE(SUM(val_total_pedido) FILTER (WHERE ind_estado = 2), 0) as total_ventas
        FROM tab_ordenes
        """)
        result = db.execute(query)
        stats = result.mappings().first()
        
        # Normalizar tipos de salida y asegurar estructura consistente.
        if stats:
            # Asegurar que todos los conteos sean enteros.
            stats['total'] = int(stats.get('total', 0))
            stats['pendiente'] = int(stats.get('pendiente', 0))
            stats['completada'] = int(stats.get('completada', 0))
            stats['cancelada'] = int(stats.get('cancelada', 0))
            # `total_ventas` suele llegar como Decimal.
            if stats.get('total_ventas') is None:
                stats['total_ventas'] = Decimal('0')
        else:
            # Si no hay resultados, devolver estructura por defecto.
            stats = {
                'total': 0,
                'pendiente': 0,
                'completada': 0,
                'cancelada': 0,
                'total_ventas': Decimal('0')
            }
        
        return stats
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener estadísticas de órdenes: {str(e)}")


def get_order_detail_admin(db: Session, id_orden: int):
    """
    Obtiene el detalle completo de una orden para el panel de administración.
    
    Args:
        db (Session): Sesión de base de datos
        id_orden (int): ID de la orden
        
    Returns:
        dict: Detalle completo de la orden

    Estructura de salida:
    - `orden`: cabecera y metadatos
    - `productos`: snapshot de ítems comprados
    - `direccion_envio`: dirección resolviendo principal activa
    - `puntos_ganados`
    - `descuentos_aplicados`
    """
    try:
        # Información base de orden + usuario (LEFT JOIN por datos históricos).
        order_query = text("""
        SELECT 
            o.id_orden, 
            o.fec_pedido, 
            o.id_usuario,
            u.nom_usuario, 
            u.ape_usuario, 
            u.email_usuario,
            u.cel_usuario,
            o.val_total_productos, 
            o.val_total_descuentos, 
            o.val_total_pedido,
            o.ind_estado, 
            o.metodo_pago, 
            o.detalle_descuentos_aplicados,
            o.des_observaciones
        FROM tab_ordenes o
        LEFT JOIN tab_usuarios u ON o.id_usuario = u.id_usuario
        WHERE o.id_orden = :id_orden
        """)
        order_result = db.execute(order_query, {"id_orden": id_orden})
        order_data = order_result.mappings().first()
        
        if not order_data:
            return None

        def _to_jsonable(val):
            if val is None:
                return None
            if isinstance(val, Decimal):
                return float(val)
            if hasattr(val, "isoformat") and callable(getattr(val, "isoformat")):
                return val.isoformat()
            if isinstance(val, (dict, list, str, int, float, bool)):
                return val
            return str(val)

        def _row_to_dict(row):
            d = dict(row)
            return {k: _to_jsonable(v) for k, v in d.items()}
            
        # Reutilizar `get_order_with_items` para mantener snapshot consistente
        # con el frontend de cliente (incluye `imagen_url`).
        items_snapshot = get_order_with_items(db, Decimal(id_orden))
        raw_items = items_snapshot.get("items", []) if isinstance(items_snapshot, dict) else []

        # Puntos ganados por esta orden.
        points_query = text("""
        SELECT SUM(cantidad_puntos) as puntos_ganados
        FROM tab_movimientos_puntos
        WHERE id_orden_origen = :id_orden AND tipo_movimiento = 1
        """)
        points_result = db.execute(points_query, {"id_orden": id_orden})
        points_data = points_result.scalar()
        points_value = float(points_data) if points_data is not None else 0
        
        # Dirección de envío:
        # `tab_ordenes` no almacena `id_direccion`, por eso se toma principal activa.
        id_usuario = order_data.get("id_usuario") if hasattr(order_data, "get") else None
        direccion_envio = None
        if id_usuario is not None:
            addr_query = text("""
            SELECT id_direccion, nombre_direccion, calle_direccion, ciudad, departamento,
                   codigo_postal, barrio, referencias, complemento, ind_principal, ind_activa
            FROM tab_direcciones_usuario
            WHERE id_usuario = :id_usuario AND ind_activa = TRUE
            ORDER BY ind_principal DESC NULLS LAST
            LIMIT 1
            """)
            addr_result = db.execute(addr_query, {"id_usuario": id_usuario})
            addr_row = addr_result.mappings().first()
            if addr_row:
                direccion_envio = _row_to_dict(addr_row)
                # El frontend espera campos opcionales; `complemento` puede actuar como número.
                if direccion_envio.get("complemento"):
                    direccion_envio["numero_direccion"] = direccion_envio.get("complemento")
                # Teléfono de contacto desde datos del usuario en orden.
                if order_data.get("cel_usuario"):
                    direccion_envio["telefono_contacto"] = str(order_data.get("cel_usuario"))
        
        orden_dict = _row_to_dict(order_data)
        descuentos = order_data.get("detalle_descuentos_aplicados") if hasattr(order_data, "get") else orden_dict.get("detalle_descuentos_aplicados")

        # Mapear ítems al formato esperado por el panel admin.
        productos_list: list[dict[str, Any]] = []
        for it in raw_items:
            productos_list.append(
                {
                    "id_producto": it.get("id_producto"),
                    "nom_producto": it.get("product_name"),
                    "cantidad": it.get("quantity"),
                    "val_precio_unitario": it.get("unit_price"),
                    "val_subtotal": it.get("total_price"),
                    "opciones_elegidas": it.get("opciones_elegidas") or {},
                    "imagen_url": it.get("imagen_url"),
                }
            )
        
        return {
            "orden": orden_dict,
            "productos": productos_list,
            "direccion_envio": direccion_envio,
            "puntos_ganados": points_value,
            "descuentos_aplicados": descuentos
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener detalle de orden: {str(e)}")


def update_order_status_admin(db: Session, id_orden: int, new_status: int, usr_update: Decimal):
    """
    Actualiza el estado de una orden.
    
    Args:
        db (Session): Sesión de base de datos
        id_orden (int): ID de la orden
        new_status (int): Nuevo estado (1=Pendiente, 2=Completada, 3=Cancelada)
        usr_update (Decimal): ID del usuario que actualiza

    Uso:
    - Endpoint admin de cambio manual de estado.
    """
    try:
        query = text("""
        UPDATE tab_ordenes 
        SET ind_estado = :new_status, usr_update = :usr_update, fec_update = NOW()
        WHERE id_orden = :id_orden
        """)
        result = db.execute(query, {
            "id_orden": id_orden,
            "new_status": new_status,
            "usr_update": usr_update
        })
        db.commit()
        
        if result.rowcount == 0:
            raise Exception("Orden no encontrada")
            
        return True
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar estado de orden: {str(e)}")


def get_orders_by_user(db:Session, id_usuario: Decimal):
    """
    Obtiene todas las órdenes de un usuario específico.

    Se usa para historial en perfil de cliente.
    """
    try:
        query = text("""
        SELECT
            id_orden,
            fec_pedido,
            id_usuario,
            val_total_productos,
            val_total_descuentos,
            val_total_pedido,
            ind_estado,
            metodo_pago,
            id_descuento,
            detalle_descuentos_aplicados,
            des_observaciones,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_ordenes
        WHERE id_usuario = :id_usuario
        ORDER BY fec_insert DESC
        """)
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener las órdenes del usuario: {str(e)}")


def get_order_by_id(db:Session, id_orden: Decimal):
    """
    Obtiene una orden específica por su identificador.

    Nota:
    - Devuelve solo cabecera de orden (sin items).
    """
    try:
        query = text("""
        SELECT
            id_orden,
            fec_pedido,
            id_usuario,
            val_total_productos,
            val_total_descuentos,
            val_total_pedido,
            ind_estado,
            metodo_pago,
            id_descuento,
            detalle_descuentos_aplicados,
            des_observaciones,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_ordenes
        WHERE id_orden = :id_orden
        """)
        result = db.execute(query, {"id_orden": id_orden})
        return result.mappings().first()
    except Exception as e:
        
        raise Exception(f"Error al obtener la orden: {str(e)}")


def get_order_detail(db:Session, id_orden: Decimal):
    """
    Obtiene los detalles de una orden específica.

    Nota:
    - Similar a `get_order_by_id`; se mantiene por compatibilidad histórica.
    """
    try:
        query = text("""
        SELECT
            id_orden,
            fec_pedido,
            id_usuario,
            val_total_productos,
            val_total_descuentos,
            val_total_pedido,
            ind_estado,
            metodo_pago,
            id_descuento,
            detalle_descuentos_aplicados,
            des_observaciones,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_ordenes
        WHERE id_orden = :id_orden
        """)
        result = db.execute(query, {"id_orden": id_orden})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener los detalles de la orden: {str(e)}")
    

def create_order(
    db: Session,
    order: OrderCreate,
    usr_insert: Decimal,
    ind_estado: int | None = None,
    metodo_pago: str | None = None,
):
    """
    Crea una nueva orden en la base de datos.
    Utiliza la función de base de datos `fun_crear_orden_desde_carrito` para crear la orden.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        order (OrderCreate): Un objeto Pydantic `OrderCreate` con los datos a insertar.
        usr_insert (Decimal): El identificador del usuario que insertó la orden.
        ind_estado (int | None): Estado inicial (1=Pendiente, 2=Pagada). Si None, usa default BD.
        metodo_pago (str | None): Método de pago cuando ya está aprobado ('tarjeta', 'transferencia', etc).
    Returns:
        dict: El diccionario completo con toda la información de la orden creada.

    Flujo:
    1. Normaliza parámetros opcionales (`id_canje`, `metodo_pago`, estado inicial).
    2. Invoca `fun_crear_orden_desde_carrito` (lógica fuerte en BD).
    3. Intenta parsear respuesta JSON (dict o string).
    4. Retorna contrato completo al llamador.
    """
    try:
        # Construir params explícitos para asegurar envío de `id_canje` a BD.
        id_canje_val = None
        if getattr(order, "id_canje", None) is not None:
            try:
                id_canje_val = int(order.id_canje)
            except (TypeError, ValueError):
                pass
        params = {
            "id_carrito": int(order.id_carrito),
            "id_direccion": int(order.id_direccion),
            "codigo_descuento": order.codigo_descuento,
            "des_observaciones": order.des_observaciones,
            "usr_insert": usr_insert,
            "id_canje": id_canje_val,
            "ind_estado": ind_estado,
            "metodo_pago": metodo_pago,
        }
        logger.info("create_order: id_carrito=%s, id_canje=%s, ind_estado=%s (descuento por puntos)", params["id_carrito"], params["id_canje"], ind_estado)
        query = text("""
        SELECT fun_crear_orden_desde_carrito(
            :id_carrito,
            :id_direccion,
            :codigo_descuento,
            :des_observaciones,
            :usr_insert,
            :id_canje,
            :ind_estado,
            :metodo_pago
        )
        """).bindparams(bindparam("id_canje", type_=Integer))
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        if fetched_result and fetched_result[0]:
            response_data = fetched_result[0]
            if isinstance(response_data, dict):
                logger.info(
                    "create_order resultado: total_descuentos=%s, total_final=%s (id_canje enviado=%s)",
                    response_data.get("total_descuentos"),
                    response_data.get("total_final"),
                    params.get("id_canje"),
                )
                return response_data
            # Algunos drivers devuelven JSON serializado en string.
            if isinstance(response_data, str):
                import json
                try:
                    data = json.loads(response_data)
                    logger.info("create_order resultado (parseado): total_descuentos=%s, total_final=%s", data.get("total_descuentos"), data.get("total_final"))
                    return data
                except Exception:
                    pass

        return None
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        
        # Manejo específico para errores de actualización automática de stock.
        if "fun_actualizar_stock_automatico" in error_msg and "usr_insert" in error_msg:
            raise Exception(
                "La orden se está procesando pero hay un problema con la actualización automática de stock. "
                "Por favor, contacta al administrador para verificar el inventario. "
                f"Detalles técnicos: {error_msg}"
            )
        
        # Para otros errores, mantener mensaje original.
        raise Exception(f"Error al crear la orden: {error_msg}")


def _pick_first_key(d: dict, keys: list, default=None):
    """Retorna el primer valor no nulo encontrado entre varias claves."""
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return default


def _decimal_to_number(v):
    """Convierte Decimal a int/float para JSON; deja otros tipos intactos."""
    if v is None:
        return None
    if isinstance(v, Decimal):
        return int(v) if v % 1 == 0 else float(v)
    return v


def get_order_with_items(db: Session, id_orden: Decimal):
    """
    Devuelve la orden y un arreglo `items` con el snapshot de productos comprados
    (nombre, cantidad, precio unitario, total, variante y atributos). Usa variant_id
    en tab_orden_productos y JOIN a tab_product_variant_combinations + tab_products.

    Objetivo principal:
    - entregar detalle histórico estable, aunque productos/variantes cambien luego.
    """
    # 1) Obtener la orden base.
    id_orden_val = int(id_orden) if id_orden is not None else None
    if id_orden_val is None:
        return None
    order = get_order_by_id(db, Decimal(id_orden_val))
    if not order:
        return None

    items = []
    try:
        # Diagnóstico: comprobar si existen filas en `tab_orden_productos`.
        count_result = db.execute(
            text("SELECT COUNT(*) AS n FROM tab_orden_productos WHERE id_orden = :id_orden"),
            {"id_orden": id_orden_val},
        )
        count_row = count_result.mappings().first()
        num_rows_in_table = int(count_row["n"]) if count_row and count_row.get("n") is not None else 0

        # 2) `tab_orden_productos` usa `variant_id`.
        # LEFT JOIN evita perder filas si producto/variante se inactivó después.
        query_items = text(
            """
            SELECT
                op.id_orden,
                op.id_orden_producto AS id_item,
                p.id AS id_producto,
                p.category_id AS id_categoria,
                pv.id AS variant_id,
                COALESCE(p.name, 'Producto') AS product_name,
                op.cant_producto AS quantity,
                op.precio_unitario_orden AS unit_price,
                op.subtotal AS total_price,
                COALESCE(
                    (SELECT pvi.image_url
                     FROM tab_product_variant_images pvi
                     WHERE pvi.variant_group_id = pv.group_id
                     ORDER BY pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
                     LIMIT 1),
                    (SELECT pvi.image_url
                     FROM tab_product_variant_images pvi
                     JOIN tab_product_variant_groups g2 ON g2.id = pvi.variant_group_id
                     WHERE g2.product_id = p.id
                     ORDER BY g2.id, pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
                     LIMIT 1)
                ) AS product_image,
                COALESCE(op.opciones_elegidas, pv.attributes, '{}'::jsonb) AS opciones_elegidas
            FROM tab_orden_productos op
            LEFT JOIN tab_product_variant_combinations pv ON pv.id = op.variant_id
            LEFT JOIN tab_product_variant_groups g ON g.id = pv.group_id
            LEFT JOIN tab_products p ON p.id = g.product_id
            WHERE op.id_orden = :id_orden
            ORDER BY op.id_orden_producto ASC
            """
        )
        result_items = db.execute(query_items, {"id_orden": id_orden_val})
        rows = result_items.mappings().all()
        for row in rows:
            raw = dict(row)
            opts = raw.get("opciones_elegidas") or {}
            if isinstance(opts, str):
                try:
                    import json
                    opts = json.loads(opts) if opts else {}
                except Exception:
                    opts = {}
            if not isinstance(opts, dict):
                opts = {}
            # Estructura esperada por frontend de perfil/pedidos.
            it = {
                "id_orden": _decimal_to_number(raw.get("id_orden")),
                "id_item": _decimal_to_number(raw.get("id_item")),
                "id_producto": _decimal_to_number(raw.get("id_producto")),
                "id_categoria": _decimal_to_number(raw.get("id_categoria")),
                "id_linea": None,
                "id_sublinea": None,
                "variant_id": _decimal_to_number(raw.get("variant_id")),
                "product_name": raw.get("product_name") or "",
                "quantity": _decimal_to_number(raw.get("quantity")) or 0,
                "unit_price": _decimal_to_number(raw.get("unit_price")) or 0,
                "total_price": _decimal_to_number(raw.get("total_price")) or 0,
                "product_image": raw.get("product_image"),
                "imagen_url": raw.get("product_image"),
                "opciones_elegidas": opts,
            }
            items.append(it)
        if not rows and id_orden_val:
            if num_rows_in_table > 0:
                logger.warning(
                    "get_order_with_items: orden id_orden=%s tiene %s filas en tab_orden_productos pero la query con JOIN devolvió 0. Revisar variant_id/product_id.",
                    id_orden_val, num_rows_in_table,
                )
            else:
                logger.info(
                    "get_order_with_items: orden id_orden=%s sin filas en tab_orden_productos (orden creada sin ítems o datos antiguos).",
                    id_orden_val,
                )
    except Exception as e:
        logger.exception("get_order_with_items: error al cargar ítems para id_orden=%s: %s", id_orden_val, e)
        items = []

    enriched = dict(order)
    enriched["items"] = items
    return enriched


def update_order_payment_info(db: Session, id_orden: Decimal, metodo_pago: str | None = None, ind_estado: int | None = None, commit: bool = True):
    """
    Actualiza `metodo_pago` y/o `ind_estado` de una orden.
    
    Args:
        db: Sesión de base de datos
        id_orden: ID de la orden
        metodo_pago: Método de pago (opcional)
        ind_estado: Estado de la orden (opcional)
        commit: Si True, hace commit. Si False, deja que el llamador maneje el commit.

    Esta función es clave en flujos de pago:
    - Se llama desde router/order y servicios de pago.
    - Permite actualizar método de pago y estado de orden de forma controlada.
    - Cuando hay cambio de estado, puede disparar lógica derivada (triggers/notificaciones).
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"🔍 update_order_payment_info: id_orden={id_orden}, metodo_pago={metodo_pago}, ind_estado={ind_estado}, commit={commit}")
        old_state = None

        # Verificar estado anterior ANTES del UPDATE para entender triggers.
        if ind_estado is not None:
            check_old_state_query = text("SELECT ind_estado FROM tab_ordenes WHERE id_orden = :id_orden")
            old_state_result = db.execute(check_old_state_query, {"id_orden": id_orden})
            old_state_row = old_state_result.fetchone()
            if old_state_row:
                old_state = old_state_row.ind_estado
                logger.info(f"🔍 Estado ANTERIOR de la orden {id_orden}: {old_state} (tipo: {type(old_state)})")
                logger.info(f"🔍 Estado NUEVO a establecer: {ind_estado} (tipo: {type(ind_estado)})")
                if old_state == ind_estado:
                    logger.warning(f"⚠️ ADVERTENCIA: La orden {id_orden} ya está en estado {ind_estado}. Los triggers NO se ejecutarán.")
                elif old_state == 2 and ind_estado == 2:
                    logger.warning(f"⚠️ ADVERTENCIA: La orden {id_orden} ya está pagada (estado 2). Los triggers NO se ejecutarán.")
                else:
                    logger.info(f"✅ Cambio de estado detectado: {old_state} → {ind_estado}. Los triggers DEBERÍAN ejecutarse.")
            else:
                logger.error(f"❌ No se encontró la orden {id_orden} para verificar estado anterior")
        
        sets = []
        params = {"id_orden": id_orden}
        if metodo_pago is not None:
            sets.append("metodo_pago = :metodo_pago")
            params["metodo_pago"] = metodo_pago
        if ind_estado is not None:
            sets.append("ind_estado = :ind_estado")
            params["ind_estado"] = ind_estado
        if not sets:
            logger.warning(f"⚠️ No hay campos para actualizar en orden {id_orden}")
            return
        sets.append("fec_update = NOW()")
        query = text(f"UPDATE tab_ordenes SET {', '.join(sets)} WHERE id_orden = :id_orden")
        logger.info(f"🔍 Ejecutando query: UPDATE tab_ordenes SET {', '.join(sets)} WHERE id_orden = :id_orden")
        logger.info(f"🔍 Parámetros: {params}")
        
        # IMPORTANTE: los triggers se ejecutan tras UPDATE + COMMIT.
        # Si `ind_estado` cambia de !=2 a 2, deberían ejecutarse:
        # - trg_limpiar_carrito_pagado
        # - trg_actualizar_stock_orden_pagada
        # - trg_orden_acumular_puntos
        if ind_estado == 2:
            logger.info(f"🔔 IMPORTANTE: Actualizando orden {id_orden} a estado 2 (Pagada). Los triggers DEBERÍAN ejecutarse automáticamente:")
            logger.info(f"   - trg_limpiar_carrito_pagado (limpia el carrito del usuario)")
            logger.info(f"   - trg_actualizar_stock_orden_pagada (reduce el stock)")
            logger.info(f"   - trg_orden_acumular_puntos (acumula puntos al usuario)")
        
        result = db.execute(query, params)
        rows_affected = result.rowcount
        logger.info(f"✅ UPDATE ejecutado: {rows_affected} fila(s) afectada(s) para orden {id_orden}")
        
        # Verificar estado después del UPDATE (antes de commit).
        if ind_estado is not None:
            verify_after_query = text("SELECT ind_estado FROM tab_ordenes WHERE id_orden = :id_orden")
            verify_after_result = db.execute(verify_after_query, {"id_orden": id_orden})
            verify_after_row = verify_after_result.fetchone()
            if verify_after_row:
                logger.info(f"🔍 Estado DESPUÉS del UPDATE (antes del commit): {verify_after_row.ind_estado}")
                if verify_after_row.ind_estado == 2:
                    logger.info(f"✅ Orden {id_orden} actualizada a estado 2. Los triggers se ejecutarán al hacer commit.")
        if rows_affected == 0:
            logger.error(f"❌ ERROR CRÍTICO: No se actualizó ninguna fila para orden {id_orden}. ¿Existe la orden?")
            # Verificar si la orden realmente existe.
            check_query = text("SELECT id_orden, ind_estado, metodo_pago FROM tab_ordenes WHERE id_orden = :id_orden")
            check_result = db.execute(check_query, {"id_orden": id_orden})
            check_row = check_result.fetchone()
            if check_row:
                logger.error(f"❌ La orden existe pero no se actualizó. Estado actual: {check_row.ind_estado}, Método pago: {check_row.metodo_pago}")
            else:
                logger.error(f"❌ La orden {id_orden} NO EXISTE en la base de datos")
            raise Exception(f"No se pudo actualizar la orden {id_orden}. Verifique que la orden existe.")
        if commit:
            db.commit()
            logger.info(f"✅ Commit realizado para orden {id_orden}")
            # Tras commit: si cambia a pagada/completada por primera vez,
            # puede disparar notificaciones de stock.
            if (
                ind_estado is not None
                and int(ind_estado) in (2, 3)
                and old_state is not None
                and int(old_state) not in (2, 3)
            ):
                try:
                    notify_after_order_paid_stock_change(db, id_orden)
                except Exception as notify_err:
                    logger.warning(
                        "Notificación sin stock post-pago omitida para orden %s: %s",
                        id_orden,
                        notify_err,
                    )
    except Exception as e:
        logger.error(f"❌ Error en update_order_payment_info: {str(e)}")
        if commit:
            db.rollback()
            logger.error(f"❌ Rollback realizado debido al error")
        raise Exception(f"Error al actualizar la orden: {str(e)}")
    

