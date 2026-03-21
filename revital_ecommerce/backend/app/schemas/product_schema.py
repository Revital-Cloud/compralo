"""
Módulo de Esquemas de Producto.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los productos.
Incluye esquemas para la creación, actualización y visualización de productos,
así como un esquema para mensajes de respuesta genéricos.
"""
# Esquemas Pydantic (validación de datos, request/response)
from pydantic import BaseModel, Field
from fastapi import Query
from typing import Union, List
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
    Esquema base alineado con tab_products: id, category_id, name, slug, description, id_marca, is_active.
    Precio y stock en tab_product_variant_combinations; imágenes en tab_product_variant_images.
    """
    name: str = Field(..., description="tab_products.name.")
    category_id: Optional[Decimal] = Field(None, description="tab_products.category_id.")
    slug: Optional[str] = Field(None, description="tab_products.slug (generado si no se envía).")
    description: Optional[str] = Field(None, description="tab_products.description.")
    id_marca: Optional[Decimal] = Field(None, description="tab_products.id_marca.")
    is_active: Optional[bool] = Field(None, description="tab_products.is_active.")
    usr_insert: Optional[Decimal] = Field(None, description="Auditoría.")
    fec_insert: Optional[datetime] = Field(None, description="Auditoría.")
    usr_update: Optional[Decimal] = Field(None, description="Auditoría.")
    fec_update: Optional[datetime] = Field(None, description="Auditoría.")

    class Config:
        from_attributes = True

class ProductCreate(ProductBase):
    """
    Creación de producto. Hereda tab_products; opcionales para formulario legacy:
    id_categoria (para category_id), spcf_producto (description + atributos),
    val_precio/num_stock (primera variante), img_producto (URLs para tab_product_images).
    """
    id_categoria: Optional[Decimal] = Field(None, description="Categoría (tab_categories); usado como category_id si no se envía category_id).")
    spcf_producto: Optional[Dict[str, Any]] = Field(None, description="Legacy: dict con description y/o atributos para variante.")
    val_precio: Optional[Decimal] = Field(None, description="Legacy: precio primera variante.")
    num_stock: Optional[int] = Field(None, ge=0, description="Legacy: stock primera variante.")
    img_producto: Optional[Dict[str, Any]] = Field(None, description="Legacy: URLs de imágenes tras subida.")
    ind_activo: Optional[bool] = Field(None, description="Legacy: alias de is_active.")
    id_proveedor: Optional[Decimal] = Field(None, description="Legacy: no usado en tab_products.")

class ProductUpdate(BaseModel):
    """Campos actualizables de tab_products (fun_update_producto)."""
    id: Optional[Decimal] = None
    category_id: Optional[Decimal] = None
    name: Optional[str] = None
    description: Optional[str] = None
    id_marca: Optional[Decimal] = None
    is_active: Optional[bool] = None
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")

class Product(ProductBase):
    """
    Respuesta de producto: tab_products + campos calculados (precio, stock, imagen, rating).
    Sin spcf_producto ni img_producto; ver variant_options para colores/tallas desde atributos.
    """
    id: Decimal = Field(..., description="tab_products.id.")
    slug: Optional[str] = Field(None, description="tab_products.slug.")
    usr_insert: Optional[Decimal] = None
    fec_insert: Optional[datetime] = None
    usr_update: Optional[Decimal] = None
    fec_update: Optional[datetime] = None
    category_name: Optional[str] = Field(None, description="tab_categories.name.")
    nom_marca: Optional[str] = None
    nom_proveedor: Optional[str] = Field(None, description="tab_proveedores.nom_proveedor.")
    rating: Optional[float] = Field(None, ge=0, le=5, description="Desde tab_comentarios.")
    review_count: Optional[int] = Field(0, ge=0)
    # Calculados desde tab_product_variants y tab_product_images
    price_min: Optional[Decimal] = Field(None, description="Precio mínimo (variantes).")
    stock_total: Optional[int] = Field(None, description="Suma stock (variantes).")
    image_url: Optional[str] = Field(None, description="Imagen principal (tab_product_images).")
    images: Optional[List[Dict[str, Any]]] = Field(None, description="Lista de imágenes (tab_product_images).")
    variant_options: Optional[Dict[str, Any]] = Field(None, description="Colores/tallas desde tab_product_variant_attributes (para tienda).")
    # Detalle: variantes con precio/stock e imágenes por variante (GET /products/{slug_or_id})
    variants: Optional[List[Dict[str, Any]]] = Field(None, description="Variantes con id, sku, price, stock, is_active; en detalle también color, size, attributes.")
    images_by_variant: Optional[Dict[str, Any]] = Field(None, description="variant_id (str) -> lista de {image_url, is_main, sort_order}.")
    # Grupos por color e imágenes de producto para PDP (GET /products/{slug_or_id})
    variant_groups: Optional[List[Dict[str, Any]]] = Field(None, description="Grupos por color (dominant_value, images) para selector y galería PDP.")
    product_images: Optional[List[Dict[str, Any]]] = Field(None, description="Imágenes del producto (grupo Sin color) para galería PDP.")

# Esquemas para filtros de productos (tab_products: category_id, sin línea/sublínea)
class ProductAdminResponse(BaseModel):
    """Respuesta admin: tab_products + precio/stock/imagen desde variantes e imágenes."""
    category_id: str
    id: str = Field(..., description="tab_products.id.")
    category_name: str = Field(..., description="tab_categories.name.")
    name: str = Field(..., description="tab_products.name.")
    description: Optional[str] = Field(None, description="tab_products.description.")
    slug_producto: Optional[str] = None
    image_url: Optional[str] = Field(None, description="Imagen principal desde tab_product_images.")
    price_min: str = Field(..., description="Precio mínimo desde tab_product_variants.")
    price_max: Optional[str] = Field(None, description="Precio máximo desde tab_product_variants (rango en admin).")
    stock_total: int = Field(..., description="Suma stock desde tab_product_variants.")
    id_marca: str
    nom_marca: str
    id_proveedor: Optional[str] = Field(None, description="tab_products.id_proveedor.")
    nom_proveedor: Optional[str] = Field(None, description="tab_proveedores.nom_proveedor.")
    fec_insert: str
    is_active: bool = Field(..., description="tab_products.is_active.")
    ind_activo_categoria: bool = True
    ind_activo_marca: bool = True
    total_registros: int = 0
    # Estadísticas globales del conjunto filtrado (solo en el primer ítem de la lista)
    stock_stats_en_stock: Optional[int] = None
    stock_stats_bajo: Optional[int] = None
    stock_stats_sin_stock: Optional[int] = None

    class Config:
        from_attributes = True

class ProductAdminParams(BaseModel):
    """
    Parámetros para el endpoint de productos admin.
    """
    ordenar_por: Optional[str] = Field('nombre', description="Campo para ordenar")
    orden: Optional[str] = Field('ASC', description="Dirección del orden (ASC/DESC)")
    limit: Optional[int] = Field(50, ge=1, le=1000, description="Límite de resultados")
    offset: Optional[int] = Field(0, ge=0, description="Offset para paginación")

class ProductFilterParams(BaseModel):
    """
    Parámetros de filtrado (tab_products/tab_product_variants).
    category_id + include_subcategories; precio; atributos por attribute_id y valores.
    """
    category_id: Optional[int] = Field(None, description="ID de categoría (tab_categories); si se usa árbol, incluir subcategorías con include_subcategories")
    include_subcategories: bool = Field(True, description="Si True y hay category_id, incluye productos de subcategorías")
    id_marca: Optional[int] = Field(None, description="ID de marca para filtrar")
    nombre_producto: Optional[str] = Field(None, max_length=255, description="Texto para buscar en nombre del producto")
    precio_min: Optional[Decimal] = Field(None, ge=0, description="Precio mínimo (desde variantes)")
    precio_max: Optional[Decimal] = Field(None, ge=0, description="Precio máximo (desde variantes)")
    solo_con_stock: bool = Field(False, description="Solo productos con stock > 0")
    solo_en_oferta: bool = Field(
        False,
        description="Solo productos con descuento automático activo aplicable (misma regla que descuentos en vitrina)",
    )
    ordenar_por: str = Field("nombre", pattern="^(precio|nombre|stock|fecha)$", description="Campo para ordenar")
    orden: str = Field("ASC", pattern="^(ASC|DESC)$", description="Dirección del orden")
    limit: int = Field(50, ge=1, le=1000, description="Límite de resultados")
    offset: int = Field(0, ge=0, description="Offset para paginación")
    # Atributos dinámicos: dict attribute_id -> list of value_text (ej. {"1": ["Negro","Blanco"], "2": ["M","L"]})
    atributos: Optional[Dict[str, List[str]]] = Field(None, description="Filtro por atributos: { attribute_id: [valores] }")

    class Config:
        from_attributes = True

class ProductFiltered(BaseModel):
    """Producto filtrado: tab_products + price_min, stock_total, image_url desde variantes e imágenes."""
    category_id: int
    id: int = Field(..., description="tab_products.id.")
    slug: Optional[str] = None
    category_name: str = Field(..., description="tab_categories.name.")
    name: str = Field(..., description="tab_products.name.")
    description: Optional[str] = None
    image_url: Optional[str] = Field(None, description="Imagen principal desde tab_product_images.")
    price_min: Decimal = Field(..., description="Precio mínimo desde tab_product_variants.")
    price_max: Optional[Decimal] = Field(None, description="Precio máximo desde tab_product_variants (rango en listado).")
    stock_total: int = Field(..., description="Suma stock desde tab_product_variants.")
    total_registros: int = 0
    rating: Optional[float] = Field(None, ge=0, le=5)
    id_marca: Optional[int] = None
    nom_marca: Optional[str] = None
    fec_insert: Optional[datetime] = None

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

# Creación compuesta: producto base + variantes + URLs de imágenes (una transacción)
class ProductCreateBase(BaseModel):
    """Datos del producto (tab_products) sin precio/stock."""
    name: str = Field(..., min_length=2, description="Nombre del producto.")
    category_id: Decimal = Field(..., description="ID de categoría (tab_categories).")
    id_marca: Optional[Decimal] = Field(None, description="ID de marca.")
    id_proveedor: Optional[Decimal] = Field(None, description="ID de proveedor (tab_proveedores).")
    description: Optional[str] = Field(None, description="Descripción del producto.")
    is_active: bool = Field(True, description="Producto activo.")


class VariantCreateItem(BaseModel):
    """Una variante a crear (tab_product_variants): precio, stock, opcionalmente sku; atributos en tab_product_variant_attributes."""
    sku: Optional[str] = Field(None, description="SKU; si vacío el backend genera.")
    price: Decimal = Field(..., ge=0, description="Precio.")
    stock: int = Field(0, ge=0, description="Stock.")
    is_active: bool = Field(True, description="Variante activa.")
    tipo_clasificacion: Optional[str] = Field(None, max_length=100, description="Tipo o clasificación de la variante (ej. Estándar, Premium, Básico).")
    attributes: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Mapa attribute_id (str) -> valor (text, number o boolean).")
    image_urls: Optional[List[str]] = Field(default_factory=list, description="URLs de imágenes de la variante.")
    main_index: Optional[int] = Field(0, ge=0, description="Índice de la imagen principal en image_urls (0 = primera).")


class ProductCreateComposite(BaseModel):
    """Payload para crear producto + variantes + imágenes en una transacción."""
    product: ProductCreateBase
    variants: List[VariantCreateItem] = Field(..., min_length=1, description="Al menos una variante.")
    image_urls: Optional[List[str]] = Field(default_factory=list, description="URLs de imágenes del producto.")


# Esquema para toggle (activar/desactivar)
class ToggleRequest(BaseModel):
    """
    Esquema para solicitudes de activar/desactivar productos.
    
    Utilizado en endpoints toggle para activar o desactivar productos.
    
    Atributos:
        activar (bool): True para activar, False para desactivar.
    """
    activar: bool = Field(..., description="True para activar, False para desactivar.")

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
