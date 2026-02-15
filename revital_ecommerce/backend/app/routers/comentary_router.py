"""
Módulo de enrutador para la gestión de comentarios.

Define las rutas y endpoints relacionados con la gestión de comentarios,
incluyendo la creación, actualización y visualización de comentarios.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, Form, HTTPException, Query, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.comentary_schema import ComentaryCreate, Comentary, ResponseMessage
from services import comentary_service

router = APIRouter(tags=["Comentarios"])

@router.get("/comentaries", response_model=list[Comentary])
async def get_comentaries(db:Session = Depends(get_db)):
    """
    Obtiene todos los comentarios registrados en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list[Comentary]: Lista de comentarios registrados.
    """
    comentarios = comentary_service.get_comentaries(db)
    if comentarios is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron comentarios")
    return comentarios

#ruta para crear un nuevo comentario con JSON body
@router.post("/comentaries", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_comentary(
    db:Session = Depends(get_db),
    comentary_data: ComentaryCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea un nuevo comentario en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        comentary_data (ComentaryCreate): Datos del comentario a crear.
        current_user (UserInToken): Información del usuario autenticado.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        comentary_service.create_comentary(db, comentary_data, current_user.id_usuario)
        return ResponseMessage(message="Comentario creado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.get("/comentaries/testimonials")
async def get_testimonials(
    limit: int = Query(3, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """
    Obtiene reseñas de 5 estrellas para la sección de testimonios del landing.
    Público, sin autenticación.
    """
    try:
        rows = comentary_service.get_testimonials_5_star(db, limit=limit)
        data = []
        for row in rows:
            r = dict(row)
            nom = str(r.get("nom_usuario") or "").strip()
            ape = str(r.get("ape_usuario") or "").strip()
            id_c = r.get("id_comentario")
            img = r.get("img_producto")
            product_slug = r.get("producto_slug") or (str(r.get("id_producto") or "") if r.get("id_producto") is not None else None)
            data.append({
                "id_comentario": int(id_c) if id_c is not None else 0,
                "comentario": str(r.get("comentario") or "").strip(),
                "calificacion": int(r.get("calificacion") or 5),
                "nombre_usuario": f"{nom} {ape}".strip() or "Cliente",
                "nom_usuario": nom,
                "ape_usuario": ape,
                "producto_nombre": str(r.get("nom_producto") or "").strip() or None,
                "producto_imagen": img,
                "producto_slug": product_slug,
            })
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/comentaries/product/{product_id_or_slug}")
async def get_comentaries_by_product(
    product_id_or_slug: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los comentarios activos de un producto.
    Acepta product_id (numérico) o slug (tab_products.slug).
    """
    try:
        comentarios = comentary_service.get_comentaries_by_product(db, product_id_or_slug)
        return {"success": True, "data": [dict(row) for row in comentarios], "total": len(comentarios)}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/comentaries/order/{id_orden}/reviewed-products")
async def get_reviewed_products_in_order(
    id_orden: int,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene la lista de productos que el usuario ya ha reseñado en una orden específica.
    
    Args:
        id_orden (int): El ID de la orden.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Información del usuario autenticado.
        
    Returns:
        dict: Lista de claves de productos ya reseñados.
    """
    try:
        from decimal import Decimal
        # Convertir id_usuario a int si es Decimal
        id_usuario = int(current_user.id_usuario) if isinstance(current_user.id_usuario, Decimal) else current_user.id_usuario
        reviewed_products = comentary_service.get_reviewed_products_in_order(db, id_orden, id_usuario)
        # Asegurar que los valores son strings
        reviewed_products_list = [str(product_key) for product_key in reviewed_products] if reviewed_products else []
        return {"success": True, "data": reviewed_products_list}
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error al obtener productos reseñados para orden {id_orden}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/comentaries/{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}-{id_comentario}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_comentary(
    id_categoria:Decimal,
    id_linea:Decimal,
    id_sublinea:Decimal,
    id_producto:Decimal,
    id_comentario:Decimal,
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Desactiva un comentario existente en la base de datos.
    
    Args:
        id_categoria (Decimal): El ID de la categoría asociada.
        id_linea (Decimal): El ID de la linea asociada.
        id_sublinea (Decimal): El ID de la sublinea asociada.
        id_producto (Decimal): El ID del producto asociado.
        id_comentario (Decimal): El ID del comentario a desactivar.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Información del usuario autenticado.
        
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        comentary_service.deactivate_comentary(db, id_categoria, id_linea, id_sublinea, id_producto, current_user.id_usuario, id_comentario, current_user.id_usuario)
        return ResponseMessage(message="Comentario desactivado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    