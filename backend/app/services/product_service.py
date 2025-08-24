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

from schemas.product_schema import ProductCreate, ProductUpdate
from services import cloudinary_service
# No necesitamos importar el schema Product aquí si solo devolvemos mappings
# y el router se encarga de la validación con el response_model.

#all products
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
        
        # Convertir spcf_producto a JSON string si es dict
        if 'spcf_producto' in params and isinstance(params['spcf_producto'], dict):
            params['spcf_producto'] = json.dumps(params['spcf_producto'])
        
        # ✅ Convertir img_producto a JSON string si es dict (ProductImages)
        if 'img_producto' in params and isinstance(params['img_producto'], dict):
            params['img_producto'] = json.dumps(params['img_producto'])
            print(f"🔄 DEBUG: img_producto convertido a JSON: {params['img_producto']}")

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
        
        # Convertir spcf_producto a JSON string si es dict
        if 'spcf_producto' in params and isinstance(params['spcf_producto'], dict):
            params['spcf_producto'] = json.dumps(params['spcf_producto'])
        
        # ✅ Convertir img_producto a JSON string si es dict (ProductImages)
        if 'img_producto' in params and isinstance(params['img_producto'], dict):
            params['img_producto'] = json.dumps(params['img_producto'])
            print(f"🔄 DEBUG UPDATE: img_producto convertido a JSON: {params['img_producto']}")
            
        params['id_categoria'] = id_categoria
        params['id_linea'] = id_linea
        params['id_sublinea'] = id_sublinea
        params['id_producto'] = id_producto # Añadir el id_producto del path
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

def get_products_by_subline(db: Session, id_sublinea: Decimal):
    """
    Obtiene todos los productos de una sublínea específica.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_sublinea (Decimal): ID de la sublínea.
        
    Returns:
        list: Lista de productos de la sublínea especificada.
    """
    try:
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
        WHERE id_sublinea = :id_sublinea AND ind_activo = true
        """)
        result = db.execute(query, {"id_sublinea": id_sublinea})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos por sublínea: {str(e)}")