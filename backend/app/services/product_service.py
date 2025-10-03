"""
Módulo de Servicios de Producto.

Este módulo contiene la lógica de negocio para gestionar los productos.
Se encarga de interactuar con la base de datos para realizar operaciones
CRUD (Crear, Leer, Actualizar, Eliminar) sobre los productos, utilizando
funciones de base de datos (procedimientos almacenados o funciones SQL).

Las funciones aquí definidas son llamadas por los routers de la API
y utilizan los esquemas Pydantic para la validación y transformación de datos.
"""
# Lógica de negocio 
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import UploadFile
from typing import List, Optional
import json
from psycopg2.extras import Json

from schemas.product_schema import ProductCreate, ProductUpdate, ProductFilterParams, ProductFiltered, ProductFilterResponse, ProductFilterStats
from services import cloudinary_service
# No necesitamos importar el schema Product aquí si solo devolvemos mappings
# y el router se encarga de la validación con el response_model.

#all products
def get_products_admin(db: Session, params: dict):
    """
    Obtiene todos los productos para el panel de administración.
    
    Utiliza la función SQL fun_get_all_products_admin para obtener
    productos con información completa incluyendo estados de activación.
    
    Args:
        db (Session): Sesión de la base de datos SQLAlchemy.
        params (dict): Parámetros de consulta (ordenar_por, orden, limit, offset)
        
    Returns:
        list: Lista de productos con información completa para admin
    """
    try:
        # Mapear campo de orden a columna SQL segura
        ordenar_por = (params or {}).get('ordenar_por', 'nombre')
        orden = (params or {}).get('orden', 'ASC')

        order_column_map = {
            'nombre': 'p.nom_producto',
            'precio': 'p.val_precio',
            'stock': 'p.num_stock',
            'fecha': 'p.fec_insert',
            'categoria': 'c.nom_categoria',
            'marca': 'm.nom_marca',
        }
        order_column = order_column_map.get(str(ordenar_por).lower(), 'p.nom_producto')
        order_direction = 'DESC' if str(orden).upper() == 'DESC' else 'ASC'

        # Usar CTE + DISTINCT ON y COUNT(*) OVER() para obtener total sin subconsulta costosa
        # DISTINCT ON requiere que las columnas de DISTINCT estén primero en ORDER BY
        query = text(f"""
            WITH base AS (
                SELECT DISTINCT ON (p.id_categoria, p.id_linea, p.id_sublinea, p.id_producto)
                    p.id_categoria::text,
                    p.id_linea::text,
                    p.id_sublinea::text,
                    p.id_producto::text,
                    c.nom_categoria,
                    l.nom_linea,
                    s.nom_sublinea,
                    p.nom_producto,
                    p.spcf_producto,
                    p.img_producto,
                    p.val_precio::text,
                    p.num_stock,
                    p.id_proveedor::text,
                    p.id_marca::text,
                    pr.nom_proveedor,
                    m.nom_marca,
                    p.fec_insert::text,
                    p.ind_activo as ind_activo_producto,
                    c.ind_activo as ind_activo_categoria,
                    l.ind_activo as ind_activo_linea,
                    s.ind_activo as ind_activo_sublinea,
                    pr.ind_activo as ind_activo_proveedor,
                    m.ind_activo as ind_activo_marca
                FROM tab_productos p
                INNER JOIN tab_categorias c ON p.id_categoria = c.id_categoria
                INNER JOIN tab_lineas l ON p.id_linea = l.id_linea AND p.id_categoria = l.id_categoria
                INNER JOIN tab_sublineas s ON p.id_sublinea = s.id_sublinea AND p.id_linea = s.id_linea AND p.id_categoria = s.id_categoria
                INNER JOIN tab_proveedores pr ON p.id_proveedor = pr.id_proveedor
                INNER JOIN tab_marcas m ON p.id_marca = m.id_marca
                ORDER BY p.id_categoria, p.id_linea, p.id_sublinea, p.id_producto, {order_column} {order_direction}
            )
            SELECT 
                *,
                COUNT(*) OVER() AS total_registros
            FROM base
            LIMIT :limit OFFSET :offset
        """)

        result = db.execute(query, params)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos para admin: {str(e)}")

def get_products(db: Session):
    """
    Obtiene todos los productos de la base de datos.

    Ejecuta una consulta SQL para seleccionar todos los productos y devuelve
    los resultados como una lista de diccionarios (RowMappings).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list: Una lista de diccionarios, donde cada diccionario representa un producto.
              FastAPI utilizará el `response_model` del endpoint para convertir esto
              en una lista de objetos `Product`.
    """
    try:
        # Seleccionamos todas las columnas de la tabla tab_productos.
        # Los nombres de las columnas deben coincidir con los campos del esquema Pydantic Product
        # o deben usarse alias si los nombres son diferentes en Pydantic.
        # En este caso, el esquema Product usa los nombres de columna directamente.
        query = text("""
        SELECT 
            id_categoria,
            id_linea,
            id_sublinea,
            id_producto,
            nom_producto,
            spcf_producto,
            img_producto,
            val_precio,
            id_proveedor,
            id_marca,
            num_stock,
            ind_activo,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_productos
        """)
        result = db.execute(query)
        # .mappings() convierte cada fila en un objeto tipo dict (RowMapping)
        # FastAPI puede usar esto para poblar el modelo Pydantic Product definido en el router.
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos: {str(e)}")

#single product
def get_product(
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,
    id_producto: Decimal,
    db: Session
    ):
    """
    Obtiene un producto específico de la base de datos.

    Ejecuta una consulta SQL para seleccionar un producto por su ID y devuelve
    el resultado como un diccionario (RowMapping).
    """
    try:
        query = text(
            """SELECT 
                id_categoria,
                id_linea,
                id_sublinea,
                id_producto,
                nom_producto,
                spcf_producto,
                img_producto,
                val_precio,
                id_proveedor,
                id_marca,
                num_stock,
                ind_activo,
                usr_insert,
                fec_insert,
                usr_update,
                fec_update 
            FROM tab_productos 
            WHERE 
                id_categoria = :id_categoria AND
                id_linea = :id_linea AND 
                id_sublinea = :id_sublinea AND
                id_producto = :id_producto
                """)
        result = db.execute(
            query, 
            {
                "id_categoria":id_categoria,
                "id_linea":id_linea,
                "id_sublinea":id_sublinea,
                "id_producto":id_producto
            }
            )
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el producto: {str(e)}")

def get_product_admin_detail(
    db: Session,
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,
    id_producto: Decimal,
):
    """
    Obtiene un producto con información completa (joins) para edición en admin.
    """
    try:
        query = text(
            """
            SELECT 
                p.id_categoria::text,
                p.id_linea::text,
                p.id_sublinea::text,
                p.id_producto::text,
                c.nom_categoria, 
                l.nom_linea, 
                s.nom_sublinea, 
                p.nom_producto, 
                p.spcf_producto, 
                p.img_producto, 
                p.val_precio::text, 
                p.num_stock, 
                p.id_proveedor::text,
                p.id_marca::text,
                pr.nom_proveedor, 
                m.nom_marca,
                p.usr_insert::text,
                p.fec_insert::text,
                p.usr_update::text,
                p.fec_update::text,
                p.ind_activo as ind_activo_producto,
                c.ind_activo as ind_activo_categoria,
                l.ind_activo as ind_activo_linea,
                s.ind_activo as ind_activo_sublinea,
                pr.ind_activo as ind_activo_proveedor,
                m.ind_activo as ind_activo_marca
            FROM tab_productos p
            INNER JOIN tab_categorias c ON p.id_categoria = c.id_categoria
            INNER JOIN tab_lineas l ON p.id_linea = l.id_linea AND p.id_categoria = l.id_categoria
            INNER JOIN tab_sublineas s ON p.id_sublinea = s.id_sublinea AND p.id_linea = s.id_linea AND p.id_categoria = s.id_categoria
            INNER JOIN tab_proveedores pr ON p.id_proveedor = pr.id_proveedor
            INNER JOIN tab_marcas m ON p.id_marca = m.id_marca
            WHERE p.id_categoria = :id_categoria
              AND p.id_linea = :id_linea
              AND p.id_sublinea = :id_sublinea
              AND p.id_producto = :id_producto
            LIMIT 1
            """
        )
        params = {
            'id_categoria': id_categoria,
            'id_linea': id_linea,
            'id_sublinea': id_sublinea,
            'id_producto': id_producto,
        }
        result = db.execute(query, params).mappings().first()
        return result
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener detalle admin del producto: {str(e)}")

#create product
async def create_product(db: Session, product: ProductCreate, image_files: Optional[List[UploadFile]] = None, usr_insert: Decimal = None):
    """
    Crea un nuevo producto en la base de datos llamando a una función SQL.
    Si se proporcionan archivos de imagen, los sube a Cloudinary primero.

    Utiliza la función de base de datos `fun_insert_producto` para insertar
    un nuevo producto. Los datos del producto se toman del esquema `ProductCreate`.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        product (ProductCreate): Un objeto Pydantic `ProductCreate` con los datos del producto.
        image_files (Optional[List[UploadFile]]): Lista de archivos de imagen opcionales para subir a Cloudinary.

    Returns:
        dict or None: Un diccionario que representa el producto creado (generalmente el JSON
                      devuelto por la función SQL) o None si la creación falla o la función
                      SQL no devuelve el resultado esperado.
    """
    try:
        # Validación de integridad referencial a nivel de aplicación
        # 1) La línea debe pertenecer a la categoría
        validate_line = db.execute(text(
            """
            SELECT 1
            FROM tab_lineas l
            WHERE l.id_linea = :id_linea AND l.id_categoria = :id_categoria
            """
        ), {
            'id_linea': product.id_linea,
            'id_categoria': product.id_categoria
        }).first()

        if not validate_line:
            raise Exception("La línea seleccionada no pertenece a la categoría indicada")

        # 2) La sublínea debe pertenecer a la línea
        validate_subline = db.execute(text(
            """
            SELECT 1
            FROM tab_sublineas s
            WHERE s.id_sublinea = :id_sublinea AND s.id_linea = :id_linea
            """
        ), {
            'id_sublinea': product.id_sublinea,
            'id_linea': product.id_linea
        }).first()

        if not validate_subline:
            raise Exception("La sublínea seleccionada no pertenece a la línea indicada")
        print(f"🔍 DEBUG: image_files recibidos en servicio: {image_files}")
        print(f"🔍 DEBUG: Tipo de image_files: {type(image_files)}")
        
        # Si hay imágenes, subirlas a Cloudinary primero
        if image_files and len(image_files) > 0:
            print(f"🚀 DEBUG: Iniciando subida de {len(image_files)} imágenes a Cloudinary...")
            
            # Debug de cada archivo
            for i, file in enumerate(image_files):
                print(f"🔍 DEBUG: Archivo {i}: {file.filename}, tipo: {file.content_type}, tamaño: {file.size}")
            
            try:
                # Subir múltiples imágenes con transformación automática a WebP y optimización
                product_images = await cloudinary_service.upload_multiple_images(
                    image_files,
                    transform_to_webp=True,
                    quality="auto:good",
                    width=1200,  # Ancho máximo para productos
                    height=1200,  # Alto máximo para productos
                    generate_thumbnails=True
                )
                
                print(f"✅ DEBUG: Imágenes subidas exitosamente: {product_images}")
                
                # ✅ Mantener compatibilidad con el campo img_producto
                product.img_producto = product_images
                print(f"🖼️ DEBUG: img_producto asignado: {product.img_producto}")
                
                # ✅ No asignar a product.images ya que ProductCreate no tiene ese campo
                print(f"🖼️ DEBUG: Estructura completa de imágenes: {product_images}")
                
            except Exception as e:
                print(f"❌ ERROR al subir imágenes: {str(e)}")
                raise Exception(f"Error al subir imágenes a Cloudinary: {str(e)}")
        else:
            print("⚠️ DEBUG: No se recibieron archivos de imagen")
            product.img_producto = '{}'  # Estructura vacía
        
        # Asume que product.model_dump() tiene todas las claves que fun_insert_producto espera por nombre.
        params = product.model_dump()
        params["usr_insert"] = usr_insert
        
        # Convertir spcf_producto a Json de psycopg2 para JSONB
        if 'spcf_producto' in params:
            if isinstance(params['spcf_producto'], dict):
                params['spcf_producto'] = Json(params['spcf_producto'])
            elif isinstance(params['spcf_producto'], str):
                try:
                    params['spcf_producto'] = Json(json.loads(params['spcf_producto']))
                except json.JSONDecodeError:
                    params['spcf_producto'] = Json({})
        
        # Convertir img_producto a Json de psycopg2 para JSONB
        if 'img_producto' in params:
            if isinstance(params['img_producto'], dict):
                params['img_producto'] = Json(params['img_producto'])
                print(f"🔄 DEBUG: img_producto convertido a Json(dict): {params['img_producto']}")
            elif isinstance(params['img_producto'], str):
                try:
                    params['img_producto'] = Json(json.loads(params['img_producto']))
                    print(f"🔄 DEBUG: img_producto convertido a Json(dict) desde string")
                except json.JSONDecodeError:
                    params['img_producto'] = Json({})

        query = text("""SELECT fun_insert_producto(
            :id_categoria, 
            :id_linea, 
            :id_sublinea,
            :nom_producto, 
            :spcf_producto, 
            :img_producto, 
            :val_precio, 
            :id_proveedor, 
            :id_marca, 
            :num_stock,
            :usr_insert
        )""")
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear el producto: {str(e)}")

#update product
async def update_product(
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,         
    id_producto: Decimal,
    product: ProductUpdate,
    db: Session,
    image_files: Optional[List[UploadFile]] = None,
    usr_update: Decimal = None
    ):
    """
    Actualiza un producto existente en la base de datos llamando a una función SQL.
    Si se proporciona un archivo de imagen, lo sube a Cloudinary primero.

    Utiliza la función de base de datos `fun_update_producto` para actualizar
    un producto existente, identificado por `id_producto`. Los datos para la
    actualización se toman del esquema `ProductUpdate` (solo campos proporcionados).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_producto (int): El ID del producto a actualizar.
        product (ProductUpdate): Un objeto Pydantic `ProductUpdate` con los datos a actualizar.
        image_file (Optional[UploadFile]): Archivo de imagen opcional para subir a Cloudinary.

    Returns:
        dict or None: Un diccionario que representa el producto actualizado (generalmente el JSON
                      devuelto por la función SQL) o None si la actualización falla o la función
                      SQL no devuelve el resultado esperado.
    """
    try:
        print(f"🔍 DEBUG UPDATE: image_files recibidos en servicio: {image_files}")
        print(f"🔍 DEBUG UPDATE: Tipo de image_files: {type(image_files)}")
        
        # Si hay imágenes, subirlas a Cloudinary primero
        if image_files and len(image_files) > 0:
            print(f"🚀 DEBUG UPDATE: Iniciando subida de {len(image_files)} imágenes a Cloudinary...")
            
            # Debug de cada archivo
            for i, file in enumerate(image_files):
                print(f"🔍 DEBUG UPDATE: Archivo {i}: {file.filename}, tipo: {file.content_type}, tamaño: {file.size}")
            
            try:
                # Subir múltiples imágenes con transformación automática a WebP y optimización
                product_images = await cloudinary_service.upload_multiple_images(
                    image_files,
                    transform_to_webp=True,
                    quality="auto:good",
                    width=1200,  # Ancho máximo para productos
                    height=1200,  # Alto máximo para productos
                    generate_thumbnails=True
                )
                
                print(f"✅ DEBUG UPDATE: Imágenes subidas exitosamente: {product_images}")
                
                # ✅ Mantener compatibilidad con el campo img_producto
                product.img_producto = product_images
                print(f"🖼️ DEBUG UPDATE: img_producto asignado: {product.img_producto}")
                
                # ✅ No asignar a product.images ya que ProductUpdate no tiene ese campo
                print(f"🖼️ DEBUG UPDATE: Estructura completa de imágenes: {product_images}")
                
            except Exception as e:
                print(f"❌ ERROR UPDATE al subir imágenes: {str(e)}")
                raise Exception(f"Error al subir imágenes a Cloudinary: {str(e)}")
        else:
            print("⚠️ DEBUG UPDATE: No se recibieron archivos de imagen")
            # No modificar img_producto si no hay nuevas imágenes
        
        params = product.model_dump(exclude_unset=True) # Solo incluye campos que se proporcionaron

        # Asegurar que TODAS las llaves esperadas por la función SQL existan
        # aunque sea con valor None, para evitar errores de bind parameter faltante
        expected_keys = [
            'nom_producto',
            'spcf_producto',
            'img_producto',
            'val_precio',
            'id_proveedor',
            'id_marca',
            'num_stock',
            'ind_activo',
        ]
        for key in expected_keys:
            if key not in params:
                params[key] = None
        
        # Convertir spcf_producto a Json de psycopg2 para JSONB
        if 'spcf_producto' in params and params['spcf_producto'] is not None:
            if isinstance(params['spcf_producto'], dict):
                params['spcf_producto'] = Json(params['spcf_producto'])
            elif isinstance(params['spcf_producto'], str):
                try:
                    params['spcf_producto'] = Json(json.loads(params['spcf_producto']))
                except json.JSONDecodeError:
                    params['spcf_producto'] = Json({})
        
        # Convertir img_producto a Json de psycopg2 para JSONB
        if 'img_producto' in params:
            if params['img_producto'] is None:
                # enviar objeto vacío como Json
                params['img_producto'] = Json({})
            elif isinstance(params['img_producto'], dict):
                params['img_producto'] = Json(params['img_producto'])
                print(f"🔄 DEBUG UPDATE: img_producto convertido a Json(dict)")
            elif isinstance(params['img_producto'], str):
                try:
                    params['img_producto'] = Json(json.loads(params['img_producto']))
                    print(f"🔄 DEBUG UPDATE: img_producto convertido a Json(dict) desde string")
                except json.JSONDecodeError:
                    params['img_producto'] = Json({})
            
        params['id_categoria'] = id_categoria
        params['id_linea'] = id_linea
        params['id_sublinea'] = id_sublinea
        params['id_producto'] = id_producto
        params['usr_update'] = usr_update

        # La función SQL debe poder manejar que algunos de los otros parámetros no estén presentes
        # o sean NULL si product.model_dump(exclude_unset=True) los omite.
        # Asegúrate de que los nombres de los parámetros coincidan con los de tu función SQL.
        query = text(
            """
            SELECT fun_update_producto(
            :id_categoria, 
            :id_linea, 
            :id_sublinea,
            :id_producto,     
            :nom_producto, 
            :spcf_producto, 
            :img_producto, 
            :val_precio, 
            :id_proveedor, 
            :id_marca, 
            :num_stock, 
            :ind_activo,
            :usr_update
            )
            """
        )
        
        # Es crucial que fun_update_producto esté diseñada para tomar estos 12 parámetros
        # y que pueda manejar `None` o la ausencia de algunos de ellos (excepto id_producto).
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar el producto: {str(e)}")

def deactivate_product(
    db: Session, 
    category_id: Decimal,
    line_id: Decimal,
    subline_id: Decimal,
    product_id: Decimal,
    usr_update: Decimal
    ):
    """
    Desactiva un producto existente de la base de datos.
    
    Utiliza la función de base de datos `fun_deactivate_producto` para eliminar
    un producto existente, identificado por `id_producto`.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        category_id (Decimal): El ID de la categoría del producto a desactivar.
        line_id (Decimal): El ID de la línea del producto a desactivar.
        subline_id (Decimal): El ID de la sublínea del producto a desactivar.
        product_id (Decimal): El ID del producto a desactivar.
    
    Returns:
        dict or None: Un diccionario con el mensaje de resultado o None si falla.
    """
    try:
        params = {
            'p_id_categoria': category_id,
            'p_id_linea': line_id,
            'p_id_sublinea': subline_id,
            'p_id_producto': product_id,
            'p_usr_update': usr_update
        }
        query = text("""
        SELECT fun_deactivate_producto(
            :p_id_categoria, 
            :p_id_linea, 
            :p_id_sublinea, 
            :p_id_producto,
            :p_usr_update
            )
        """)
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar el producto: {str(e)}")


def set_product_active(
    db: Session,
    category_id: Decimal,
    line_id: Decimal,
    subline_id: Decimal,
    product_id: Decimal,
    active: bool,
    usr_update: Decimal,
):
    """
    Actualiza únicamente el campo ind_activo de un producto.

    Evita depender de la función fun_update_producto y no requiere otros campos.
    """
    try:
        query = text(
            """
            SELECT fun_set_producto_activo(
              :id_categoria,
              :id_linea,
              :id_sublinea,
              :id_producto,
              :active,
              :usr_update
            )
            """
        )
        params = {
            'id_categoria': category_id,
            'id_linea': line_id,
            'id_sublinea': subline_id,
            'id_producto': product_id,
            'active': active,
            'usr_update': usr_update,
        }
        result = db.execute(query, params)
        fetched = result.fetchone()
        db.commit()
        return fetched[0] if fetched else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar estado del producto: {str(e)}")

#filter products
def filter_products(db: Session, filters: ProductFilterParams) -> ProductFilterResponse:
    """
    Filtra productos utilizando la función de base de datos fun_filter_products.
    
    Ejecuta la función SQL fun_filter_products con los parámetros de filtrado
    proporcionados y devuelve los resultados con información de paginación.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        filters (ProductFilterParams): Parámetros de filtrado validados.
    
    Returns:
        ProductFilterResponse: Respuesta con productos filtrados y metadatos de paginación.
    """
    try:
        # Validar rangos de precios
        if filters.precio_min is not None and filters.precio_max is not None:
            if filters.precio_min > filters.precio_max:
                raise ValueError("El precio mínimo no puede ser mayor al precio máximo")
        
        # Procesar arrays - ahora siempre son listas
        def get_single_value(value):
            if value is None or len(value) == 0:
                return None
            elif len(value) == 1:
                return value[0]
            else:
                return None  # Para arrays, usaremos los parámetros de array
        
        def get_array_value(value):
            if value is None or len(value) == 0:
                return None
            elif len(value) == 1:
                return None  # Para valores únicos, usaremos los parámetros únicos
            else:
                return value
        
        # Preparar parámetros para la función de DB
        params = {
            # Parámetros únicos
            "p_id_categoria": get_single_value(filters.id_categoria),
            "p_id_linea": get_single_value(filters.id_linea),
            "p_id_sublinea": get_single_value(filters.id_sublinea),
            "p_id_marca": get_single_value(filters.id_marca),
            "p_id_proveedor": get_single_value(filters.id_proveedor),
            "p_nombre_producto": filters.nombre_producto,
            "p_precio_min": filters.precio_min,
            "p_precio_max": filters.precio_max,
            "p_stock_min": filters.stock_min,
            "p_solo_con_stock": filters.solo_con_stock,
            "p_ordenar_por": filters.ordenar_por,
            "p_orden": filters.orden,
            "p_limit": filters.limit,
            "p_offset": filters.offset,
            # Parámetros de arrays
            "p_id_categorias": get_array_value(filters.id_categoria),
            "p_id_lineas": get_array_value(filters.id_linea),
            "p_id_sublineas": get_array_value(filters.id_sublinea),
            "p_id_marcas": get_array_value(filters.id_marca),
            "p_id_proveedores": get_array_value(filters.id_proveedor)
        }
        
        # Usar función de base de datos
        query = text("""
            SELECT * FROM fun_filter_products(
                :p_id_categoria,
                :p_id_linea,
                :p_id_sublinea,
                :p_id_marca,
                :p_id_proveedor,
                :p_nombre_producto,
                :p_precio_min,
                :p_precio_max,
                :p_stock_min,
                :p_solo_con_stock,
                :p_ordenar_por,
                :p_orden,
                :p_limit,
                :p_offset,
                :p_id_categorias,
                :p_id_lineas,
                :p_id_sublineas,
                :p_id_marcas,
                :p_id_proveedores
            )
        """)
        
        result = db.execute(query, params)
        products_data = result.mappings().all()
        
        # Debug: Información de la consulta a la DB
        print(f"🔍 Debug DB Query:")
        print(f"  - Registros devueltos por la DB: {len(products_data)}")
        if products_data:
            print(f"  - Primer registro total_registros: {products_data[0].get('total_registros', 'N/A')}")
            print(f"  - IDs únicos en la respuesta: {set(row['id_producto'] for row in products_data)}")
        
        # Convertir a objetos ProductFiltered
        products = []
        total = 0
        seen_products = set()  # Para evitar duplicados
        
        for row in products_data:
            # Crear clave única para evitar duplicados
            product_key = f"{row['id_categoria']}-{row['id_linea']}-{row['id_sublinea']}-{row['id_producto']}"
            
            # Saltar si ya hemos procesado este producto
            if product_key in seen_products:
                continue
                
            seen_products.add(product_key)
            
            # Convertir spcf_producto de JSON string a dict si es necesario
            spcf_producto = row['spcf_producto']
            if isinstance(spcf_producto, str):
                try:
                    spcf_producto = json.loads(spcf_producto)
                except json.JSONDecodeError:
                    spcf_producto = {}
            
            # Convertir img_producto de JSON string a dict si es necesario
            img_producto = row['img_producto']
            if isinstance(img_producto, str):
                try:
                    img_producto = json.loads(img_producto)
                except json.JSONDecodeError:
                    img_producto = None
            
            product = ProductFiltered(
                id_categoria=row['id_categoria'],
                id_linea=row['id_linea'],
                id_sublinea=row['id_sublinea'],
                id_producto=row['id_producto'],
                nom_categoria=row['nom_categoria'],
                nom_linea=row['nom_linea'],
                nom_sublinea=row['nom_sublinea'],
                nom_producto=row['nom_producto'],
                spcf_producto=spcf_producto,
                img_producto=img_producto,
                val_precio=row['val_precio'],
                num_stock=row['num_stock'],
                nom_proveedor=row['nom_proveedor'],
                nom_marca=row['nom_marca'],
                fec_insert=row['fec_insert'],
                total_registros=row['total_registros']
            )
            products.append(product)
            
            # Obtener total de registros del primer resultado
            if total == 0:
                total = row['total_registros']
        
        # Calcular información de paginación
        # Usar el número real de productos únicos en lugar del total_registros de la DB
        actual_total = len(products)
        page = (filters.offset // filters.limit) + 1
        total_pages = (actual_total + filters.limit - 1) // filters.limit if actual_total > 0 else 0
        
        # Debug: Log para entender la discrepancia
        duplicates_removed = len(products_data) - actual_total
        print(f"🔍 Debug filter_products:")
        print(f"  - Productos únicos devueltos: {actual_total}")
        print(f"  - Total de la DB (primer registro): {total}")
        print(f"  - Registros procesados de la DB: {len(products_data)}")
        print(f"  - Duplicados eliminados: {duplicates_removed}")
        print(f"  - Filtros aplicados: {filters}")
        
        return ProductFilterResponse(
            products=products,
            total=actual_total,  # Usar el total real de productos únicos
            page=page,
            total_pages=total_pages,
            limit=filters.limit,
            offset=filters.offset
        )
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al filtrar productos: {str(e)}")

def get_filter_stats(db: Session, filters: ProductFilterParams) -> ProductFilterStats:
    """
    Obtiene estadísticas de los productos que coinciden con los criterios de filtrado.
    
    Ejecuta una consulta agregada para obtener información estadística
    sobre los productos filtrados.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        filters (ProductFilterParams): Parámetros de filtrado para las estadísticas.
    
    Returns:
        ProductFilterStats: Estadísticas de los productos filtrados.
    """
    try:
        # Construir condiciones WHERE dinámicamente
        where_conditions = [
            "c.ind_activo = true",
            "l.ind_activo = true", 
            "s.ind_activo = true",
            "p.ind_activo = true",
            "pr.ind_activo = true",
            "m.ind_activo = true"
        ]
        
        params = {}
        
        # Agregar filtros según parámetros
        if filters.id_categoria is not None:
            where_conditions.append("p.id_categoria = :id_categoria")
            params["id_categoria"] = filters.id_categoria
            
        if filters.id_linea is not None:
            where_conditions.append("p.id_linea = :id_linea")
            params["id_linea"] = filters.id_linea
            
        if filters.id_sublinea is not None:
            where_conditions.append("p.id_sublinea = :id_sublinea")
            params["id_sublinea"] = filters.id_sublinea
            
        if filters.id_marca is not None:
            where_conditions.append("p.id_marca = :id_marca")
            params["id_marca"] = filters.id_marca
            
        if filters.id_proveedor is not None:
            where_conditions.append("p.id_proveedor = :id_proveedor")
            params["id_proveedor"] = filters.id_proveedor
            
        if filters.nombre_producto is not None and filters.nombre_producto.strip():
            where_conditions.append("UPPER(p.nom_producto) LIKE UPPER(:nombre_producto)")
            params["nombre_producto"] = f"%{filters.nombre_producto}%"
            
        if filters.precio_min is not None:
            where_conditions.append("p.val_precio >= :precio_min")
            params["precio_min"] = filters.precio_min
            
        if filters.precio_max is not None:
            where_conditions.append("p.val_precio <= :precio_max")
            params["precio_max"] = filters.precio_max
            
        if filters.stock_min is not None:
            where_conditions.append("p.num_stock >= :stock_min")
            params["stock_min"] = filters.stock_min
            
        if filters.solo_con_stock:
            where_conditions.append("p.num_stock > 0")
        
        # Construir query de estadísticas
        where_clause = " AND ".join(where_conditions)
        
        query = text(f"""
            SELECT 
                COUNT(*) as total_productos,
                MIN(p.val_precio) as precio_minimo,
                MAX(p.val_precio) as precio_maximo,
                AVG(p.val_precio) as precio_promedio,
                SUM(p.num_stock) as total_stock,
                COUNT(DISTINCT p.id_categoria) as categorias_disponibles,
                COUNT(DISTINCT p.id_marca) as marcas_disponibles
            FROM tab_lineas l 
            INNER JOIN tab_categorias c ON l.id_categoria = c.id_categoria
            INNER JOIN tab_sublineas s ON l.id_linea = s.id_linea
            INNER JOIN tab_productos p ON s.id_sublinea = p.id_sublinea
            INNER JOIN tab_proveedores pr ON p.id_proveedor = pr.id_proveedor
            INNER JOIN tab_marcas m ON p.id_marca = m.id_marca
            WHERE {where_clause}
        """)
        
        result = db.execute(query, params)
        stats_data = result.mappings().first()
        
        if not stats_data:
            return ProductFilterStats(
                total_productos=0,
                precio_minimo=None,
                precio_maximo=None,
                precio_promedio=None,
                total_stock=0,
                categorias_disponibles=0,
                marcas_disponibles=0
            )
        
        return ProductFilterStats(
            total_productos=stats_data['total_productos'] or 0,
            precio_minimo=stats_data['precio_minimo'],
            precio_maximo=stats_data['precio_maximo'],
            precio_promedio=stats_data['precio_promedio'],
            total_stock=stats_data['total_stock'] or 0,
            categorias_disponibles=stats_data['categorias_disponibles'] or 0,
            marcas_disponibles=stats_data['marcas_disponibles'] or 0
        )
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener estadísticas de filtros: {str(e)}")

def get_filter_options(db: Session) -> dict:
    """
    Obtiene las opciones disponibles para los filtros de productos.
    
    Devuelve listas de categorías, líneas, sublíneas, marcas y proveedores
    activos para poblar los selectores del frontend.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
    
    Returns:
        dict: Diccionario con las opciones de filtro disponibles.
    """
    try:
        # Obtener categorías activas
        categorias_query = text("""
            SELECT id_categoria, nom_categoria 
            FROM tab_categorias 
            WHERE ind_activo = true 
            ORDER BY nom_categoria
        """)
        categorias = db.execute(categorias_query).mappings().all()
        
        # Obtener líneas activas
        lineas_query = text("""
            SELECT id_linea, nom_linea, id_categoria
            FROM tab_lineas 
            WHERE ind_activo = true 
            ORDER BY nom_linea
        """)
        lineas = db.execute(lineas_query).mappings().all()
        
        # Obtener sublíneas activas
        sublineas_query = text("""
            SELECT id_sublinea, nom_sublinea, id_linea
            FROM tab_sublineas 
            WHERE ind_activo = true 
            ORDER BY nom_sublinea
        """)
        sublineas = db.execute(sublineas_query).mappings().all()
        
        # Obtener marcas activas
        marcas_query = text("""
            SELECT id_marca, nom_marca 
            FROM tab_marcas 
            WHERE ind_activo = true 
            ORDER BY nom_marca
        """)
        marcas = db.execute(marcas_query).mappings().all()
        
        # Obtener proveedores activos
        proveedores_query = text("""
            SELECT id_proveedor, nom_proveedor 
            FROM tab_proveedores 
            WHERE ind_activo = true 
            ORDER BY nom_proveedor
        """)
        proveedores = db.execute(proveedores_query).mappings().all()
        
        # Obtener rango de precios
        precios_query = text("""
            SELECT 
                MIN(val_precio) as precio_minimo,
                MAX(val_precio) as precio_maximo
            FROM tab_productos 
            WHERE ind_activo = true
        """)
        precios = db.execute(precios_query).mappings().first()
        
        return {
            "categorias": [dict(cat) for cat in categorias],
            "lineas": [dict(linea) for linea in lineas],
            "sublineas": [dict(sublinea) for sublinea in sublineas],
            "marcas": [dict(marca) for marca in marcas],
            "proveedores": [dict(proveedor) for proveedor in proveedores],
            "precio_rango": {
                "minimo": float(precios['precio_minimo']) if precios['precio_minimo'] else 0,
                "maximo": float(precios['precio_maximo']) if precios['precio_maximo'] else 0
            } if precios else {"minimo": 0, "maximo": 0}
        }
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener opciones de filtro: {str(e)}")