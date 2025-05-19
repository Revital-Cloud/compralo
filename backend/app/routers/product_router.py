"""
Módulo de Rutas de Productos.

Define los endpoints de la API para la gestión de productos.
Incluye operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los productos.
Utiliza FastAPI para definir las rutas y depende del servicio de productos
para la lógica de negocio y del gestor de base de datos para las sesiones.
"""
# Definición de rutas (endpoints) de la API para productos
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.product_schema import Product, ProductCreate, ProductUpdate, ResponseMessage
from services import product_service

router = APIRouter()

@router.get("/products", response_model=list[Product])
async def get_products(db: Session = Depends(get_db)):
    """
    Obtener todos los productos.

    Este endpoint recupera una lista de todos los productos existentes
    en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        list[Product]: Una lista de objetos de producto.
    """
    products = product_service.get_products(db)
    return products

@router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Crear un nuevo producto.

    Este endpoint permite crear un nuevo producto en la base de datos
    utilizando los datos proporcionados en el cuerpo de la solicitud.

    Args:
        product (ProductCreate): Datos del producto a crear.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        Product: El producto creado.
    """
    return product_service.create_product(db, product)

@router.put("/products/{id_producto}", response_model=Product)
async def update_product(id_producto: int, product: ProductUpdate, db: Session = Depends(get_db)):
    """
    Actualizar un producto existente.

    Este endpoint permite actualizar los datos de un producto específico,
    identificado por su ID.

    Args:
        id_producto (int): ID del producto a actualizar.
        product (ProductUpdate): Datos del producto para actualizar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        Product: El producto actualizado.
    """
    return product_service.update_product(db, id_producto, product)

@router.delete("/products/{id_producto}", response_model=ResponseMessage)
async def delete_product(id_producto: int, db: Session = Depends(get_db)):
    """
    Eliminar un producto.

    Este endpoint permite eliminar un producto específico de la base de datos,
    identificado por su ID.

    Args:
        id_producto (int): ID del producto a eliminar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Un mensaje indicando el resultado de la operación.
    """
    response_data = product_service.delete_product(db, id_producto)
    if response_data is None:
        pass
    return response_data