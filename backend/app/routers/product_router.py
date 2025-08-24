"""
Módulo de Rutas de Productos.

Define los endpoints de la API para la gestión de productos.
Incluye operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los productos.
Utiliza FastAPI para definir las rutas y depende del servicio de productos
para la lógica de negocio y del gestor de base de datos para las sesiones.
"""
# Definición de rutas (endpoints) de la API para productos
from fastapi import APIRouter, Depends, Body, Form, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional, List
import json

from core.database import get_db
from core.dependencies import require_admin, get_current_user, get_current_user_optional
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
    current_user: UserInToken = Depends(get_current_user),
    # Datos del producto como Form fields
    id_categoria: Decimal = Form(...),
    id_linea: Decimal = Form(...),
    id_sublinea: Decimal = Form(...),
    nom_producto: str = Form(...),
    spcf_producto: str = Form(...),  # JSON como string
    val_precio: Decimal = Form(...),
    id_proveedor: Decimal = Form(...),
    id_marca: Decimal = Form(...),
    num_stock: int = Form(0),
    ind_activo: bool = Form(True),
    # Archivos de imagen opcionales (múltiples)
    image_files: List[UploadFile] = File(None, description="Múltiples archivos de imagen para el producto")
):
    """
    Crear un nuevo producto con opción de imagen.

    Este endpoint permite crear un nuevo producto en la base de datos
    utilizando form-data, incluyendo opcionalmente una imagen que se sube a Cloudinary.
    
    Args:
        id_categoria (Decimal): ID de la categoría.
        id_linea (Decimal): ID de la línea.
        id_sublinea (Decimal): ID de la sublínea.
        nom_producto (str): Nombre del producto.
        spcf_producto (str): Especificaciones del producto en formato JSON string.
        val_precio (Decimal): Precio del producto.
        id_proveedor (Decimal): ID del proveedor.
        id_marca (Decimal): ID de la marca.
        num_stock (int): Stock inicial del producto.
        ind_activo (bool): Si el producto está activo.
        image_file (UploadFile): Archivo de imagen opcional.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado.

    Returns:
        ResponseMessage: Un mensaje indicando el resultado de la operación.
        
    Raises:
        HTTPException: Si ocurre un error durante la creación del producto.
    """
    try:
        print(f"🔍 ROUTER DEBUG: image_files recibidos: {image_files}")
        print(f"🔍 ROUTER DEBUG: Tipo: {type(image_files)}")
        if image_files:
            print(f"🔍 ROUTER DEBUG: Cantidad de archivos: {len(image_files)}")
            for i, file in enumerate(image_files):
                print(f"🔍 ROUTER DEBUG: Archivo {i}: {file.filename}, tipo: {file.content_type}, tamaño: {file.size}")
        
        # Convertir el JSON string a dict
        try:
            spcf_producto_dict = json.loads(spcf_producto)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="El campo 'spcf_producto' debe ser una cadena JSON válida.")
        
        # Crear el objeto ProductCreate
        product_data = ProductCreate(
            id_categoria=id_categoria,
            id_linea=id_linea,
            id_sublinea=id_sublinea,
            nom_producto=nom_producto,
            spcf_producto=spcf_producto_dict,
            img_producto=None,  # Se asignará automáticamente si hay imagen
            val_precio=val_precio,
            id_proveedor=id_proveedor,
            id_marca=id_marca,
            num_stock=num_stock,
            ind_activo=ind_activo
        )
        
        print(f"spcf_producto recibido: {product_data.spcf_producto}")
        print(f"Tipo de spcf_producto: {type(product_data.spcf_producto)}")
        
        # Llamar al servicio con las imágenes opcionales y el usuario
        print(f"🔍 ROUTER DEBUG: Llamando a product_service.create_product con image_files: {image_files}")
        service_response_message = await product_service.create_product(
            db, 
            product_data, 
            image_files, 
            current_user.id_usuario
        )
        
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
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
    # Datos del producto como Form fields opcionales
    nom_producto: Optional[str] = Form(None),
    spcf_producto: Optional[str] = Form(None),  # JSON como string
    val_precio: Optional[Decimal] = Form(None),
    id_proveedor: Optional[Decimal] = Form(None),
    id_marca: Optional[Decimal] = Form(None),
    num_stock: Optional[int] = Form(None),
    ind_activo: Optional[bool] = Form(None),
    # Archivos de imagen opcionales (múltiples)
    image_files: List[UploadFile] = File(None, description="Múltiples archivos de imagen para el producto")
    ):
    """
    Actualizar un producto existente.

    Este endpoint permite actualizar los datos de un producto específico,
    identificado por su clave compuesta, incluyendo opcionalmente una nueva imagen.

    Args:
        id_categoria (Decimal): Identificador de la categoría.
        id_linea (Decimal): Identificador de la línea.
        id_sublinea (Decimal): Identificador de la sublínea.
        id_producto (Decimal): ID del producto a actualizar.
        nom_producto (Optional[str]): Nombre del producto.
        spcf_producto (Optional[str]): Especificaciones del producto en formato JSON string.
        val_precio (Optional[Decimal]): Precio de venta del producto.
        id_proveedor (Optional[Decimal]): Identificador del proveedor.
        id_marca (Optional[Decimal]): Identificador de la marca.
        num_stock (Optional[int]): Cantidad de unidades disponibles en inventario.
        ind_activo (Optional[bool]): Si el producto está activo.
        image_file (Optional[UploadFile]): Archivo de imagen opcional.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado.

    Returns:
        ResponseMessage: Un mensaje indicando el resultado de la operación de actualización.
    """
    try:
        print(f"🔍 ROUTER UPDATE DEBUG: image_files recibidos: {image_files}")
        print(f"🔍 ROUTER UPDATE DEBUG: Tipo: {type(image_files)}")
        if image_files:
            print(f"🔍 ROUTER UPDATE DEBUG: Cantidad de archivos: {len(image_files)}")
            for i, file in enumerate(image_files):
                print(f"🔍 ROUTER UPDATE DEBUG: Archivo {i}: {file.filename}, tipo: {file.content_type}, tamaño: {file.size}")
        
        # Preparar el dict de datos para actualizar
        update_data = {}
        
        if nom_producto is not None:
            update_data['nom_producto'] = nom_producto
        if spcf_producto is not None:
            try:
                update_data['spcf_producto'] = json.loads(spcf_producto)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="El campo 'spcf_producto' debe ser una cadena JSON válida.")
        if val_precio is not None:
            update_data['val_precio'] = val_precio
        if id_proveedor is not None:
            update_data['id_proveedor'] = id_proveedor
        if id_marca is not None:
            update_data['id_marca'] = id_marca
        if num_stock is not None:
            update_data['num_stock'] = num_stock
        if ind_activo is not None:
            update_data['ind_activo'] = ind_activo
            
        # Crear el objeto ProductUpdate
        product_data = ProductUpdate(**update_data)
        
        print(f"🔍 ROUTER UPDATE DEBUG: Llamando a product_service.update_product con image_files: {image_files}")
        response_message = await product_service.update_product(
            id_categoria, 
            id_linea, 
            id_sublinea, 
            id_producto, 
            product_data, 
            db,
            image_files,
            current_user.id_usuario
        )

        return ResponseMessage(message="producto actualizado exitosamente")
    
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
        if response_message is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se pudo desactivar el producto porque no se encontró."
            )
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))