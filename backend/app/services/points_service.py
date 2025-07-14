from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from fastapi import HTTPException, status
from schemas.points_schema import PuntosConfigUpdate, PuntosConfigCreate


def create_points_config(db: Session, config_create: PuntosConfigCreate, user_insert: Decimal):
    """
    Crea una nueva configuración de puntos llamando a la función de base de datos.
    """
    try:
        params = config_create.model_dump()
        params['usr_insert'] = user_insert
        query = text("""
            SELECT fun_crear_config_puntos_empresa(
                :pesos_por_punto,
                :descripcion,
                :usr_insert
            )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear configuración de puntos: {str(e)}")

def update_active_config(db: Session, id_config_puntos: Decimal, config_update: PuntosConfigUpdate, user_id: int):
    """
    Actualiza la configuración de puntos activa llamando a la función de base de datos.
    """
    try:
        params = config_update.model_dump(exclude_unset=True)
        params['id_config_puntos'] = id_config_puntos
        params['usr_update'] = user_id
        
        query = text("""
            SELECT fun_actualizar_config_puntos_empresa(
                :id_config_puntos,
                :pesos_por_punto,
                :descripcion,
                :usr_update
            )
        """)
        
        result = db.execute(query, params)
        db.commit()
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
        query = text("""
        SELECT 
            id_config_puntos,
            pesos_por_punto,
            ind_activo,
            descripcion,
            fec_inicio_vigencia,
            fec_fin_vigencia,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_config_puntos_empresa
            """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener la tasa de conversión de puntos activa: {str(e)}")

