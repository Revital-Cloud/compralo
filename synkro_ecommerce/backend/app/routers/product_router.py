"""
Módulo de Rutas de Productos.

Define los endpoints de la API para la gestión de productos.
Incluye operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los productos.
Utiliza FastAPI para definir las rutas y depende del servicio de productos
para la lógica de negocio y del gestor de base de datos para las sesiones.
"""
# Definición de rutas (endpoints) de la API para productos
from fastapi import APIRouter, Depends, Body, Form, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional, List, Union
import json

from core.database import get_db
from core.dependencies import require_admin, get_current_user, get_current_user_optional
from schemas.product_schema import Product, ProductCreate, ProductUpdate, ResponseMessage, ProductFilterParams, ProductFilterResponse, ProductFilterStats, ProductAdminResponse, ProductAdminParams, ToggleRequest
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

#endpoint para administradores - productos completos con estados de activación
@router.get("/products-admin", response_model=list[ProductAdminResponse])
async def get_products_admin(
    ordenar_por: str = "nombre",
    orden: str = "ASC", 
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtener todos los productos para el panel de administración.
    
    Este endpoint está restringido solo para administradores y devuelve
    información completa de productos incluyendo estados de activación
    de todas las tablas relacionadas.
    
    Args:
        ordenar_por (str): Campo para ordenar ('precio', 'nombre', 'stock', 'fecha', 'categoria', 'marca')
        orden (str): Dirección del orden ('ASC' o 'DESC')
        limit (int): Límite de resultados (máximo 1000)
        offset (int): Offset para paginación
        db (Session): Sesión de la base de datos
        current_user (UserInToken): Usuario autenticado (debe ser admin)
        
    Returns:
        list[ProductAdminResponse]: Lista de productos con información completa para admin
    """
    # Validar parámetros
    if ordenar_por not in ['precio', 'nombre', 'stock', 'fecha', 'categoria', 'marca']:
        ordenar_por = 'nombre'
    
    if orden.upper() not in ['ASC', 'DESC']:
        orden = 'ASC'
    
    if limit > 1000:
        limit = 1000
    
    if offset < 0:
        offset = 0
    
    params = {
        'ordenar_por': ordenar_por,
        'orden': orden.upper(),
        'limit': limit,
        'offset': offset
    }
    
    products = product_service.get_products_admin(db, params)
    if not products:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron productos")
    
    return products

#endpoint de prueba temporal (sin autenticación)
@router.get("/products-admin-test", response_model=list[ProductAdminResponse])
async def get_products_admin_test(
    ordenar_por: str = "nombre",
    orden: str = "ASC", 
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Endpoint de prueba para productos admin (sin autenticación).
    
    Este endpoint está temporalmente sin autenticación para pruebas.
    """
    # Validar parámetros
    if ordenar_por not in ['precio', 'nombre', 'stock', 'fecha', 'categoria', 'marca']:
        ordenar_por = 'nombre'
    
    if orden.upper() not in ['ASC', 'DESC']:
        orden = 'ASC'
    
    if limit > 1000:
        limit = 1000
    
    if offset < 0:
        offset = 0
    
    params = {
        'ordenar_por': ordenar_por,
        'orden': orden.upper(),
        'limit': limit,
        'offset': offset
    }
    
    products = product_service.get_products_admin(db, params)
    if not products:
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

# Detalle admin con joins completos
@router.get(
    "/products-admin/{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}",
    response_model=Product
)
async def get_product_admin_detail(
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,
    id_producto: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    product = product_service.get_product_admin_detail(
        db, id_categoria, id_linea, id_sublinea, id_producto
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return product

# Productos por sublínea
@router.get("/products/subline/{id_sublinea}", response_model=list[Product])
async def get_products_by_subline(id_sublinea: Decimal, db: Session = Depends(get_db)):
    """
    Obtener todos los productos de una sublínea específica.

    Args:
        id_sublinea (Decimal): ID de la sublínea.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        list[Product]: Lista de productos de la sublínea especificada.
    """
    products = product_service.get_products_by_subline(db, id_sublinea)
    if not products:
        return []  # Retornar lista vacía en lugar de error
    return products

#crea un producto
@router.post("/products", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_product(
    request: Request,
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
    image_files: Optional[List[UploadFile]] = File(None, description="Múltiples archivos de imagen para el producto")
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
        # Manejar archivos de imagen (convertir None a lista vacía si es necesario)
        files_to_process = image_files if image_files else []
        
        print(f"🔍 ROUTER DEBUG: image_files recibidos: {image_files}")
        print(f"🔍 ROUTER DEBUG: Tipo: {type(image_files)}")
        print(f"🔍 ROUTER DEBUG: files_to_process: {files_to_process}")
        print(f"🔍 ROUTER DEBUG: Content-Type del request: {request.headers.get('content-type')}")
        
        if files_to_process:
            print(f"🔍 ROUTER DEBUG: Cantidad de archivos: {len(files_to_process)}")
            for i, file in enumerate(files_to_process):
                print(f"🔍 ROUTER DEBUG: Archivo {i}: {file.filename}, tipo: {file.content_type}, tamaño: {file.size}")
        else:
            print(f"🔍 ROUTER DEBUG: No se recibieron archivos - image_files es: {image_files}")
        
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
        print(f"🔍 ROUTER DEBUG: Llamando a product_service.create_product con files_to_process: {files_to_process}")
        service_response_message = await product_service.create_product(
            db, 
            product_data, 
            files_to_process, 
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
    img_producto: Optional[str] = Form(None),  # JSON como string para imágenes existentes
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
        if img_producto is not None:
            try:
                update_data['img_producto'] = json.loads(img_producto)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="El campo 'img_producto' debe ser una cadena JSON válida.")
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

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se recibieron datos para actualizar. Verifica que el formulario envíe nom_producto, spcf_producto, val_precio, num_stock, etc."
            )

        # Crear el objeto ProductUpdate
        product_data = ProductUpdate(**update_data)

        print(f"🔍 ROUTER UPDATE DEBUG: update_data keys recibidos: {list(update_data.keys())}")
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



# Ruta para activar/desactivar un producto existente
@router.put(
    "/products/{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}/toggle", 
    response_model=ResponseMessage, 
    status_code=status.HTTP_200_OK
    )
async def toggle_product(
    id_categoria: Decimal,
    id_linea: Decimal,  
    id_sublinea: Decimal,
    id_producto: Decimal,
    toggle_data: ToggleRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Activa o desactiva un producto existente de la base de datos.
    Aplica cascada a comentarios relacionados.

    Args:
        id_categoria (Decimal): ID de la categoría del producto.
        id_linea (Decimal): ID de la línea del producto.
        id_sublinea (Decimal): ID de la sublínea del producto.
        id_producto (Decimal): ID del producto a activar/desactivar.
        toggle_data (ToggleRequest): Datos con el campo activar (bool).
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado.

    Returns:
        ResponseMessage: Mensaje de confirmación con detalles de elementos afectados.
    """
    try:
        activar = toggle_data.activar
        result = product_service.deactivate_activate_product(
            db, 
            id_categoria, 
            id_linea, 
            id_sublinea, 
            id_producto,
            current_user.id_usuario,
            activar
        )
        message = result if result else f"Producto {'activado' if activar else 'desactivado'} exitosamente"
        return ResponseMessage(message=message)
    except Exception as e:
        import traceback
        error_detail = f"Error al cambiar estado del producto: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_detail)

# Ruta para desactivar un producto existente (mantener compatibilidad)
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
    Desactiva un producto existente de la base de datos.
    Mantiene compatibilidad con endpoints existentes.

    Args:
        id_categoria (Decimal): ID de la categoría del producto.
        id_linea (Decimal): ID de la línea del producto.
        id_sublinea (Decimal): ID de la sublínea del producto.
        id_producto (Decimal): ID del producto a desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        result = product_service.deactivate_product(
            db, 
            id_categoria, 
            id_linea, 
            id_sublinea, 
            id_producto,
            current_user.id_usuario
        )
        message = result if result else "Producto desactivado exitosamente"
        return ResponseMessage(message=message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/products/{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}/active",
    response_model=ResponseMessage,
    status_code=status.HTTP_200_OK,
)
async def set_product_active(
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,
    id_producto: Decimal,
    active: bool = Form(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Actualiza solo el campo ind_activo de un producto.
    """
    try:
        product_service.set_product_active(
            db,
            id_categoria,
            id_linea,
            id_sublinea,
            id_producto,
            active,
            current_user.id_usuario,
        )
        return ResponseMessage(message="Estado del producto actualizado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ==================== ENDPOINTS DE FILTROS ====================

@router.get("/products/filter", response_model=ProductFilterResponse)
async def filter_products(
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user_optional)
):
    """
    Filtrar productos con criterios avanzados.
    
    Este endpoint permite filtrar productos utilizando múltiples criterios
    como categoría, línea, sublínea, marca, proveedor, nombre, precio, stock, etc.
    Utiliza la función de base de datos fun_filter_products para obtener
    resultados optimizados con paginación.
    
    Args:
        request (Request): Request object para acceder a los query parameters.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado (opcional).
    
    Returns:
        ProductFilterResponse: Respuesta con productos filtrados y metadatos de paginación.
        
    Raises:
        HTTPException: Si ocurre un error durante el filtrado.
    """
    try:
        # Obtener query parameters manualmente
        query_params = request.query_params
        
        # Procesar parámetros que pueden ser múltiples
        def get_list_param(param_name: str) -> Optional[List[int]]:
            values = query_params.getlist(param_name)
            if not values:
                return None
            try:
                return [int(v) for v in values]
            except ValueError:
                return None
        
        # Crear objeto de filtros manualmente
        filters = ProductFilterParams(
            id_categoria=get_list_param('id_categoria'),
            id_linea=get_list_param('id_linea'),
            id_sublinea=get_list_param('id_sublinea'),
            id_marca=get_list_param('id_marca'),
            id_proveedor=get_list_param('id_proveedor'),
            nombre_producto=query_params.get('nombre_producto'),
            precio_min=Decimal(query_params.get('precio_min')) if query_params.get('precio_min') else None,
            precio_max=Decimal(query_params.get('precio_max')) if query_params.get('precio_max') else None,
            stock_min=int(query_params.get('stock_min')) if query_params.get('stock_min') else None,
            solo_con_stock=query_params.get('solo_con_stock', 'false').lower() == 'true',
            ordenar_por=query_params.get('ordenar_por', 'nombre'),
            orden=query_params.get('orden', 'ASC'),
            limit=int(query_params.get('limit', 20)),
            offset=int(query_params.get('offset', 0))
        )
        
        result = product_service.filter_products(db, filters)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/products/filter/stats", response_model=ProductFilterStats)
async def get_filter_stats(
    filters: ProductFilterParams = Depends(),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user_optional)
):
    """
    Obtener estadísticas de productos filtrados.
    
    Este endpoint devuelve información estadística sobre los productos
    que coinciden con los criterios de filtrado, incluyendo totales,
    rangos de precios, stock disponible, etc.
    
    Args:
        filters (ProductFilterParams): Parámetros de filtrado para las estadísticas.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado (opcional).
    
    Returns:
        ProductFilterStats: Estadísticas de los productos filtrados.
        
    Raises:
        HTTPException: Si ocurre un error al obtener las estadísticas.
    """
    try:
        stats = product_service.get_filter_stats(db, filters)
        return stats
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/products/filter/options")
async def get_filter_options(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user_optional)
):
    """
    Obtener opciones disponibles para los filtros.
    
    Este endpoint devuelve las opciones disponibles para poblar
    los selectores del frontend, incluyendo categorías, líneas,
    sublíneas, marcas, proveedores y rangos de precios.
    
    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado (opcional).
    
    Returns:
        dict: Diccionario con las opciones de filtro disponibles.
        
    Raises:
        HTTPException: Si ocurre un error al obtener las opciones.
    """
    try:
        options = product_service.get_filter_options(db)
        return options
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/products/search")
async def search_products(
    q: str,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user_optional)
):
    """
    Búsqueda rápida de productos por nombre.
    
    Este endpoint permite realizar búsquedas rápidas de productos
    por nombre, útil para autocompletado y búsquedas en tiempo real.
    
    Args:
        q (str): Término de búsqueda.
        limit (int): Límite de resultados (máximo 50).
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado (opcional).
    
    Returns:
        ProductFilterResponse: Respuesta con productos encontrados.
        
    Raises:
        HTTPException: Si ocurre un error durante la búsqueda.
    """
    try:
        # Validar límite
        if limit > 50:
            limit = 50
        
        # Crear filtros para búsqueda
        search_filters = ProductFilterParams(
            nombre_producto=q,
            limit=limit,
            offset=0,
            ordenar_por="nombre",
            orden="ASC"
        )
        
        result = product_service.filter_products(db, search_filters)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))