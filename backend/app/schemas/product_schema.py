"""
Módulo de Esquemas de Producto.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los productos.
Incluye esquemas para la creación, actualización y visualización de productos,
así como un esquema para mensajes de respuesta genéricos.
"""
# Esquemas Pydantic (validación de datos, request/response)
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List # Usaremos Dict o Any para JSONB
from decimal import Decimal # Para campos DECIMAL si se requiere precisión
from datetime import datetime

class ProductImages(BaseModel):
    """
    Esquema para manejar múltiples imágenes de un producto.
    
    Permite organizar las imágenes por tipo y mantener un orden.
    """
    main: Optional[str] = Field(None, description="URL de la imagen principal del producto")
    gallery: List[str] = Field(default_factory=list, description="Lista de URLs de imágenes de la galería")
    thumbnails: List[str] = Field(default_factory=list, description="Lista de URLs de miniaturas")
    
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    """
    Esquema Base para Productos.

    Contiene los campos comunes para la creación y visualización de productos.
    Utilizado como base para otros esquemas de productos más específicos.

    Atributos:
        nom_producto (str): Nombre del producto.
        spcf_producto (Dict[str, Any]): Especificaciones del producto en formato JSON.
        img_producto (Optional[str]): URL o ruta de la imagen del producto (mantenido por compatibilidad).
        images (Optional[ProductImages]): Estructura para múltiples imágenes del producto.
        val_precio (Decimal): Precio de venta del producto.
        id_proveedor (Decimal): Identificador del proveedor.
        id_marca (Decimal): Identificador de la marca.
        id_sublinea (Decimal): Identificador de la sublínea.
        id_linea (Decimal): Identificador de la línea.
        id_categoria (Decimal): Identificador de la categoría.
        num_stock (int): Cantidad de unidades disponibles en inventario.
        usr_insert (Optional[Decimal]): Usuario que insertó el registro.
    """
    # id_producto: Optional[Decimal] = Field(None, description="Identificador único para el producto.") # Generalmente no se incluye en Create, se genera por la DB. Puede estar en el modelo de respuesta.
    nom_producto: str = Field(..., description="Nombre del producto.")
    spcf_producto: Dict[str, Any] = Field(..., description="Especificaciones del producto en formato JSON.")
    img_producto: Optional[Dict[str, Any]] = Field(None, description="URL o ruta de la imagen del producto (mantenido por compatibilidad).")
    images: Optional[ProductImages] = Field(None, description="Estructura para múltiples imágenes del producto.")
    val_precio: Decimal = Field(..., gt=0, description="Precio de venta del producto.") # Usamos float, gt=0 para la validación CHECK (val_precio >= 0)
    id_proveedor: Decimal # Asumiendo que los IDs decimales pueden ser representados como int en la API si no son muy grandes
    id_marca: Decimal
    id_sublinea: Decimal
    id_linea: Decimal
    id_categoria: Decimal
    num_stock: int = Field(0, ge=0, description="Cantidad de unidades disponibles en inventario.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha y hora de la inserción del registro.")
    ind_activo: Optional[bool] = Field(None, description="Indica si el producto está activo.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
    fec_update: Optional[datetime] = Field(None, description="Fecha y hora de la última actualización del registro.")
    
    class Config:
        from_attributes = True

class ProductCreate(ProductBase):
    """
    Esquema para la Creación de Productos.

    Hereda de `ProductBase` y se utiliza para validar los datos
    al crear un nuevo producto. Puede incluir campos adicionales o
    modificar el comportamiento de los campos heredados si es necesario
    para la operación de creación.
    """
    # Aquí puedes añadir campos específicos para la creación si son diferentes de ProductBase
    # o si algunos campos de ProductBase no deben ser proporcionados al crear.
    # Por ejemplo, usr_insert y fec_insert podrían ser gestionados por el backend.
    pass

class ProductUpdate(BaseModel):
    """
    Esquema para la Actualización de Productos.

    Define los campos que pueden ser actualizados para un producto existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.

    Atributos:
        nom_producto (Optional[str]): Nuevo nombre del producto.
        spcf_producto (Optional[Dict[str, Any]]): Nuevas especificaciones del producto.
        img_producto (Optional[str]): Nueva URL o ruta de la imagen del producto.
        val_precio (Optional[Decimal]): Nuevo precio de venta del producto.
        id_proveedor (Optional[Decimal]): Nuevo identificador del proveedor.
        id_marca (Optional[Decimal]): Nuevo identificador de la marca.
        id_sublinea (Optional[Decimal]): Nuevo identificador de la sublínea.
        id_linea (Optional[Decimal]): Nuevo identificador de la línea.
        id_categoria (Optional[Decimal]): Nuevo identificador de la categoría.
        id_producto (Optional[Decimal]): Nuevo identificador del producto.
        num_stock (Optional[int]): Nueva cantidad de unidades en inventario.
        ind_activo (Optional[bool]): Nuevo estado de activo del producto.
        usr_update (Optional[Decimal]): Usuario que actualizó el registro.
    """
    # Para las actualizaciones, a menudo todos los campos son opcionales
    id_producto: Optional[Decimal] = None # Aunque generalmente no se actualiza, puede ser útil para identificar el producto
    id_categoria: Optional[Decimal] = None
    id_linea: Optional[Decimal] = None
    id_sublinea: Optional[Decimal] = None
    nom_producto: Optional[str] = None
    spcf_producto: Optional[Dict[str, Any]] = None
    img_producto: Optional[Dict[str, Any]] = None
    val_precio: Optional[Decimal] = Field(None, gt=0)
    id_proveedor: Optional[Decimal] = None
    id_marca: Optional[Decimal] = None
    num_stock: Optional[int] = Field(None, ge=0)
    ind_activo: Optional[bool] = None # Para activar/desactivar el producto
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")

class Product(ProductBase): # Este será el modelo de respuesta principal
    """
    Esquema para la Visualización de Productos.

    Hereda de `ProductBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de productos.
    Incluye el `id_producto` y los campos de auditoría.

    Atributos:
        id_producto (Decimal): Identificador único del producto.
        usr_insert (str): Usuario que insertó el registro.
        fec_insert (datetime): Fecha y hora de inserción del registro.
        usr_update (Optional[str]): Usuario que realizó la última actualización.
        fec_update (Optional[datetime]): Fecha y hora de la última actualización.
    """
    id_producto: Decimal # El ID principal del producto, generalmente se incluye en la respuesta
    
    # Incluir campos de auditoría en la respuesta si se desea
    usr_insert: Decimal
    fec_insert: datetime
    usr_update: Optional[Decimal] = None
    fec_update: Optional[datetime] = None

# Esquemas para filtros de productos
class ProductFilterParams(BaseModel):
    """
    Esquema para parámetros de filtrado de productos.
    
    Utilizado para validar los parámetros de búsqueda y filtrado
    que se envían desde el frontend a la función de base de datos.
    
    Atributos:
        id_categoria (Optional[int]): ID de categoría para filtrar.
        id_linea (Optional[int]): ID de línea para filtrar.
        id_sublinea (Optional[int]): ID de sublínea para filtrar.
        id_marca (Optional[int]): ID de marca para filtrar.
        id_proveedor (Optional[int]): ID de proveedor para filtrar.
        nombre_producto (Optional[str]): Texto para buscar en nombre del producto.
        precio_min (Optional[Decimal]): Precio mínimo para filtrar.
        precio_max (Optional[Decimal]): Precio máximo para filtrar.
        stock_min (Optional[int]): Stock mínimo para filtrar.
        solo_con_stock (bool): TRUE para mostrar solo productos con stock > 0.
        ordenar_por (str): Campo para ordenar ('precio', 'nombre', 'stock', 'fecha').
        orden (str): Dirección del orden ('ASC' o 'DESC').
        limit (int): Límite de resultados (1-1000).
        offset (int): Offset para paginación (>=0).
    """
    id_categoria: Optional[int] = Field(None, description="ID de categoría para filtrar")
    id_linea: Optional[int] = Field(None, description="ID de línea para filtrar")
    id_sublinea: Optional[int] = Field(None, description="ID de sublínea para filtrar")
    id_marca: Optional[int] = Field(None, description="ID de marca para filtrar")
    id_proveedor: Optional[int] = Field(None, description="ID de proveedor para filtrar")
    nombre_producto: Optional[str] = Field(None, max_length=255, description="Texto para buscar en nombre del producto")
    precio_min: Optional[Decimal] = Field(None, ge=0, description="Precio mínimo para filtrar")
    precio_max: Optional[Decimal] = Field(None, ge=0, description="Precio máximo para filtrar")
    stock_min: Optional[int] = Field(None, ge=0, description="Stock mínimo para filtrar")
    solo_con_stock: bool = Field(False, description="TRUE para mostrar solo productos con stock > 0")
    ordenar_por: str = Field("nombre", pattern="^(precio|nombre|stock|fecha)$", description="Campo para ordenar")
    orden: str = Field("ASC", pattern="^(ASC|DESC)$", description="Dirección del orden")
    limit: int = Field(50, ge=1, le=1000, description="Límite de resultados")
    offset: int = Field(0, ge=0, description="Offset para paginación")
    
    class Config:
        from_attributes = True

class ProductFiltered(BaseModel):
    """
    Esquema para productos filtrados con información completa.
    
    Representa un producto con datos de las tablas relacionadas
    obtenido de la función de filtrado de la base de datos.
    
    Atributos:
        id_categoria (int): ID de la categoría.
        id_linea (int): ID de la línea.
        id_sublinea (int): ID de la sublínea.
        id_producto (int): ID del producto.
        nom_categoria (str): Nombre de la categoría.
        nom_linea (str): Nombre de la línea.
        nom_sublinea (str): Nombre de la sublínea.
        nom_producto (str): Nombre del producto.
        spcf_producto (Dict[str, Any]): Especificaciones del producto.
        img_producto (Optional[Dict[str, Any]]): Imágenes del producto.
        val_precio (Decimal): Precio del producto.
        num_stock (int): Stock disponible.
        nom_proveedor (str): Nombre del proveedor.
        nom_marca (str): Nombre de la marca.
        fec_insert (datetime): Fecha de inserción.
        total_registros (int): Total de registros encontrados.
    """
    id_categoria: int
    id_linea: int
    id_sublinea: int
    id_producto: int
    nom_categoria: str
    nom_linea: str
    nom_sublinea: str
    nom_producto: str
    spcf_producto: Dict[str, Any]
    img_producto: Optional[Dict[str, Any]] = None
    val_precio: Decimal
    num_stock: int
    nom_proveedor: str
    nom_marca: str
    fec_insert: datetime
    total_registros: int
    
    class Config:
        from_attributes = True

class ProductFilterResponse(BaseModel):
    """
    Esquema para respuesta de filtrado de productos.
    
    Contiene los productos filtrados junto con información de paginación.
    
    Atributos:
        products (List[ProductFiltered]): Lista de productos filtrados.
        total (int): Total de registros encontrados.
        page (int): Página actual.
        total_pages (int): Total de páginas.
        limit (int): Límite de resultados por página.
        offset (int): Offset actual.
    """
    products: List[ProductFiltered]
    total: int
    page: int
    total_pages: int
    limit: int
    offset: int
    
    class Config:
        from_attributes = True

class ProductFilterStats(BaseModel):
    """
    Esquema para estadísticas de filtros de productos.
    
    Contiene información agregada sobre los productos que coinciden
    con los criterios de filtrado.
    
    Atributos:
        total_productos (int): Total de productos encontrados.
        precio_minimo (Decimal): Precio mínimo encontrado.
        precio_maximo (Decimal): Precio máximo encontrado.
        precio_promedio (Decimal): Precio promedio.
        total_stock (int): Total de stock disponible.
        categorias_disponibles (int): Número de categorías disponibles.
        marcas_disponibles (int): Número de marcas disponibles.
    """
    total_productos: int
    precio_minimo: Optional[Decimal] = None
    precio_maximo: Optional[Decimal] = None
    precio_promedio: Optional[Decimal] = None
    total_stock: int
    categorias_disponibles: int
    marcas_disponibles: int
    
    class Config:
        from_attributes = True

# Esquema para mensajes de respuesta genéricos
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.

    Atributos:
        message (str): El mensaje a ser enviado en la respuesta.
    """
    message: str
