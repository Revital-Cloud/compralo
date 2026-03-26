"""
Servicios de descuentos y cupones.

Responsabilidad:
- Implementar consultas/operaciones de descuentos para endpoints públicos y
  administrativos.
- Encapsular integración con funciones SQL de negocio de descuentos.
- Resolver validación de aplicabilidad para carrito y usuario.
"""

import json
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.discount_schema import DiscountCreate, DiscountUpdate

def get_discounts(db:Session):
    """
    Lista todos los descuentos registrados para administración.

    Fuente principal:
    - `tab_descuentos`

    Compatibilidad:
    - Mapea `category_id_aplica/product_id_aplica` a
      `id_categoria_aplica/id_producto_aplica` para mantener contrato API.
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
            category_id_aplica,
            product_id_aplica,
            id_marca_aplica,
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
            id_usuario_destino,
            usr_insert,
            usr_update,
            fec_insert,
            fec_update
        FROM tab_descuentos
        """)
        result = db.execute(query)
        rows = result.mappings().all()
        # Mapear para el esquema: columnas que espera el frontend pero no existen en la tabla
        mapped = []
        for row in rows:
            r = dict(row)
            r["id_producto_aplica"] = r.get("product_id_aplica")
            r["id_categoria_aplica"] = r.get("category_id_aplica")
            mapped.append(r)
        return mapped
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuentos: {str(e)}")
    
def get_discount_exchangeable(db:Session, id_usuario:Decimal, limit:int = 20):
    """
    Obtiene descuentos canjeables por puntos para un usuario.

    Fuente:
    - Función SQL `fun_listar_descuentos_canjeables`.
    """
    try:
        query = text("""
        SELECT
            id_descuento,
            nom_descuento,
            des_descuento,
            costo_puntos_canje,
            tipo_calculo_texto,
            valor_descuento,
            aplica_a,
            fec_inicio,
            fec_fin,
            puede_canjear,
            puntos_usuario
        FROM fun_listar_descuentos_canjeables(
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
    Crea un descuento nuevo vía función SQL transaccional.

    Flujo:
    1) Convierte payload Pydantic a params SQL.
    2) Normaliza nombres API -> BD (`id_*_aplica` a `*_id_aplica` esperado).
    3) Ejecuta `fun_insert_descuento`.
    4) Parsea respuesta JSON y valida `success`.
    """
    import json
    try:
        params = discount.model_dump()
        # API usa id_categoria_aplica / id_producto_aplica; la BD usa category_id_aplica / product_id_aplica
        sql_params = {
            'nom_descuento': params.get('nom_descuento'),
            'des_descuento': params.get('des_descuento'),
            'tipo_calculo': params.get('tipo_calculo'),
            'val_porce_descuento': params.get('val_porce_descuento'),
            'val_monto_descuento': params.get('val_monto_descuento'),
            'aplica_a': params.get('aplica_a'),
            'category_id_aplica': params.get('id_categoria_aplica'),
            'product_id_aplica': params.get('id_producto_aplica'),
            'id_marca_aplica': params.get('id_marca_aplica'),
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
            'usr_operacion': usr_insert,
            'id_usuario_destino': params.get('id_usuario_destino'),
        }
        query = text("""
        SELECT fun_insert_descuento(
            :nom_descuento,
            :des_descuento,
            :tipo_calculo,
            :val_porce_descuento,
            :val_monto_descuento,
            :aplica_a,
            :category_id_aplica,
            :product_id_aplica,
            :id_marca_aplica,
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
            :usr_operacion,
            :id_usuario_destino
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
    Actualiza un descuento existente preservando campos no enviados.

    Estrategia:
    - Lee estado actual en BD.
    - Mezcla con `exclude_unset=True` del payload.
    - Ejecuta `fun_update_descuento` con set completo de parámetros.
    - Valida respuesta JSON `success`.
    """
    try:
        # Obtener el descuento actual (columnas reales de tab_descuentos)
        fetch_query = text("""
        SELECT
            nom_descuento, des_descuento, tipo_calculo, val_porce_descuento, val_monto_descuento,
            aplica_a, category_id_aplica, product_id_aplica, id_marca_aplica,
            min_valor_pedido, ind_es_para_cumpleanos,
            fec_inicio, fec_fin, max_usos_total, costo_puntos_canje, ind_canjeable_puntos,
            codigo_descuento, max_usos_por_usuario, dias_semana_aplica, horas_inicio, horas_fin,
            solo_primera_compra, monto_minimo_producto, cantidad_minima_producto, requiere_codigo,
            id_usuario_destino
        FROM tab_descuentos
        WHERE id_descuento = :id_descuento
        """)
        fetch_result = db.execute(fetch_query, {"id_descuento": id_descuento})
        row = fetch_result.fetchone()
        if not row:
            raise Exception("El descuento especificado no existe")
        current = dict(row._mapping) if hasattr(row, "_mapping") else dict(zip(row.keys(), row))
        # El frontend puede enviar id_categoria_aplica / id_producto_aplica; normalizar a nombres de la función
        update_data = discount.model_dump(exclude_unset=True)
        if 'id_categoria_aplica' in update_data:
            update_data['category_id_aplica'] = update_data.pop('id_categoria_aplica')
        if 'id_producto_aplica' in update_data:
            update_data['product_id_aplica'] = update_data.pop('id_producto_aplica')
        params = {**current, **update_data}
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
            :category_id_aplica,
            :product_id_aplica,
            :id_marca_aplica,
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
            :usr_update,
            :id_usuario_destino
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        # La función SQL retorna JSON; verificar éxito
        if fetched_result and fetched_result[0]:
            result_json = json.loads(fetched_result[0]) if isinstance(fetched_result[0], str) else fetched_result[0]
            if result_json.get("success") is False:
                raise Exception(result_json.get("message", "Error desconocido al actualizar descuento"))
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar descuento: {str(e)}")
    
def deactivate_activate_discount(db:Session, id_descuento:Decimal, activar:bool, usr_update:Decimal):
    """
    Activa o desactiva un descuento utilizando función SQL dedicada.
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
    Obtiene estadísticas globales para panel admin.

    Incluye:
    - total activos/inactivos
    - total de canjes
    - puntos canjeados acumulados
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
    Obtiene historial de canjes de un descuento específico.
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
    Busca descuento por código normalizado (trim + uppercase).

    Reglas:
    - Solo descuentos activos y vigentes.
    - Retorna None si no existe o no aplica por fecha/estado.
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
            category_id_aplica,
            product_id_aplica,
            id_marca_aplica,
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
            requiere_codigo,
            id_usuario_destino
        FROM tab_descuentos
        WHERE UPPER(TRIM(codigo_descuento)) = UPPER(TRIM(:codigo_descuento))
            AND ind_activo = TRUE
            AND (fec_inicio IS NULL OR fec_inicio <= CURRENT_DATE)
            AND (fec_fin IS NULL OR fec_fin >= CURRENT_DATE)
        LIMIT 1
        """)
        result = db.execute(query, {'codigo_descuento': (codigo_descuento or '').strip()})
        row = result.mappings().first()
        if not row:
            return None
        r = dict(row)
        r["id_categoria_aplica"] = r.get("category_id_aplica")
        r["id_producto_aplica"] = r.get("product_id_aplica")
        return r
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al buscar descuento por código: {str(e)}")


def validate_discount_for_cart(db: Session, codigo_descuento: str, id_usuario: Decimal, id_carrito: Decimal = None):
    """
    Valida aplicabilidad real de un cupón para el carrito del usuario.

    Flujo:
    1) Busca descuento por código.
    2) Resuelve carrito (explícito o último del usuario).
    3) Calcula total de carrito.
    4) Evalúa función SQL de aplicabilidad.
    5) Añade reglas adicionales (monto mínimo, motivo de rechazo).
    6) Calcula descuento estimado y total final.
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
        # Enviar id_usuario como int para evitar fallos de comparación con id_usuario_destino (DECIMAL) en la BD
        id_usuario_int = int(id_usuario) if id_usuario is not None else None
        validation_query = text("""
        SELECT fun_validar_descuento_aplicable(
            :id_descuento,
            :id_usuario,
            :codigo_ingresado,
            :usr_insert
        ) as es_aplicable
        """)
        validation_result = db.execute(validation_query, {
            'id_descuento': int(discount['id_descuento']),
            'id_usuario': id_usuario_int,
            'codigo_ingresado': (codigo_descuento or '').strip(),
            'usr_insert': id_usuario_int
        })
        validation_row = validation_result.fetchone()
        es_aplicable = validation_row[0] if validation_row else False

        # Mensaje específico cuando el cupón es personal y no coincide el usuario
        motivo_rechazo = None
        if not es_aplicable and discount.get('id_usuario_destino') is not None:
            dest = discount['id_usuario_destino']
            if id_usuario_int is not None and int(dest) != id_usuario_int:
                motivo_rechazo = "Este cupón es personal y solo puede usarlo el destinatario."

        # Verificar monto mínimo del pedido
        if discount.get('min_valor_pedido') and total_carrito < float(discount['min_valor_pedido']):
            es_aplicable = False
            if motivo_rechazo is None:
                motivo_rechazo = f"El pedido no alcanza el monto mínimo para este cupón (mín. {discount['min_valor_pedido']})."
        
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
            'total_con_descuento': max(0, total_carrito - descuento_calculado),
            'motivo_rechazo': motivo_rechazo
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al validar descuento para carrito: {str(e)}")


def get_active_discounts(db: Session, limit: int = 50):
    """
    Lista descuentos activos de exposición pública "simple".

    Excluye explícitamente:
    - canje por puntos, cumpleaños, primera compra y requiere código.
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
            category_id_aplica,
            product_id_aplica,
            id_marca_aplica,
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
            AND COALESCE(ind_canjeable_puntos, FALSE) = FALSE
            AND COALESCE(ind_es_para_cumpleanos, FALSE) = FALSE
            AND COALESCE(solo_primera_compra, FALSE) = FALSE
            AND COALESCE(requiere_codigo, FALSE) = FALSE
            AND (fec_inicio IS NULL OR fec_inicio <= CURRENT_DATE)
            AND (fec_fin IS NULL OR fec_fin >= CURRENT_DATE)
            AND (max_usos_total IS NULL OR usos_actuales_total IS NULL OR usos_actuales_total < max_usos_total)
        ORDER BY fec_inicio DESC, nom_descuento ASC
        LIMIT :limit
        """)
        result = db.execute(query, {'limit': limit})
        rows = result.mappings().all()
        # Mapear para compatibilidad con esquema/frontend (id_*_aplica)
        mapped_rows = []
        for row in rows:
            mapped = dict(row)
            mapped['id_categoria_aplica'] = mapped.get('category_id_aplica')
            mapped['id_producto_aplica'] = mapped.get('product_id_aplica')
            mapped_rows.append(mapped)
        return mapped_rows
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuentos activos: {str(e)}")


def get_birthday_discount(db: Session):
    """
    Obtiene descuento activo configurado para cumpleaños.
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
            category_id_aplica,
            product_id_aplica,
            id_marca_aplica,
            min_valor_pedido,
            fec_inicio,
            fec_fin,
            ind_activo,
            codigo_descuento,
            requiere_codigo
        FROM tab_descuentos
        WHERE ind_activo = TRUE
            AND ind_es_para_cumpleanos = TRUE
            AND (fec_inicio IS NULL OR fec_inicio <= CURRENT_DATE)
            AND (fec_fin IS NULL OR fec_fin >= CURRENT_DATE)
            AND (max_usos_total IS NULL OR usos_actuales_total IS NULL OR usos_actuales_total < max_usos_total)
        ORDER BY fec_inicio DESC
        LIMIT 1
        """)
        result = db.execute(query)
        row = result.mappings().first()
        if not row:
            return None
        mapped = dict(row)
        mapped['id_categoria_aplica'] = mapped.get('category_id_aplica')
        mapped['id_producto_aplica'] = mapped.get('product_id_aplica')
        return mapped
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuento de cumpleaños: {str(e)}")


def get_first_purchase_discount(db: Session):
    """
    Obtiene descuento activo configurado para primera compra.
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
            category_id_aplica,
            product_id_aplica,
            id_marca_aplica,
            min_valor_pedido,
            fec_inicio,
            fec_fin,
            ind_activo,
            codigo_descuento,
            requiere_codigo
        FROM tab_descuentos
        WHERE ind_activo = TRUE
            AND solo_primera_compra = TRUE
            AND (fec_inicio IS NULL OR fec_inicio <= CURRENT_DATE)
            AND (fec_fin IS NULL OR fec_fin >= CURRENT_DATE)
            AND (max_usos_total IS NULL OR usos_actuales_total IS NULL OR usos_actuales_total < max_usos_total)
        ORDER BY fec_inicio DESC
        LIMIT 1
        """)
        result = db.execute(query)
        row = result.mappings().first()
        if not row:
            return None
        mapped = dict(row)
        mapped['id_categoria_aplica'] = mapped.get('category_id_aplica')
        mapped['id_producto_aplica'] = mapped.get('product_id_aplica')
        return mapped
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuento de primera compra: {str(e)}")


def get_user_available_discounts(db: Session, id_usuario: Decimal, limit: int = 50):
    """
    Compone descuentos disponibles para un usuario concreto.

    Incluye:
    - generales activos
    - cumpleaños (si aplica hoy)
    - primera compra (si no tiene órdenes)

    Evita duplicados por `id_descuento`.
    """
    try:
        discounts = []
        
        # 1. Obtener descuentos activos generales (sin selectores especiales)
        general_discounts = get_active_discounts(db, limit)
        discounts.extend(general_discounts)
        
        # 2. Verificar si hoy es cumpleaños del usuario y obtener descuento de cumpleaños
        birthday_query = text("""
        SELECT 1 FROM tab_usuarios 
        WHERE id_usuario = :id_usuario 
            AND fec_nacimiento IS NOT NULL
            AND EXTRACT('MONTH' FROM fec_nacimiento) = EXTRACT('MONTH' FROM CURRENT_DATE)
            AND EXTRACT('DAY' FROM fec_nacimiento) = EXTRACT('DAY' FROM CURRENT_DATE)
        """)
        birthday_result = db.execute(birthday_query, {'id_usuario': id_usuario})
        is_birthday = birthday_result.fetchone() is not None
        
        if is_birthday:
            birthday_discount = get_birthday_discount(db)
            if birthday_discount:
                # Marcar como descuento de cumpleaños para identificarlo en el frontend
                birthday_discount['es_cumpleanos'] = True
                # Evitar duplicados si ya está en general_discounts
                if not any(d.get('id_descuento') == birthday_discount.get('id_descuento') for d in discounts):
                    discounts.append(birthday_discount)
        
        # 3. Verificar si es primera compra y obtener descuento de primera compra
        first_purchase_query = text("""
        SELECT COUNT(*) as total_ordenes
        FROM tab_ordenes
        WHERE id_usuario = :id_usuario
        """)
        first_purchase_result = db.execute(first_purchase_query, {'id_usuario': id_usuario})
        first_purchase_row = first_purchase_result.fetchone()
        is_first_purchase = first_purchase_row and int(first_purchase_row[0]) == 0
        
        if is_first_purchase:
            first_purchase_discount = get_first_purchase_discount(db)
            if first_purchase_discount:
                # Marcar como descuento de primera compra
                first_purchase_discount['es_primera_compra'] = True
                # Evitar duplicados
                if not any(d.get('id_descuento') == first_purchase_discount.get('id_descuento') for d in discounts):
                    discounts.append(first_purchase_discount)
        
        return discounts
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuentos disponibles para usuario: {str(e)}")


def get_discount_by_id(db: Session, id_descuento: Decimal):
    """Obtiene un descuento por ID. Retorna dict o None."""
    try:
        query = text("""
        SELECT
            id_descuento, nom_descuento, des_descuento, tipo_calculo,
            val_porce_descuento, val_monto_descuento, aplica_a,
            category_id_aplica, product_id_aplica, id_marca_aplica,
            min_valor_pedido, fec_inicio, fec_fin, ind_activo,
            max_usos_total, usos_actuales_total, costo_puntos_canje, ind_canjeable_puntos,
            codigo_descuento, max_usos_por_usuario, requiere_codigo, id_usuario_destino
        FROM tab_descuentos
        WHERE id_descuento = :id_descuento
        LIMIT 1
        """)
        result = db.execute(query, {"id_descuento": id_descuento})
        row = result.mappings().first()
        if not row:
            return None
        r = dict(row)
        r["id_categoria_aplica"] = r.get("category_id_aplica")
        r["id_producto_aplica"] = r.get("product_id_aplica")
        return r
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuento: {str(e)}")


async def send_coupon_email_to_user(db: Session, id_descuento: Decimal, id_usuario: Decimal):
    """
    Envía un cupón por email a un usuario existente.

    Precondiciones:
    - descuento existe y contiene `codigo_descuento`
    - usuario existe y tiene email registrado

    Delegación:
    - usa `email_service.send_coupon_to_user` para envío efectivo.
    """
    from services import user_service
    from services import email_service as email_svc

    discount = get_discount_by_id(db, id_descuento)
    if not discount:
        raise ValueError("Descuento no encontrado")
    codigo = (discount.get("codigo_descuento") or "").strip()
    if not codigo:
        raise ValueError("El descuento no tiene código de cupón para enviar")

    user = user_service.get_user(db, id_usuario)
    if not user:
        raise ValueError("Usuario no encontrado")
    user_row = dict(user) if hasattr(user, "_mapping") else user
    email_to = (user_row.get("email_usuario") or "").strip()
    if not email_to:
        raise ValueError("El usuario no tiene email registrado")

    nom = (user_row.get("nom_usuario") or "").strip()
    ape = (user_row.get("ape_usuario") or "").strip()
    user_name = f"{nom} {ape}".strip() or email_to

    return await email_svc.send_coupon_to_user(
        user_email=email_to,
        user_name=user_name,
        codigo=codigo,
        nom_descuento=discount.get("nom_descuento") or "Cupón",
        tipo_calculo=bool(discount.get("tipo_calculo")),
        val_porce_descuento=discount.get("val_porce_descuento"),
        val_monto_descuento=discount.get("val_monto_descuento"),
        fec_inicio=discount.get("fec_inicio"),
        fec_fin=discount.get("fec_fin"),
        min_valor_pedido=discount.get("min_valor_pedido"),
    )