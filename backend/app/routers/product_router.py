"""
Módulo de Rutas de Productos.

Define los endpoints de la API para la gestión de productos.
Incluye operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los productos.
Utiliza FastAPI para definir las rutas y depende del servicio de productos
para la lógica de negocio y del gestor de base de datos para las sesiones.
"""
# Definición de rutas (endpoints) de la API para productos
from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
import json
from decimal import Decimal
from typing import Optional, Dict, Any

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


@router.get("/products/{id_producto}", response_model=Product)
async def get_product(id_producto: Decimal, db: Session = Depends(get_db)):
    """
    Obtener un producto específico por su ID.

    Este endpoint permite obtener un producto específico de la base de datos
    utilizando su ID como identificador único.

    Args:
        id_producto (Decimal): ID del producto a obtener.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        Product: Un objeto de producto.
    """

    product = product_service.get_product(db, id_producto)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.post("/products", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_product(
    db: Session = Depends(get_db),
    nom_producto: str = Form(...),
    spcf_producto_str: str = Form(..., alias="spcf_producto"),
    img_producto: Optional[str] = Form(None),
    val_precio: Decimal = Form(...),
    id_proveedor: Decimal = Form(...),
    id_marca: Decimal = Form(...),
    id_sublinea: Decimal = Form(...),
    id_linea: Decimal = Form(...),
    id_categoria: Decimal = Form(...),
    num_stock: int = Form(...)
):
    """
    Crear un nuevo producto.

    Este endpoint permite crear un nuevo producto en la base de datos
    utilizando los datos proporcionados en el cuerpo de la solicitud como form-data.
    El campo spcf_producto debe ser una cadena JSON válida.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_producto (str): Nombre del producto.
        spcf_producto_str (str): Especificaciones del producto en formato de cadena JSON.
        img_producto (Optional[str]): URL o ruta de la imagen del producto.
        val_precio (Decimal): Precio de venta del producto.
        id_proveedor (Decimal): Identificador del proveedor.
        id_marca (Decimal): Identificador de la marca.
        id_sublinea (Decimal): Identificador de la sublínea.
        id_linea (Decimal): Identificador de la línea.
        id_categoria (Decimal): Identificador de la categoría.
        num_stock (int): Cantidad de unidades disponibles en inventario.

    Returns:
        ResponseMessage: Un mensaje indicando el resultado de la operación.
        
    Raises:
        HTTPException: Si spcf_producto_str no es una cadena JSON válida.
    """
    try:
        spcf_producto_dict: Dict[str, Any] = json.loads(spcf_producto_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="El campo 'spcf_producto' debe ser una cadena JSON válida.")

    product_data = ProductCreate(
        nom_producto=nom_producto,
        spcf_producto=spcf_producto_dict,
        img_producto=img_producto,
        val_precio=val_precio,
        id_proveedor=id_proveedor,
        id_marca=id_marca,
        id_sublinea=id_sublinea,
        id_linea=id_linea,
        id_categoria=id_categoria,
        num_stock=num_stock
    )
    service_response_message = product_service.create_product(db, product_data)
    
    if service_response_message is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="La creación del producto en el servicio no devolvió ningún mensaje de resultado."
        )
    
    return ResponseMessage(message=service_response_message)

@router.put("/products/{id_producto}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
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
        ResponseMessage: Un mensaje indicando el resultado de la operación de actualización.
    """
    service_response_message = product_service.update_product(db, id_producto, product)

    if service_response_message is None:
        # Esto podría significar que el producto no fue encontrado o la función de DB no devolvió nada.
        # Un 404 sería apropiado si el producto no existe.
        # O un 500 si se esperaba un mensaje pero no se obtuvo.
        # Por coherencia con create, si no hay mensaje, es un problema.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, # O 500, dependiendo de la semántica de la función de servicio
            detail=f"No se pudo actualizar el producto con ID {id_producto} o no se recibió mensaje de confirmación."
        )

    if not isinstance(service_response_message, str):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Se esperaba un mensaje de texto desde el servicio de actualización, pero se recibió: {type(service_response_message)}"
        )

    return ResponseMessage(message=service_response_message)

@router.delete("/products/{id_producto}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
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
    response_message = product_service.delete_product(db, id_producto)
    if response_message is None:
        pass
    return response_message