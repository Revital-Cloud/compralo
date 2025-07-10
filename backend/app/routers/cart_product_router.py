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
from schemas.cart_product_schemas import CalculateTotalCar, CarProductCreate, CarProduct, GetCarUser, MigrateCarAnonymous, ResponseMessage
from services import cart_product_service

router = APIRouter(tags=["Carrito Productos"])

@router.get("/carrito-productos", response_model=list[CarProduct])
async def get_cart_products(db:Session = Depends(get_db)):
    """
    Obtiene todos los productos en el carrito.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
    Returns:
        list[CarProduct]: Lista de productos en el carrito.
    """
    car_products = cart_product_service.get_car_products(db)
    if car_products is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay productos en el carrito")
    return car_products

@router.post("/carrito-productos", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_cart_product(
    db:Session = Depends(get_db),
    car_product_data: CarProductCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea un nuevo producto en el carrito.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        car_product_data (CarProductCreate): Datos del producto a agregar.
        current_user (UserInToken): Usuario autenticado.
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        cart_product_service.create_car_product(db, car_product_data, current_user.id_usuario)
        return ResponseMessage(message="Producto agregado al carrito correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/carrito-productos/{id_usuario}-{id_categoria_producto}-{id_linea_producto}-{id_sublinea_producto}-{id_producto}-{cantidad}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_cart_product(
    id_usuario: Decimal,
    id_categoria_producto: Decimal,
    id_linea_producto: Decimal,
    id_sublinea_producto: Decimal,
    id_producto: Decimal,
    cantidad: Decimal,
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Elimina un producto en el carrito.
    Args:
        id_carrito_producto (Decimal): El identificador del producto en el carrito.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Usuario autenticado.
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """ 
    try:
        cart_product_service.delete_car_product(db, id_usuario, id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto, cantidad, current_user.id_usuario)
        return ResponseMessage(message="Producto eliminado del carrito correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.post("/migrar", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def migrate_cart_anonymous(
    migrate_data: MigrateCarAnonymous = Body(...),
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
        cart_product_service.migrate_car_anonymous(db, migrate_data, current_user.id_usuario)
        return ResponseMessage(message="Carrito anónimo migrado a usuario correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/carrito-usuario", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def get_cart_user(
    get_car_user_data: GetCarUser = Body(...),
    db: Session = Depends(get_db)
):
    """
    Obtiene el carrito de un usuario.
    Args:
        get_car_user_data (GetCarUser): Datos del usuario a obtener.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Usuario autenticado.
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        cart_product_service.get_car_user(db, get_car_user_data)
        return ResponseMessage(message="Carrito obtenido correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.post("/calcular-total", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def calculate_total_cart(
    calculate_total_car_data: CalculateTotalCar = Body(...),
    db: Session = Depends(get_db)
):
    """
    Calcula el total del carrito de un usuario.
    """
    try:
        cart_product_service.calculate_total_car(db, calculate_total_car_data)
        return ResponseMessage(message="Total del carrito calculado correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))