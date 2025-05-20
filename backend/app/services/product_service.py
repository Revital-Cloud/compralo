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
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

from schemas.product_schema import ProductCreate, ProductUpdate
# No necesitamos importar el schema Product aquí si solo devolvemos mappings
# y el router se encarga de la validación con el response_model.

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

def create_product(db: Session, product: ProductCreate):
    """
    Crea un nuevo producto en la base de datos llamando a una función SQL.

    Utiliza la función de base de datos `fun_insert_producto` para insertar
    un nuevo producto. Los datos del producto se toman del esquema `ProductCreate`.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        product (ProductCreate): Un objeto Pydantic `ProductCreate` con los datos del producto.

    Returns:
        dict or None: Un diccionario que representa el producto creado (generalmente el JSON
                      devuelto por la función SQL) o None si la creación falla o la función
                      SQL no devuelve el resultado esperado.
    """
    # Asume que product.model_dump() tiene todas las claves que fun_insert_producto espera por nombre.
    params = product.model_dump()
    if 'spcf_producto' in params and isinstance(params['spcf_producto'], dict):
        params['spcf_producto'] = json.dumps(params['spcf_producto'])

    query = text("""SELECT fun_insert_producto(
        :id_categoria, :id_linea, :id_sublinea,:nom_producto, 
        :spcf_producto, :img_producto, :val_precio, :id_proveedor, :id_marca, 
        :num_stock
    )""")
    result = db.execute(query, params)
    db.commit()
    fetched_result = result.fetchone()
    return fetched_result[0] if fetched_result else None

def update_product(db: Session, id_producto: int, product: ProductUpdate):
    """
    Actualiza un producto existente en la base de datos llamando a una función SQL.

    Utiliza la función de base de datos `fun_update_producto` para actualizar
    un producto existente, identificado por `id_producto`. Los datos para la
    actualización se toman del esquema `ProductUpdate` (solo campos proporcionados).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_producto (int): El ID del producto a actualizar.
        product (ProductUpdate): Un objeto Pydantic `ProductUpdate` con los datos a actualizar.

    Returns:
        dict or None: Un diccionario que representa el producto actualizado (generalmente el JSON
                      devuelto por la función SQL) o None si la actualización falla o la función
                      SQL no devuelve el resultado esperado.
    """
    update_params = product.model_dump(exclude_unset=True) # Solo incluye campos que se proporcionaron
    
    if 'spcf_producto' in update_params and isinstance(update_params['spcf_producto'], dict):
        update_params['spcf_producto'] = json.dumps(update_params['spcf_producto'])
        
    update_params['id_producto'] = id_producto # Añadir el id_producto del path

    # La función SQL debe poder manejar que algunos de los otros parámetros no estén presentes
    # o sean NULL si product.model_dump(exclude_unset=True) los omite.
    # Asegúrate de que los nombres de los parámetros coincidan con los de tu función SQL.
    query = text("""SELECT fun_update_producto(
        :id_producto, :nom_producto, :spcf_producto, :img_producto, 
        :val_precio, :id_proveedor, :id_marca, :id_sublinea, :id_linea, 
        :id_categoria, :num_stock
    )""")
    
    # Es crucial que fun_update_producto esté diseñada para tomar estos 11 parámetros
    # y que pueda manejar `None` o la ausencia de algunos de ellos (excepto id_producto).
    result = db.execute(query, update_params)
    db.commit()
    fetched_result = result.fetchone()
    return fetched_result[0] if fetched_result else None

def delete_product(db: Session, product_id: int):
    """
    Elimina un producto de la base de datos llamando a una función SQL.

    Utiliza la función de base de datos `fun_delete_producto` para eliminar
    un producto, identificado por `product_id`.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        product_id (int): El ID del producto a eliminar.

    Returns:
        dict: Un diccionario con un mensaje indicando el resultado de la operación.
              El mensaje puede provenir directamente de la función SQL o ser un
              mensaje genérico si la función no proporciona uno específico.
    """
    query = text("""SELECT fun_delete_producto(:id_producto)""")
    result = db.execute(query, {"id_producto": product_id})
    db.commit()
    fetched_result = result.fetchone()
    
    if fetched_result and isinstance(fetched_result[0], str):
        return {"message": fetched_result[0]}
    if db.RollbackOccurred: # Esta es una pseudopropiedad, SQLAlchemy no tiene esto directamente.
        # Si hubo un rollback implícito o un error no capturado que impidió el commit o causó un rollback.
        # Esto es más complejo de detectar así directamente. Sería mejor si fun_delete_producto indicara error.
        # Por ahora, si no tenemos el string, pero no sabemos de un error explícito de la DB:
        return {"message": "Producto procesado para eliminación. El estado final no fue confirmado con un mensaje detallado."}
    else:
        # Si no hubo error aparente y el commit se realizó (o se intentó)
        return {"message": "Producto eliminado correctamente"} # Mensaje por defecto si la función SQL no da uno.