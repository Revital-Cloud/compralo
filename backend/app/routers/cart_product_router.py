"""
Módulo de enrutador para la gestión de productos en el carrito.

Define las rutas y endpoints relacionados con la gestión de productos en el carrito.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.cart_product_schemas import CalculateTotalCart, CartProductCreate, CartProduct, GetCartDetail, GetCartUser, MigrateCartAnonymous, ResponseMessage, CartResponse, Cart, CartTotalResponse
from services import cart_product_service
from typing import Optional

router = APIRouter(tags=["Carrito Productos"])

@router.get("/carritos", response_model=list[Cart])
async def get_cart(db:Session = Depends(get_db)):
    """
    Obtiene todos los carritos.
    """
    cart = cart_product_service.get_cart(db)
    if cart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay carritos")
    return cart


@router.get("/carrito-productos", response_model=list[CartProduct])
async def get_cart_products(db:Session = Depends(get_db)):
    """
    Obtiene todos los productos en el carrito.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
    Returns:
        list[CarProduct]: Lista de productos en el carrito.
    """
    cart_products = cart_product_service.get_cart_products(db)
    if cart_products is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay productos en el carrito")
    return cart_products


@router.post("/carrito-productos", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_cart_product(
    cart_product_data: CartProductCreate = Body(...),
    session_id: Optional[Decimal] = None, 
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea un nuevo producto en el carrito.
    Para usuarios autenticados, usa automáticamente su id_usuario.
    Para usuarios anónimos, puede pasarse el session_id.
    
    Args:
        cart_product_data (CartProductCreate): Datos del producto a agregar.
        session_id (Optional[Decimal]): ID de sesión para usuarios anónimos (query parameter).
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Usuario autenticado.
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        # Para usuarios autenticados, usar su id_usuario y session_id=None
        # Para usuarios anónimos, usar id_usuario=None y el session_id proporcionado
        if current_user:
            user_id = current_user.id_usuario
            session_id_param = None
        else:
            user_id = None
            session_id_param = session_id
        
        # Establecer los valores correctos en el objeto
        cart_product_data.id_usuario = user_id
        cart_product_data.session_id = session_id_param
        
        cart_product_service.create_cart_product(db, cart_product_data, current_user.id_usuario if current_user else None)
        return ResponseMessage(message="Producto agregado al carrito correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/carrito-productos/{id_carrito_producto}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_cart_product_quantity(
    id_carrito_producto: int,
    cantidad: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Actualiza la cantidad de un producto en el carrito.
    
    Args:
        id_carrito_producto (int): ID del producto en el carrito.
        cantidad (int): Nueva cantidad del producto.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Usuario autenticado.
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        cart_product_service.update_cart_product_quantity(
            db, 
            id_carrito_producto, 
            cantidad, 
            current_user.id_usuario if current_user else None
        )
        return ResponseMessage(message="Cantidad actualizada correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/carrito-productos/{id_carrito_producto}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_cart_product_by_id(
    id_carrito_producto: int,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Elimina un producto del carrito usando su ID de carrito.
    Obtiene los datos necesarios y usa la función existente delete_cart_product.
    """
    try:
        from sqlalchemy import text
        # Obtener los datos del producto para usar tu función existente
        query = text("""
        SELECT cp.id_categoria_producto, cp.id_linea_producto, cp.id_sublinea_producto, 
               cp.id_producto, cp.cantidad, c.id_usuario, c.session_id
        FROM tab_carrito_productos cp
        JOIN tab_carritos c ON cp.id_carrito = c.id_carrito
        WHERE cp.id_carrito_producto = :id_carrito_producto
        """)
        result = db.execute(query, {"id_carrito_producto": id_carrito_producto})
        product_data = result.fetchone()
        
        if not product_data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado en el carrito")
        
        # Usar TU función existente
        cart_product_service.delete_cart_product(
            db=db,
            id_usuario=product_data[5],  # id_usuario
            session_id=product_data[6],  # session_id
            id_categoria_producto=product_data[0],  # id_categoria_producto
            id_linea_producto=product_data[1],  # id_linea_producto
            id_sublinea_producto=product_data[2],  # id_sublinea_producto
            id_producto=product_data[3],  # id_producto
            cantidad=product_data[4],  # cantidad
            usr_update=current_user.id_usuario if current_user else None
        )
        return ResponseMessage(message="Producto eliminado del carrito correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/carrito-productos/{id_categoria_producto}-{id_linea_producto}-{id_sublinea_producto}-{id_producto}-{cantidad}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_cart_product(
    id_categoria_producto: Decimal,
    id_linea_producto: Decimal,
    id_sublinea_producto: Decimal,
    id_producto: Decimal,
    cantidad: Decimal,
    session_id: Optional[Decimal] = None,  # Query parameter opcional
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Elimina un producto en el carrito.
    Para usuarios autenticados, usa automáticamente su id_usuario.
    Para usuarios anónimos, puede pasarse el session_id como query parameter.
    
    Args:
        id_categoria_producto (Decimal): ID de la categoría del producto.
        id_linea_producto (Decimal): ID de la línea del producto.
        id_sublinea_producto (Decimal): ID de la sublínea del producto.
        id_producto (Decimal): ID del producto.
        cantidad (Decimal): Cantidad del producto.
        session_id (Optional[Decimal]): ID de sesión para usuarios anónimos (query parameter).
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Usuario autenticado.
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """ 
    try:
        # Para usuarios autenticados, usar su id_usuario y session_id=None
        # Para usuarios anónimos, usar id_usuario=None y el session_id proporcionado
        if current_user:
            user_id = current_user.id_usuario
            session_id_param = None
        else:
            user_id = None
            session_id_param = session_id
            
        cart_product_service.delete_cart_product(
            db, 
            user_id, 
            session_id_param, 
            id_categoria_producto, 
            id_linea_producto, 
            id_sublinea_producto, 
            id_producto, 
            cantidad, 
            current_user.id_usuario if current_user else None
        )
        return ResponseMessage(message="Producto eliminado del carrito correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.post("/migrar", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def migrate_cart_anonymous(
    migrate_data: MigrateCartAnonymous = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Migra productos de un carrito anónimo al carrito del usuario autenticado.
    
    El carrito anónimo es identificado por su id_carrito (donde id_usuario = NULL y session_id != NULL).
    Todos los productos del carrito anónimo se transfieren al carrito del usuario,
    y el carrito anónimo se elimina después de la migración exitosa.
    
    Se ejecuta típicamente cuando:
    - Un usuario anónimo se registra en el sistema
    - Un usuario anónimo inicia sesión
    
    Args:
        migrate_data (MigrateCarAnonymous): Contiene el id_carrito del carrito anónimo.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Usuario autenticado de destino.
        
    Returns:
        ResponseMessage: Mensaje de confirmación de la migración.
    """
    try:
        cart_product_service.migrate_cart_anonymous(db, migrate_data, current_user.id_usuario)
        return ResponseMessage(message="Carrito anónimo migrado a usuario correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/carrito-usuario", response_model=CartResponse, status_code=status.HTTP_200_OK)
async def get_cart_user(
    get_cart_user_data: GetCartUser = Body(...),
    db: Session = Depends(get_db)
):
    """
    Obtiene el carrito de un usuario registrado o anónimo.
    
    Si el carrito no existe, crea uno nuevo automáticamente.
    Maneja tanto usuarios registrados (por id_usuario) como usuarios anónimos (por session_id).
    
    Args:
        get_car_user_data (GetCartUser): Datos del usuario (id_usuario o session_id).
        db (Session): La sesión de base de datos SQLAlchemy.
    Returns:
        CartResponse: ID del carrito y mensaje de confirmación.
    """
    try:
        id_carrito = cart_product_service.get_cart_user(db, get_cart_user_data)
        return CartResponse(
            id_carrito=id_carrito,
            message="Carrito obtenido correctamente" if id_carrito else "Carrito creado correctamente"
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.post("/carrito-productos-detalle", status_code=status.HTTP_200_OK)
async def get_cart_products_detail(
    get_cart_detail: GetCartDetail = Body(...),
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los productos en el carrito con detalle.2
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Usuario autenticado.
    Returns:
        list[CartProduct]: Lista de productos en el carrito con detalle.
    """
    try:
        cart_products_detail = cart_product_service.get_cart_detail(db, get_cart_detail)
        if cart_products_detail is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay productos en el carrito")
        return cart_products_detail
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/calcular-total", response_model=CartTotalResponse, status_code=status.HTTP_200_OK)
async def calculate_total_cart(
    calculate_total_cart_data: CalculateTotalCart = Body(...),
    db: Session = Depends(get_db)
):
    """
    Calcula el total del carrito de un usuario.
    Retorna información completa del carrito incluyendo totales, descuentos, puntos y mensajes.
    """
    try:
        cart_total_result = cart_product_service.calculate_total_cart(db, calculate_total_cart_data)
        if cart_total_result is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se pudo calcular el total del carrito")
        return cart_total_result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))