"""
Módulo de Rutas de Productos.

Define los endpoints de la API para la gestión de productos.
Incluye operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los productos.
Utiliza FastAPI para definir las rutas y depende del servicio de productos
para la lógica de negocio y del gestor de base de datos para las sesiones.
"""
# Definición de rutas (endpoints) de la API para productos
from fastapi import APIRouter, Depends, Form, HTTPException
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

@router.post("/products", response_model=Product)
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
        Product: El producto creado.
        
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
    return product_service.create_product(db, product_data)

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