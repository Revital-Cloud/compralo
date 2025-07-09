from sqlalchemy.orm import Session
from sqlalchemy import text, func
from fastapi import HTTPException, status
from backend.app.schemas.points_schema import PuntosConfigActivaUpdate

def update_active_config(db: Session, config_update: PuntosConfigActivaUpdate, user_id: int):
    """
    Actualiza la configuración de puntos activa llamando a la función de base de datos.
    """
    try:
        # Llamada a la función de base de datos
        query = text("""
            SELECT fun_actualizar_config_puntos_empresa(
                :p_nuevo_pesos_por_punto,
                :p_descripcion,
                :p_usr_operacion
            )
        """)
        
        params = {
            "p_nuevo_pesos_por_punto": config_update.nuevo_pesos_por_punto,
            "p_descripcion": config_update.descripcion,
            "p_usr_operacion": user_id
        }
        
        result = db.execute(query, params)
        db.commit()
        
        # El resultado de la función es un JSON, lo obtenemos
        json_result = result.scalar_one_or_none()
        
        if not json_result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="La función de base de datos no devolvió un resultado."
            )

        # Si la operación en la BD no fue exitosa, levantamos una excepción
        if not json_result.get('success'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=json_result.get('message', 'Ocurrió un error al actualizar la configuración.')
            )
            
        return json_result

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al actualizar la configuración: {str(e)}"
        )

def get_active_rate(db: Session):
    """
    Obtiene la tasa de conversión de puntos activa llamando a la función de base de datos.
    """
    try:
        query = text("SELECT fun_obtener_config_puntos_activa()")
        rate = db.scalar(query)
        
        if rate is None:
            # Esto no debería ocurrir si la función de BD lanza una excepción,
            # pero es una buena práctica de programación defensiva.
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="No se encontró una configuración de puntos activa o el valor devuelto es nulo."
            )
            
        return {"pesos_por_punto": rate}
    except Exception as e:
        db.rollback()
        # Captura la excepción específica de PostgreSQL cuando no hay configuración activa
        if "No hay configuración de puntos activa" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="No hay una configuración de puntos activa para la fecha actual."
            )
        # Para cualquier otro error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al obtener la tasa de puntos activa: {str(e)}"
        )

def get_movimiento_descripcion(db: Session, tipo_movimiento: int):
    """
    Obtiene la descripción de un tipo de movimiento de puntos llamando a una función de BD.
    """
    try:
        query = text("SELECT fun_obtener_descripcion_tipo_movimiento(:tipo)")
        descripcion = db.scalar(query, {"tipo": tipo_movimiento})
        
        if descripcion is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="La función de base de datos no devolvió una descripción."
            )
            
        return {"codigo": tipo_movimiento, "descripcion": descripcion}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener la descripción del movimiento: {str(e)}"
        ) 