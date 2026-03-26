"""
Módulo de Rutas de Productos.

Define los endpoints de la API para la gestión de productos.
Incluye operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los productos.
Utiliza FastAPI para definir las rutas y depende del servicio de productos
para la lógica de negocio y del gestor de base de datos para las sesiones.

Mapa del módulo:
- Endpoints públicos de catálogo (`/products`, búsqueda, filtros, detalle).
- Endpoints admin para panel (`/products-admin`, crear/editar compuesto, toggle).
- Endpoints auxiliares de assets (`/products/upload-image`).

Relación con capas:
- Router: validación HTTP, parseo de query/form-data, permisos.
- Service: `product_service` centraliza lógica de negocio y persistencia.
"""
# Definición de rutas (endpoints) de la API para productos
from fastapi import APIRouter, Depends, Body, Form, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional, List, Union
import json
import logging

from core.database import get_db
from core.dependencies import require_admin, get_current_user, get_current_user_optional
from core.exceptions import get_safe_message
from schemas.product_schema import (
    Product,
    ProductCreate,
    ProductUpdate,
    ResponseMessage,
    ProductFilterParams,
    ProductFilterResponse,
    ProductFilterStats,
    ProductAdminResponse,
    ProductAdminParams,
    ToggleRequest,
    ProductCreateComposite,
)
from schemas.auth_schema import UserInToken
from services import product_service

router = APIRouter(tags=["Productos"])
logger = logging.getLogger(__name__)

# Todos los productos (catálogo público).
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

# Endpoint admin: productos con metadata completa y estados.
@router.get("/products-admin", response_model=list[ProductAdminResponse])
async def get_products_admin(
    ordenar_por: str = "nombre",
    orden: str = "ASC", 
    limit: int = 50,
    offset: int = 0,
    search: str | None = None,
    category_id: int | None = None,
    line_id: int | None = None,
    subline_id: int | None = None,
    id_marca: int | None = None,
    id_proveedor: int | None = None,
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
        search (str | None): Búsqueda por nombre de producto
        category_id (int | None): Filtrar por categoría
        id_marca (int | None): Filtrar por marca
        id_proveedor (int | None): Filtrar por proveedor
        db (Session): Sesión de la base de datos
        current_user (UserInToken): Usuario autenticado (debe ser admin)
        
    Returns:
        list[ProductAdminResponse]: Lista de productos con información completa para admin

    Endpoint -> Service:
    - Endpoint: `GET /products-admin`
    - Service: `product_service.get_products_admin`
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
        'offset': offset,
        'search': search,
        'category_id': category_id,
        'line_id': line_id,
        'subline_id': subline_id,
        'id_marca': id_marca,
        'id_proveedor': id_proveedor,
    }
    
    products = product_service.get_products_admin(db, params)
    # Devolver lista vacía si no hay productos (resultado válido con filtros)
    return products if products else []

# Endpoint temporal de prueba (sin autenticación).
@router.get("/products-admin-test", response_model=list[ProductAdminResponse])
async def get_products_admin_test(
    ordenar_por: str = "nombre",
    orden: str = "ASC", 
    limit: int = 50,
    offset: int = 0,
    search: str | None = None,
    category_id: int | None = None,
    line_id: int | None = None,
    subline_id: int | None = None,
    id_marca: int | None = None,
    id_proveedor: int | None = None,
    db: Session = Depends(get_db)
):
    """
    Endpoint de prueba para productos admin (sin autenticación).
    
    Este endpoint está temporalmente sin autenticación para pruebas.

    Uso recomendado:
    - solo en entornos controlados de desarrollo.
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
        'offset': offset,
        'search': search,
        'category_id': category_id,
        'line_id': line_id,
        'subline_id': subline_id,
        'id_marca': id_marca,
        'id_proveedor': id_proveedor,
    }
    
    products = product_service.get_products_admin(db, params)
    # Devolver lista vacía si no hay productos (resultado válido con filtros)
    return products if products else []


@router.get("/products-admin/filter-options")
async def get_filter_options_admin(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """
    Opciones de filtro para el panel de administración.

    Devuelve categorías, líneas, sublíneas, marcas y proveedores sin filtrar por ind_activo,
    para que el admin pueda ver y filtrar todos los productos (activos e inactivos).
    La tienda usa GET /products/filter/options (solo activos).
    """
    try:
        return product_service.get_filter_options_admin(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_safe_message(e),
        )


# Subir una imagen (devuelve URL); usado por el admin para imágenes de variantes
@router.post("/products/upload-image")
async def upload_single_image(
    file: UploadFile = File(..., description="Imagen a subir"),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Sube una imagen a Cloudinary y devuelve su URL pública.

    Endpoint -> Service:
    - Endpoint: `POST /products/upload-image`
    - Service: `cloudinary_service.upload_image`
    """
    try:
        from services import cloudinary_service
        url = await cloudinary_service.upload_image(
            file,
            folder="ecommerce",
            transform_to_webp=True,
            quality="auto:good",
            width=1200,
            height=1200,
        )
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))


# Detalle para edición: producto + variantes + atributos + image_urls (solo product_id)
@router.get("/products/{product_id}/admin-detail")
async def get_product_admin_detail_by_id(
    product_id: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """
    Devuelve detalle de producto para formulario compuesto de edición.

    Endpoint -> Service:
    - Endpoint: `GET /products/{product_id}/admin-detail`
    - Service: `product_service.get_product_with_variants_for_admin`
    """
    data = product_service.get_product_with_variants_for_admin(db, product_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return data


# Actualizar producto compuesto (producto + variantes + imágenes)
@router.put("/products/{product_id}/composite", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_product_composite_route(
    request: Request,
    product_id: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Actualiza producto compuesto (producto + variantes + imágenes).

    Soporta:
    - JSON puro
    - multipart con `payload` + `image_files`

    Endpoint -> Service:
    - Endpoint: `PUT /products/{product_id}/composite`
    - Service: `product_service.update_product_composite`
    """
    try:
        content_type = (request.headers.get("content-type") or "").lower()
        payload: ProductCreateComposite
        if "multipart/form-data" in content_type:
            form = await request.form()
            payload_str = form.get("payload")
            if not payload_str or not isinstance(payload_str, str):
                raise HTTPException(status_code=400, detail="Falta el campo 'payload' (JSON).")
            payload = ProductCreateComposite.model_validate_json(payload_str)
            files = form.getlist("image_files")
            if not isinstance(files, list):
                files = [files] if files else []
            files = [f for f in files if getattr(f, "filename", None)]
            if files:
                from services import cloudinary_service
                uploaded = await cloudinary_service.upload_multiple_images(
                    files, transform_to_webp=True, quality="auto:good", width=1200, height=1200, generate_thumbnails=True
                )
                urls = []
                main_url = uploaded.get("main") if isinstance(uploaded, dict) else getattr(uploaded, "main", None)
                gallery = uploaded.get("gallery") if isinstance(uploaded, dict) else getattr(uploaded, "gallery", None)
                if main_url:
                    urls.append(main_url)
                if gallery:
                    urls.extend(gallery)
                existing = set((payload.image_urls or []) or [])
                new_urls = [u for u in urls if (u or "").strip() and (u or "").strip() not in existing]
                payload.image_urls = (payload.image_urls or []) + new_urls
        else:
            body = await request.json()
            payload = ProductCreateComposite.model_validate(body)

        product_imgs = [u.strip() for u in (payload.image_urls or []) if (u or "").strip()]
        if not product_imgs:
            raise HTTPException(
                status_code=400,
                detail="La imagen principal del producto es obligatoria (panel de imágenes del producto).",
            )

        product_service.update_product_composite(db, product_id, payload, current_user.id_usuario)
        return ResponseMessage(message="Producto actualizado correctamente")
    except Exception as e:
        logger.exception("Error en update_product_composite_route product_id=%s", product_id)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))


# Crea un producto simple por form-data.
@router.post("/products", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_product(
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
    # Datos del producto como Form fields
    id_categoria: Decimal = Form(..., description="ID de categoría (tab_categories)."),
    name: str = Form(..., description="Nombre del producto (tab_products.name)."),
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
        id_categoria (Decimal): ID de la categoría (tab_categories).
        name (str): Nombre del producto (tab_products.name).
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

    Endpoint -> Service:
    - Endpoint: `POST /products`
    - Service: `product_service.create_product`
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
            name=name,
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))


@router.post("/products/composite", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_product_composite(
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
    image_files: Optional[List[UploadFile]] = File(None),
):
    """
    Crea producto + variantes + atributos dinámicos + imágenes en una sola transacción.
    Acepta JSON (Body) o multipart con "payload" (JSON string) y "image_files" (archivos).
    Si se envían archivos, se suben a Cloudinary y sus URLs se añaden a image_urls.

    Endpoint -> Service:
    - Endpoint: `POST /products/composite`
    - Service: `product_service.create_product_composite`
    """
    try:
        payload: ProductCreateComposite
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type:
            form = await request.form()
            payload_str = form.get("payload")
            if not payload_str or not isinstance(payload_str, str):
                raise HTTPException(status_code=400, detail="Falta el campo 'payload' (JSON) en el formulario.")
            payload = ProductCreateComposite.model_validate_json(payload_str)
            files = form.getlist("image_files")
            if files and isinstance(files, list) and len(files) > 0:
                from services import cloudinary_service
                uploaded = await cloudinary_service.upload_multiple_images(
                    [f for f in files if getattr(f, "filename", None)],
                    transform_to_webp=True,
                    quality="auto:good",
                    width=1200,
                    height=1200,
                    generate_thumbnails=True,
                )
                urls = []
                main_url = uploaded.get("main") if isinstance(uploaded, dict) else getattr(uploaded, "main", None)
                gallery = uploaded.get("gallery") if isinstance(uploaded, dict) else getattr(uploaded, "gallery", None)
                if main_url:
                    urls.append(main_url)
                if gallery:
                    urls.extend(gallery)
                payload.image_urls = (payload.image_urls or []) + urls
        else:
            body = await request.json()
            payload = ProductCreateComposite.model_validate(body)

        product_imgs = [u.strip() for u in (payload.image_urls or []) if (u or "").strip()]
        if not product_imgs:
            raise HTTPException(
                status_code=400,
                detail="La imagen principal del producto es obligatoria (panel de imágenes del producto).",
            )

        result = product_service.create_product_composite(db, payload, current_user.id_usuario)
        product_id = result.replace("OK:", "").strip()
        return ResponseMessage(message=f"Producto creado correctamente. ID: {product_id}")
    except Exception as e:
        logger.exception("Error en create_product_composite")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))


# Activar/desactivar producto por product_id
@router.put(
    "/products/{product_id}/toggle",
    response_model=ResponseMessage,
    status_code=status.HTTP_200_OK,
)
async def toggle_product_by_id(
    product_id: Decimal,
    toggle_data: ToggleRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Activa o desactiva un producto por su ID.

    Endpoint -> Service:
    - Endpoint: `PUT /products/{product_id}/toggle`
    - Service: `product_service.deactivate_activate_product`
    """
    try:
        product_service.deactivate_activate_product(
            db, Decimal(0), Decimal(0), Decimal(0), product_id, current_user.id_usuario, toggle_data.activar
        )
        return ResponseMessage(message=f"Producto {'activado' if toggle_data.activar else 'desactivado'} correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))


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

    Endpoint -> Service:
    - Endpoint: `GET /products/filter`
    - Service: `product_service.filter_products`
    """
    try:
        query_params = request.query_params

        def safe_int(val):
            try:
                return int(val) if val not in (None, "") else None
            except (ValueError, TypeError):
                return None

        def safe_decimal(val):
            try:
                return Decimal(val) if val not in (None, "") else None
            except (ValueError, TypeError):
                return None

        atributos_raw = query_params.get("atributos")
        atributos = None
        if atributos_raw:
            try:
                atributos = json.loads(atributos_raw)
                if not isinstance(atributos, dict):
                    atributos = None
            except (json.JSONDecodeError, TypeError):
                atributos = None

        filters = ProductFilterParams(
            category_id=safe_int(query_params.get("category_id")) or safe_int(query_params.get("id_categoria")),
            include_subcategories=query_params.get("include_subcategories", "true").lower() == "true",
            id_marca=safe_int(query_params.get("id_marca")),
            nombre_producto=query_params.get("nombre_producto") or None,
            precio_min=safe_decimal(query_params.get("precio_min")),
            precio_max=safe_decimal(query_params.get("precio_max")),
            solo_con_stock=query_params.get("solo_con_stock", "false").lower() == "true",
            solo_en_oferta=query_params.get("solo_en_oferta", "false").lower() == "true",
            ordenar_por=query_params.get("ordenar_por", "nombre"),
            orden=query_params.get("orden", "ASC"),
            limit=int(query_params.get("limit", 20)),
            offset=int(query_params.get("offset", 0)),
            atributos=atributos,
        )
        result = product_service.filter_products(db, filters)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=get_safe_message(e))

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

    Endpoint -> Service:
    - Endpoint: `GET /products/filter/stats`
    - Service: `product_service.get_filter_stats`
    """
    try:
        stats = product_service.get_filter_stats(db, filters)
        return stats
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=get_safe_message(e))

@router.get("/products/filter/options")
async def get_filter_options(
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user_optional)
):
    """
    Opciones de filtro: categorías, precio, marcas. Si se pasa category_id,
    además devuelve los atributos filtrables de esa categoría (y sus valores).

    Endpoint -> Service:
    - Endpoint: `GET /products/filter/options`
    - Service: `product_service.get_filter_options`
    """
    try:
        options = product_service.get_filter_options(db, category_id=category_id)
        return options
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=get_safe_message(e))

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

    Endpoint -> Service:
    - Endpoint: `GET /products/search`
    - Service: `product_service.filter_products` (con filtros de búsqueda)
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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=get_safe_message(e))


# Detalle de producto por slug o id (debe ir después de /products/filter, /products/search, etc.)
@router.get("/products/{slug_or_id}", response_model=Product)
async def get_product_by_slug_or_id(
    slug_or_id: str,
    db: Session = Depends(get_db),
):
    """
    Obtener un producto por slug (tab_products.slug) o por id.
    Acepta: slug (ej. "laptop-gamer"), id numérico ("5"), o formato legacy "5-null-null-5".

    Endpoint -> Service:
    - Endpoint: `GET /products/{slug_or_id}`
    - Service: `product_service.get_product_by_slug_or_id`
    """
    product = product_service.get_product_by_slug_or_id(db, slug_or_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return product