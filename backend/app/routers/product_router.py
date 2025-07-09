"""
Módulo de Rutas de Productos.

Define los endpoints de la API para la gestión de productos.
Incluye operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los productos.
Utiliza FastAPI para definir las rutas y depende del servicio de productos
para la lógica de negocio y del gestor de base de datos para las sesiones.
"""
# Definición de rutas (endpoints) de la API para productos
from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from core.database import get_db
from core.dependencies import require_admin, get_current_user, get_current_user_optional
from schemas.product_schema import Product, ProductCreate, ProductUpdate, ResponseMessage, ProductBase
from schemas.auth_schema import UserInToken
from services import product_service

router = APIRouter(tags=["Productos"])

#todos los productos
@router.get("/products", response_model=list[ProductBase])
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
    product_data: ProductCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user) 
):
    """
    Crear un nuevo producto.

    Este endpoint permite crear un nuevo producto en la base de datos
    utilizando los datos proporcionados en el cuerpo de la solicitud.
    
    Args:
        product_data (ProductCreate): Datos del producto a crear.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado.

    Returns:
        ResponseMessage: Un mensaje indicando el resultado de la operación.
        
    Raises:
        HTTPException: Si ocurre un error durante la creación del producto.
    """
    try:
        service_response = product_service.create_product(db, product_data, current_user.id_usuario)
        
        if service_response and "Error" in str(service_response):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(service_response))
             
        return ResponseMessage(message="Producto creado exitosamente")
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
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
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
        current_user (UserInToken): Usuario autenticado.

    Returns:
        ResponseMessage: Un mensaje indicando el resultado de la operación de actualización.
    """
    try:
        response_message = product_service.update_product(
            id_categoria, 
            id_linea, 
            id_sublinea, 
            id_producto, 
            product_data, 
            db,
            current_user.id_usuario
            )

        if response_message and "Error" in str(response_message):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(response_message))

        return ResponseMessage(message="Producto actualizado exitosamente")
    
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
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
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
    """
    try:
        response_message = product_service.deactivate_product(
            db, 
            id_categoria, 
            id_linea, 
            id_sublinea, 
            id_producto,
            current_user.id_usuario
            )
        
        if response_message and "Error" in str(response_message):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(response_message))

        return ResponseMessage(message="Producto desactivado exitosamente")

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    
        