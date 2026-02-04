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
        # Primero obtener todos los productos
        products_query = text("""
        SELECT 
            p.id_categoria,
            p.id_linea,
            p.id_sublinea,
            p.id_producto,
            p.nom_producto,
            p.spcf_producto,
            p.img_producto,
            p.val_precio,
            p.id_proveedor,
            p.id_marca,
            p.num_stock,
            p.ind_activo,
            p.usr_insert,
            p.fec_insert,
            p.usr_update,
            p.fec_update
        FROM tab_productos p
        """)
        products_result = db.execute(products_query)
        products_data = products_result.mappings().all()
        
        # Obtener ratings promedio para todos los productos
        if products_data:
            # Obtener todos los ratings en una sola consulta
            ratings_query = text("""
                SELECT 
                    id_categoria,
                    id_linea,
                    id_sublinea,
                    id_producto,
                    ROUND(AVG(calificacion)::numeric, 1)::float as rating
                FROM tab_comentarios
                WHERE ind_activo = TRUE
                    AND calificacion IS NOT NULL
                GROUP BY id_categoria, id_linea, id_sublinea, id_producto
            """)
            ratings_result = db.execute(ratings_query)
            ratings_dict = {
                (r['id_categoria'], r['id_linea'], r['id_sublinea'], r['id_producto']): r['rating']
                for r in ratings_result.mappings().all()
            }
        else:
            ratings_dict = {}
        
        # Combinar productos con sus ratings
        products_with_ratings = []
        for product in products_data:
            product_key = (product['id_categoria'], product['id_linea'], product['id_sublinea'], product['id_producto'])
            rating = ratings_dict.get(product_key)
            # Crear un nuevo dict con el rating incluido
            product_dict = dict(product)
            product_dict['rating'] = rating
            products_with_ratings.append(product_dict)
        
        return products_with_ratings
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
    Obtiene un producto específico de la base de datos con nombres de categoría, línea, sublínea, marca y proveedor.

    Ejecuta una consulta SQL con JOINs para seleccionar un producto por su ID y devuelve
    el resultado como un diccionario (RowMapping) incluyendo los nombres de las tablas relacionadas.
    """
    try:
        query = text(
            """SELECT 
                p.id_categoria,
                p.id_linea,
                p.id_sublinea,
                p.id_producto,
                p.nom_producto,
                p.spcf_producto,
                p.img_producto,
                p.val_precio,
                p.id_proveedor,
                p.id_marca,
                p.num_stock,
                p.ind_activo,
                p.usr_insert,
                p.fec_insert,
                p.usr_update,
                p.fec_update,
                c.nom_categoria,
                l.nom_linea,
                s.nom_sublinea,
                m.nom_marca,
                pr.nom_proveedor
            FROM tab_productos p
            LEFT JOIN tab_categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN tab_lineas l ON p.id_linea = l.id_linea AND p.id_categoria = l.id_categoria
            LEFT JOIN tab_sublineas s ON p.id_sublinea = s.id_sublinea AND p.id_linea = s.id_linea AND p.id_categoria = s.id_categoria
            LEFT JOIN tab_marcas m ON p.id_marca = m.id_marca
            LEFT JOIN tab_proveedores pr ON p.id_proveedor = pr.id_proveedor
            WHERE 
                p.id_categoria = :id_categoria AND
                p.id_linea = :id_linea AND 
                p.id_sublinea = :id_sublinea AND
                p.id_producto = :id_producto
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
        row = result.mappings().first()
        if row is None:
            return None
        # Incluir rating y cantidad de reseñas desde tab_comentarios
        product_dict = dict(row)
        rating_row = db.execute(
            text("""
                SELECT 
                    ROUND(AVG(calificacion)::numeric, 1)::float AS rating,
                    COUNT(*)::int AS review_count
                FROM tab_comentarios
                WHERE id_categoria = :id_categoria
                  AND id_linea = :id_linea
                  AND id_sublinea = :id_sublinea
                  AND id_producto = :id_producto
                  AND ind_activo = TRUE
                  AND calificacion IS NOT NULL
            """),
            {
                "id_categoria": id_categoria,
                "id_linea": id_linea,
                "id_sublinea": id_sublinea,
                "id_producto": id_producto,
            },
        ).mappings().first()
        if rating_row and rating_row.get("review_count", 0) and rating_row["review_count"] > 0:
            # Asegurar tipos nativos para JSON (por si vienen Decimal desde la DB)
            product_dict["rating"] = float(rating_row["rating"]) if rating_row["rating"] is not None else None
            product_dict["review_count"] = int(rating_row["review_count"])
        else:
            product_dict["rating"] = None
            product_dict["review_count"] = 0
        return product_dict
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
        msg = fetched_result[0] if fetched_result else None
        if msg and str(msg).strip().lower().startswith("error:"):
            db.rollback()
            raise Exception(str(msg).strip())
        db.commit()
        return msg
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar el producto: {str(e)}")

def deactivate_activate_product(
    db: Session, 
    category_id: Decimal,
    line_id: Decimal,
    subline_id: Decimal,
    product_id: Decimal,
    usr_update: Decimal,
    activar: bool
    ):
    """
    Activa o desactiva un producto y todos sus elementos relacionados (cascada).
    
    Args:
        db: Sesión de base de datos
        category_id: ID de la categoría
        line_id: ID de la línea
        subline_id: ID de la sublínea
        product_id: ID del producto
        usr_update: Usuario que realiza la operación
        activar: True para activar, False para desactivar
    
    Returns:
        Mensaje de confirmación con detalles de elementos afectados
    """
    try:
        params = {
            'p_id_categoria': category_id,
            'p_id_linea': line_id,
            'p_id_sublinea': subline_id,
            'p_id_producto': product_id,
            'p_usr_update': usr_update,
            'p_activar': activar
        }
        query = text("""
        SELECT fun_deactivate_activate_producto(
            :p_id_categoria, 
            :p_id_linea, 
            :p_id_sublinea, 
            :p_id_producto,
            :p_usr_update,
            :p_activar
            )
        """)
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al cambiar estado del producto: {str(e)}")

def deactivate_product(
    db: Session, 
    category_id: Decimal,
    line_id: Decimal,
    subline_id: Decimal,
    product_id: Decimal,
    usr_update: Decimal
    ):
    """
    Desactiva un producto existente de la base de datos (wrapper para mantener compatibilidad).
    
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
    return deactivate_activate_product(db, category_id, line_id, subline_id, product_id, usr_update, False)


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
        
        # Preparar parámetros para la función de DB (enteros para línea/sublínea)
        _single_line = get_single_value(filters.id_linea)
        _single_subline = get_single_value(filters.id_sublinea)
        params = {
            # Parámetros únicos
            "p_id_categoria": get_single_value(filters.id_categoria),
            "p_id_linea": int(_single_line) if _single_line is not None else None,
            "p_id_sublinea": int(_single_subline) if _single_subline is not None else None,
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
        
        # Debug: Log de parámetros enviados a la función SQL
        print(f"🔍 Debug filter_products - Parámetros enviados a fun_filter_products:")
        print(f"  - p_id_linea: {params['p_id_linea']}")
        print(f"  - p_id_sublinea: {params['p_id_sublinea']}")
        print(f"  - p_id_lineas (array): {params['p_id_lineas']}")
        print(f"  - p_id_sublineas (array): {params['p_id_sublineas']}")
        print(f"  - filters.id_linea (raw): {filters.id_linea}")
        print(f"  - filters.id_sublinea (raw): {filters.id_sublinea}")
        
        # Validar que si se pasa id_sublinea, también debe validarse que pertenezca a id_linea si está presente
        if params['p_id_sublinea'] is not None and params['p_id_linea'] is not None:
            # Verificar que la sublínea pertenece a la línea
            validation_query = text("""
                SELECT COUNT(*) as count
                FROM tab_sublineas
                WHERE id_sublinea = :subline_id AND id_linea = :line_id
            """)
            validation_result = db.execute(validation_query, {
                'subline_id': params['p_id_sublinea'],
                'line_id': params['p_id_linea']
            })
            validation_count = validation_result.scalar()
            if validation_count == 0:
                print(f"⚠️  WARNING: La sublínea {params['p_id_sublinea']} no pertenece a la línea {params['p_id_linea']}")
        
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
        
        # Validación adicional: Asegurar que los productos devueltos cumplan los criterios de filtrado
        # (esto corrige posibles problemas en la función SQL que use OR en lugar de AND)
        original_count = len(products_data)
        
        if params['p_id_linea'] is not None and params['p_id_sublinea'] is not None:
            # Si se pasaron ambos, filtrar por ambos
            products_data = [
                row for row in products_data
                if row['id_linea'] == params['p_id_linea'] and row['id_sublinea'] == params['p_id_sublinea']
            ]
        elif params['p_id_linea'] is not None:
            # Si solo se pasó id_linea, filtrar por línea
            products_data = [
                row for row in products_data
                if row['id_linea'] == params['p_id_linea']
            ]
        elif params['p_id_sublinea'] is not None:
            # Si solo se pasó id_sublinea, filtrar por sublínea
            products_data = [
                row for row in products_data
                if row['id_sublinea'] == params['p_id_sublinea']
            ]
        
        filtered_count = len(products_data)
        if original_count != filtered_count:
            print(f"⚠️  WARNING: La función SQL devolvió {original_count} productos, pero solo {filtered_count} cumplen los filtros aplicados")
            if params['p_id_linea'] is not None and params['p_id_sublinea'] is not None:
                print(f"  - Filtros: línea={params['p_id_linea']}, sublínea={params['p_id_sublinea']}")
            elif params['p_id_linea'] is not None:
                print(f"  - Filtro: línea={params['p_id_linea']}")
            elif params['p_id_sublinea'] is not None:
                print(f"  - Filtro: sublínea={params['p_id_sublinea']}")
            print(f"  - Esto indica que la función SQL podría estar usando OR en lugar de AND para estos filtros")
        
        # Obtener ratings promedio para los productos filtrados
        product_ids = set()
        for row in products_data:
            product_key = (row['id_categoria'], row['id_linea'], row['id_sublinea'], row['id_producto'])
            product_ids.add(product_key)
        
        ratings_dict = {}
        if product_ids:
            # Construir la consulta con valores explícitos para evitar problemas con IN y tuplas
            # Usar VALUES para crear una tabla temporal con los IDs de productos
            values_list = []
            params_dict = {}
            for idx, (cat, line, subline, prod) in enumerate(product_ids):
                values_list.append(f"(:cat_{idx}, :line_{idx}, :subline_{idx}, :prod_{idx})")
                params_dict[f'cat_{idx}'] = cat
                params_dict[f'line_{idx}'] = line
                params_dict[f'subline_{idx}'] = subline
                params_dict[f'prod_{idx}'] = prod
            
            values_clause = ', '.join(values_list)
            ratings_query = text(f"""
                SELECT 
                    c.id_categoria,
                    c.id_linea,
                    c.id_sublinea,
                    c.id_producto,
                    CASE 
                        WHEN COUNT(c.calificacion) > 0 
                        THEN ROUND(AVG(c.calificacion)::numeric, 1)::float 
                        ELSE NULL 
                    END as rating
                FROM tab_comentarios c
                INNER JOIN (VALUES {values_clause}) AS p(id_categoria, id_linea, id_sublinea, id_producto)
                    ON c.id_categoria = p.id_categoria
                    AND c.id_linea = p.id_linea
                    AND c.id_sublinea = p.id_sublinea
                    AND c.id_producto = p.id_producto
                WHERE c.ind_activo = TRUE
                    AND c.calificacion IS NOT NULL
                GROUP BY c.id_categoria, c.id_linea, c.id_sublinea, c.id_producto
            """)
            
            ratings_result = db.execute(ratings_query, params_dict)
            ratings_dict = {
                (r['id_categoria'], r['id_linea'], r['id_sublinea'], r['id_producto']): r['rating']
                for r in ratings_result.mappings().all()
            }
        
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
            
            # Obtener rating para este producto
            product_key_tuple = (row['id_categoria'], row['id_linea'], row['id_sublinea'], row['id_producto'])
            product_rating = ratings_dict.get(product_key_tuple)
            
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
                total_registros=row['total_registros'],
                rating=product_rating
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