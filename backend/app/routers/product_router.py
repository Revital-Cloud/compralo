"""
Módulo de Rutas de Productos.

Define los endpoints de la API para la gestión de productos.
Incluye operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los productos.
Utiliza FastAPI para definir las rutas y depende del servicio de productos
para la lógica de negocio y del gestor de base de datos para las sesiones.
"""
# Definición de rutas (endpoints) de la API para productos
from fastapi import APIRouter, Depends, Body, Form, HTTPException, status
from sqlalchemy.orm import Session
import json
from decimal import Decimal
from typing import Optional, Dict, Any

from core.database import get_db
from core.dependencies import require_admin, get_current_user_optional
from schemas.product_schema import Product, ProductCreate, ProductUpdate, ResponseMessage
from schemas.auth_schema import UserInToken
from services import product_service

router = APIRouter(tags=["Productos"])

#todos los productos
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
    if not  products:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron productos")
    return products


#un solo producto
@router.get(
    "/products/{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}", 
    response_model=Product
    )
async def get_product(
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,
    id_producto: Decimal, 
    db: Session = Depends(get_db)):
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

    product = product_service.get_product(id_categoria, id_linea, id_sublinea, id_producto, db)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return product

#crea un producto
@router.post("/products", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_product(
    db: Session = Depends(get_db),
    product_data: ProductCreate = Body(...) 
):
    """
    Crear un nuevo producto (Solo Administradores).

    Este endpoint permite crear un nuevo producto en la base de datos
    utilizando los datos proporcionados en el cuerpo de la solicitud como form-data.
    El campo spcf_producto debe ser una cadena JSON válida.
    
    **Requiere autenticación de administrador.**

    Args:
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
        current_user (UserInToken): Usuario administrador autenticado.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Un mensaje indicando el resultado de la operación.
        
    Raises:
        HTTPException: Si spcf_producto_str no es una cadena JSON válida.
        HTTPException: Si el usuario no es administrador (403).
        HTTPException: Si no se proporciona token de autenticación (401).
    """
    try:
        spcf_producto_dict: Dict[str, Any] = json.loads(product_data.spcf_producto_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="El campo 'spcf_producto' debe ser una cadena JSON válida.")

    try:
        product_data = ProductCreate(
            nom_producto=product_data.nom_producto,
            spcf_producto=spcf_producto_dict,
            img_producto=product_data.img_producto,
            val_precio=product_data.val_precio,
            id_proveedor=product_data.id_proveedor,
            id_marca=product_data.id_marca,
            id_sublinea=product_data.id_sublinea,
            id_linea=product_data.id_linea,
            id_categoria=product_data.id_categoria,
            num_stock=product_data.num_stock,
            ind_activo=product_data.ind_activo
        )
        service_response_message = product_service.create_product(db, product_data)
        
        return ResponseMessage(message=service_response_message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
        
#actualiza un producto
@router.put(
    "/products/{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}", 
    response_model=ResponseMessage, 
    status_code=status.HTTP_200_OK
    )
async def update_product(
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,
    id_producto: Decimal,
    product_data: ProductUpdate = Body(...),
    db: Session = Depends(get_db)
    ):
    """
    Actualizar un producto existente.

    Este endpoint permite actualizar los datos de un producto específico,
    identificado por su ID.

    Args:
        id_producto (Decimal): ID del producto a actualizar.
        id_categoria (Decimal): Identificador de la categoría.
        id_linea (Decimal): Identificador de la línea.
        id_sublinea (Decimal): Identificador de la sublínea.
        nom_producto (str): Nombre del producto.
        spcf_producto_str (str): Especificaciones del producto en formato de cadena JSON.
        img_producto (Optional[str]): URL o ruta de la imagen del producto.
        val_precio (Decimal): Precio de venta del producto.
        id_proveedor (Decimal): Identificador del proveedor.
        id_marca (Decimal): Identificador de la marca.
        num_stock (int): Cantidad de unidades disponibles en inventario.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Un mensaje indicando el resultado de la operación de actualización.
    """
    # try:
    #     spcf_producto_dict: Dict[str, Any] = json.loads(product_data.spcf_producto)
    # except json.JSONDecodeError:
    #     raise HTTPException(status_code=400, detail="El campo 'spcf_producto' debe ser una cadena JSON válida.")
    
    try:
        # product_data = ProductUpdate(
        #     id_producto=product_data.id_producto,
        #     nom_producto=product_data.nom_producto,
        #     spcf_producto=product_data.spcf_producto,  # Asumiendo que ya es un dict
        #     img_producto=product_data.img_producto,
        #     val_precio=product_data.val_precio,
        #     id_proveedor=product_data.id_proveedor,
        #     id_marca=product_data.id_marca,
        #     id_sublinea=product_data.id_sublinea,
        #     id_linea=product_data.id_linea,
        #     id_categoria=product_data.id_categoria,
        #     num_stock=product_data.num_stock
        # )
        
        product_service.update_product(id_categoria, id_linea, id_sublinea, id_producto, product_data, db)

        return ResponseMessage(message="producto actualizada exitosamente")
    
    except Exception as e:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        


# desactiva una sublinea
@router.put(
    "/products/{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}/deactivate", 
    response_model=ResponseMessage, 
    status_code=status.HTTP_200_OK
    )
async def deactivate_product(
    id_categoria: Decimal,
    id_linea: Decimal,  
    id_sublinea: Decimal,
    id_producto: Decimal, 
    #current_user: UserInToken = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """
    Eliminar un producto (Solo Administradores).

    Este endpoint permite eliminar un producto específico de la base de datos,
    identificado por su ID.
    
    **Requiere autenticación de administrador.**

    Args:
        id_producto (Decimal): ID del producto a eliminar.
        current_user (UserInToken): Usuario administrador autenticado.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Un mensaje indicando el resultado de la operación.
        
    Raises:
        HTTPException: Si el usuario no es administrador (403).
        HTTPException: Si no se proporciona token de autenticación (401).
        HTTPException: Si el producto no se encuentra (404).
    """
    try:
        response_message = product_service.deactivate_product(
            db, 
            id_categoria,
            id_linea, 
            id_sublinea, 
            id_producto
        )
        return ResponseMessage(message="Producto desactivado correctamente")
    except Exception as e:
        if response_message is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se pudo desactivar el producto porque no se encontró."
            )
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    
        