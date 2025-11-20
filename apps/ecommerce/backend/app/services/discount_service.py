from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.discount_schema import DiscountCreate, DiscountUpdate

def get_discounts(db:Session):
    """
    Obtiene todos los descuentos registrados en la base de datos.

    """
    try:
        query = text("""
        SELECT
            id_descuento,
            nom_descuento,
            des_descuento,
            tipo_calculo,
            val_porce_descuento,
            val_monto_descuento,
            aplica_a,
            id_categoria,
            id_linea,
            id_sublinea,
            id_producto_aplica,
            id_categoria_aplica,
            id_marca_aplica,
            id_linea_aplica,
            id_sublinea_aplica,
            min_valor_pedido,
            ind_es_para_cumpleanos,
            fec_inicio,
            fec_fin,
            ind_activo,
            max_usos_total,
            usos_actuales_total,
            costo_puntos_canje,
            ind_canjeable_puntos,
            codigo_descuento,
            max_usos_por_usuario,
            dias_semana_aplica,
            horas_inicio,
            horas_fin,
            solo_primera_compra,
            monto_minimo_producto,
            cantidad_minima_producto,
            requiere_codigo,
            usr_insert,
            usr_update,
            fec_insert,
            fec_update
        FROM tab_descuentos
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuentos: {str(e)}")
    
def get_discount_exchangeable(db:Session, id_usuario:Decimal, limit:int = 20):
    """
    Obtiene todos descuentos canjeables en la base de datos.
    """
    try:
        query = text("""
        SELECT * FROM fun_listar_descuentos_canjeables(
            :id_usuario,
            :limit
        )
        """)
        result = db.execute(query, {'id_usuario': id_usuario, 'limit': limit})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuentos canjeables: {str(e)}")

def create_discount(db:Session, discount:DiscountCreate, usr_insert:Decimal):
    """
    Crea un nuevo descuento en la base de datos.
    
    Utiliza la función de base de datos `fun_insert_descuento` para insertar
    un nuevo descuento, identificado por `id_descuento`. Los datos para la
    inserción se toman del esquema `DiscountCreate` (solo campos proporcionados).
    """
    import json
    try:
        params = discount.model_dump()
        
        # Preparar todos los parámetros que la función SQL espera
        # Nota: El orden y nombre de parámetros debe coincidir exactamente con la función SQL
        sql_params = {
            'nom_descuento': params.get('nom_descuento'),
            'des_descuento': params.get('des_descuento'),
            'tipo_calculo': params.get('tipo_calculo'),
            'val_porce_descuento': params.get('val_porce_descuento'),
            'val_monto_descuento': params.get('val_monto_descuento'),
            'aplica_a': params.get('aplica_a'),
            'id_categoria': params.get('id_categoria'),
            'id_linea': params.get('id_linea'),
            'id_sublinea': params.get('id_sublinea'),
            'id_producto_aplica': params.get('id_producto_aplica'),
            'id_categoria_aplica': params.get('id_categoria_aplica'),
            'id_marca_aplica': params.get('id_marca_aplica'),
            'id_linea_aplica': params.get('id_linea_aplica'),
            'id_sublinea_aplica': params.get('id_sublinea_aplica'),
            'min_valor_pedido': params.get('min_valor_pedido'),
            'ind_es_para_cumpleanos': params.get('ind_es_para_cumpleanos'),
            'fec_inicio': params.get('fec_inicio'),
            'fec_fin': params.get('fec_fin'),
            'ind_activo': params.get('ind_activo'),
            'max_usos_total': params.get('max_usos_total'),
            'costo_puntos_canje': params.get('costo_puntos_canje'),
            'ind_canjeable_puntos': params.get('ind_canjeable_puntos'),
            'codigo_descuento': params.get('codigo_descuento'),
            'max_usos_por_usuario': params.get('max_usos_por_usuario'),
            'dias_semana_aplica': params.get('dias_semana_aplica'),
            'horas_inicio': params.get('horas_inicio'),
            'horas_fin': params.get('horas_fin'),
            'solo_primera_compra': params.get('solo_primera_compra'),
            'monto_minimo_producto': params.get('monto_minimo_producto'),
            'cantidad_minima_producto': params.get('cantidad_minima_producto'),
            'requiere_codigo': params.get('requiere_codigo'),
            'usr_operacion': usr_insert  # Nombre correcto del parámetro en la función SQL
        }
        
        query = text("""
        SELECT fun_insert_descuento(
            :nom_descuento,
            :des_descuento,
            :tipo_calculo,
            :val_porce_descuento,
            :val_monto_descuento,
            :aplica_a,
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :id_producto_aplica,
            :id_categoria_aplica,
            :id_marca_aplica,
            :id_linea_aplica,
            :id_sublinea_aplica,     
            :min_valor_pedido,
            :ind_es_para_cumpleanos,
            :fec_inicio,
            :fec_fin,
            :ind_activo,
            :max_usos_total,
            :costo_puntos_canje,
            :ind_canjeable_puntos,
            :codigo_descuento,
            :max_usos_por_usuario,
            :dias_semana_aplica,
            :horas_inicio,
            :horas_fin,
            :solo_primera_compra,
            :monto_minimo_producto,
            :cantidad_minima_producto,
            :requiere_codigo,
            :usr_operacion
        )
        """)
        result = db.execute(query, sql_params)
        fetched_result = result.fetchone()
        db.commit()
        
        # La función devuelve un JSON, necesitamos parsearlo
        if fetched_result and fetched_result[0]:
            result_json = json.loads(fetched_result[0]) if isinstance(fetched_result[0], str) else fetched_result[0]
            
            # Verificar si la operación fue exitosa
            if result_json.get('success') == False:
                raise Exception(result_json.get('message', 'Error desconocido al crear descuento'))
            
            return result_json.get('id_descuento')
        
        raise Exception('No se pudo crear el descuento')
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear descuento: {str(e)}")
    
def update_discount(db:Session, id_descuento:Decimal, discount:DiscountUpdate, usr_update:Decimal):
    """
    Actualiza un descuento existente en la base de datos.
    
    Utiliza la función de base de datos `fun_update_descuento` para actualizar
    un descuento existente, identificado por `id_descuento`. Los datos para la
    actualización se toman del esquema `DiscountUpdate` (solo campos proporcionados).
    """
    try:
        params = discount.model_dump(exclude_unset=True)
        params["id_descuento"] = id_descuento
        params["usr_update"] = usr_update
        query = text("""
        SELECT fun_update_descuento(
            :id_descuento,
            :nom_descuento,
            :des_descuento,
            :tipo_calculo,
            :val_porce_descuento,
            :val_monto_descuento,
            :aplica_a,
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :id_producto_aplica,
            :id_categoria_aplica,
            :id_marca_aplica,
            :id_linea_aplica,
            :id_sublinea_aplica,
            :min_valor_pedido,
            :ind_es_para_cumpleanos,
            :fec_inicio,
            :fec_fin,
            :max_usos_total,
            :costo_puntos_canje,
            :ind_canjeable_puntos,
            :codigo_descuento,
            :max_usos_por_usuario,
            :dias_semana_aplica,
            :horas_inicio,
            :horas_fin,
            :solo_primera_compra,
            :monto_minimo_producto,
            :cantidad_minima_producto,
            :requiere_codigo,
            :usr_update
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar descuento: {str(e)}")
    
def deactivate_activate_discount(db:Session, id_descuento:Decimal, activar:bool, usr_update:Decimal):
    """
    Desactiva o activa un descuento existente en la base de datos.
    
    Utiliza la función de base de datos `fun_activar_desactivar_descuento` para
    desactivar o activar un descuento existente, identificado por `id_descuento`.
    """
    try:
        query = text("""
        SELECT fun_activar_desactivar_descuento(
            :id_descuento,
            :activar,
            :usr_update
        )
        """)
        result = db.execute(query, {'id_descuento': id_descuento, 'activar': activar, 'usr_update': usr_update})
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar o activar descuento: {str(e)}")


def get_discount_stats(db: Session):
    """
    Obtiene estadísticas generales de descuentos para el panel de administración.
    
    Args:
        db (Session): Sesión de base de datos
        
    Returns:
        dict: Estadísticas de descuentos
    """
    try:
        query = text("""
        SELECT 
            COUNT(*) FILTER (WHERE ind_activo = TRUE) as total_activos,
            COUNT(*) FILTER (WHERE ind_activo = FALSE) as total_inactivos,
            (SELECT COUNT(*) FROM tab_canjes_puntos_descuentos) as total_canjes,
            (SELECT COALESCE(SUM(puntos_utilizados), 0) FROM tab_canjes_puntos_descuentos) as total_puntos_canjeados
        FROM tab_descuentos
        """)
        result = db.execute(query)
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener estadísticas de descuentos: {str(e)}")


def get_discount_exchanges(db: Session, id_descuento: Decimal):
    """
    Obtiene el historial de canjes de un descuento específico.
    
    Args:
        db (Session): Sesión de base de datos
        id_descuento (Decimal): ID del descuento
        
    Returns:
        list: Lista de canjes del descuento
    """
    try:
        query = text("""
        SELECT 
            c.id_canje, 
            c.id_usuario, 
            u.nom_usuario, 
            u.ape_usuario, 
            u.email_usuario,
            c.puntos_utilizados, 
            c.ind_utilizado, 
            c.fec_utilizacion, 
            c.fec_expiracion_canje,
            c.fec_insert as fec_canje, 
            c.id_orden_aplicado
        FROM tab_canjes_puntos_descuentos c
        JOIN tab_usuarios u ON c.id_usuario = u.id_usuario
        WHERE c.id_descuento = :id_descuento
        ORDER BY c.fec_insert DESC
        """)
        result = db.execute(query, {"id_descuento": id_descuento})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener canjes del descuento: {str(e)}")


def get_discount_by_code(db: Session, codigo_descuento: str):
    """
    Obtiene un descuento por su código.
    
    Args:
        db (Session): Sesión de base de datos
        codigo_descuento (str): Código del descuento a buscar
        
    Returns:
        dict: Descuento encontrado o None
    """
    try:
        query = text("""
        SELECT
            id_descuento,
            nom_descuento,
            des_descuento,
            tipo_calculo,
            val_porce_descuento,
            val_monto_descuento,
            aplica_a,
            id_categoria,
            id_linea,
            id_sublinea,
            id_producto_aplica,
            id_categoria_aplica,
            id_marca_aplica,
            id_linea_aplica,
            id_sublinea_aplica,
            min_valor_pedido,
            fec_inicio,
            fec_fin,
            ind_activo,
            max_usos_total,
            usos_actuales_total,
            costo_puntos_canje,
            ind_canjeable_puntos,
            codigo_descuento,
            max_usos_por_usuario,
            requiere_codigo
        FROM tab_descuentos
        WHERE codigo_descuento = :codigo_descuento
            AND ind_activo = TRUE
            AND (fec_inicio IS NULL OR fec_inicio <= CURRENT_DATE)
            AND (fec_fin IS NULL OR fec_fin >= CURRENT_DATE)
        LIMIT 1
        """)
        result = db.execute(query, {'codigo_descuento': codigo_descuento.upper()})
        discount = result.mappings().first()
        return discount
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al buscar descuento por código: {str(e)}")


def validate_discount_for_cart(db: Session, codigo_descuento: str, id_usuario: Decimal, id_carrito: Decimal = None):
    """
    Valida si un código de descuento es aplicable al carrito actual del usuario.
    
    Args:
        db (Session): Sesión de base de datos
        codigo_descuento (str): Código del descuento a validar
        id_usuario (Decimal): ID del usuario
        id_carrito (Decimal): ID del carrito (opcional, se busca si no se proporciona)
        
    Returns:
        dict: Información del descuento y validación, o None si no es válido
    """
    try:
        # Primero obtener el descuento por código
        discount = get_discount_by_code(db, codigo_descuento)
        if not discount:
            return None
        
        # Obtener o buscar el carrito del usuario
        if not id_carrito:
            cart_query = text("""
            SELECT id_carrito 
            FROM tab_carritos 
            WHERE id_usuario = :id_usuario 
            ORDER BY fec_insert DESC 
            LIMIT 1
            """)
            cart_result = db.execute(cart_query, {'id_usuario': id_usuario})
            cart_row = cart_result.fetchone()
            if cart_row:
                id_carrito = cart_row[0]
            else:
                return None
        
        # Calcular total del carrito
        total_query = text("""
        SELECT COALESCE(SUM(cantidad * precio_unitario_carrito), 0) as total
        FROM tab_carrito_productos
        WHERE id_carrito = :id_carrito
        """)
        total_result = db.execute(total_query, {'id_carrito': id_carrito})
        total_row = total_result.fetchone()
        total_carrito = float(total_row[0]) if total_row and total_row[0] else 0.0
        
        # Verificar si el descuento es aplicable usando la función de validación
        validation_query = text("""
        SELECT fun_validar_descuento_aplicable(
            :id_descuento, 
            :id_usuario, 
            :codigo_ingresado, 
            :usr_insert
        ) as es_aplicable
        """)
        validation_result = db.execute(validation_query, {
            'id_descuento': discount['id_descuento'],
            'id_usuario': id_usuario,
            'codigo_ingresado': codigo_descuento.upper(),
            'usr_insert': id_usuario
        })
        validation_row = validation_result.fetchone()
        es_aplicable = validation_row[0] if validation_row else False
        
        # Verificar monto mínimo del pedido
        if discount.get('min_valor_pedido') and total_carrito < float(discount['min_valor_pedido']):
            es_aplicable = False
        
        # Calcular el descuento que se aplicaría
        descuento_calculado = 0.0
        if es_aplicable and total_carrito > 0:
            if discount.get('aplica_a') == 'total_pedido':
                if discount.get('tipo_calculo'):  # Porcentaje
                    descuento_calculado = total_carrito * float(discount.get('val_porce_descuento', 0)) / 100
                else:  # Monto fijo
                    descuento_calculado = min(float(discount.get('val_monto_descuento', 0)), total_carrito)
        
        return {
            'descuento': discount,
            'es_aplicable': es_aplicable,
            'total_carrito': total_carrito,
            'descuento_calculado': descuento_calculado,
            'total_con_descuento': max(0, total_carrito - descuento_calculado)
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al validar descuento para carrito: {str(e)}")


def get_active_discounts(db: Session, limit: int = 50):
    """
    Obtiene todos los descuentos activos disponibles para usuarios.
    Filtra por descuentos activos, dentro de fechas de vigencia y con usos disponibles.
    
    Args:
        db (Session): Sesión de base de datos
        limit (int): Límite de resultados a retornar
        
    Returns:
        list: Lista de descuentos activos disponibles
    """
    try:
        query = text("""
        SELECT
            id_descuento,
            nom_descuento,
            des_descuento,
            tipo_calculo,
            val_porce_descuento,
            val_monto_descuento,
            aplica_a,
            id_categoria,
            id_linea,
            id_sublinea,
            id_producto_aplica,
            id_categoria_aplica,
            id_marca_aplica,
            id_linea_aplica,
            id_sublinea_aplica,
            min_valor_pedido,
            fec_inicio,
            fec_fin,
            ind_activo,
            max_usos_total,
            usos_actuales_total,
            costo_puntos_canje,
            ind_canjeable_puntos,
            codigo_descuento,
            max_usos_por_usuario,
            requiere_codigo
        FROM tab_descuentos
        WHERE ind_activo = TRUE
            AND (fec_inicio IS NULL OR fec_inicio <= CURRENT_DATE)
            AND (fec_fin IS NULL OR fec_fin >= CURRENT_DATE)
            AND (max_usos_total IS NULL OR usos_actuales_total IS NULL OR usos_actuales_total < max_usos_total)
        ORDER BY fec_inicio DESC, nom_descuento ASC
        LIMIT :limit
        """)
        result = db.execute(query, {'limit': limit})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuentos activos: {str(e)}")