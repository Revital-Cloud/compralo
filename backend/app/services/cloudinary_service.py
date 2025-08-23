"""
Servicio para la gestión de imágenes con Cloudinary.

Este módulo proporciona funciones para interacturar con la API de Cloudinary,
permitiendo subir, transformar y gestionar imágenes y otros archivos multimedia.
"""

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status, UploadFile
from core.config import settings
import hashlib
from typing import Optional, List, Dict
from schemas.product_schema import ProductImages

# Configuración de Cloudinary utilizando los valores de la configuración de la aplicación
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

# Constantes de validación
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", 
    "image/gif", "image/webp", "image/bmp"
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_DIMENSIONS = 4000  # Máximo 4000px de ancho o alto

# Cache para almacenar hashes de imágenes ya subidas
_image_hash_cache: Dict[str, str] = {}

def calculate_file_hash(file: UploadFile) -> str:
    """
    Calcula el hash MD5 de un archivo.
    
    Args:
        file (UploadFile): El archivo a procesar.
        
    Returns:
        str: Hash MD5 del archivo en formato hexadecimal.
    """
    try:
        # Leer el contenido del archivo
        content = file.file.read()
        # Calcular hash MD5
        file_hash = hashlib.md5(content).hexdigest()
        # Resetear el puntero del archivo para que se pueda leer nuevamente
        file.file.seek(0)
        return file_hash
    except Exception as e:
        print(f"Error al calcular hash del archivo: {e}")
        return ""

def get_cached_image_url(file_hash: str) -> Optional[str]:
    """
    Obtiene la URL de una imagen desde el cache si ya fue subida.
    
    Args:
        file_hash (str): Hash MD5 del archivo.
        
    Returns:
        Optional[str]: URL de la imagen si existe en cache, None en caso contrario.
    """
    return _image_hash_cache.get(file_hash)

def cache_image_url(file_hash: str, url: str) -> None:
    """
    Almacena la URL de una imagen en el cache.
    
    Args:
        file_hash (str): Hash MD5 del archivo.
        url (str): URL de la imagen subida.
    """
    _image_hash_cache[file_hash] = url

def validate_image_file(file: UploadFile) -> None:
    """
    Valida el archivo de imagen antes de subirlo.
    
    Args:
        file (UploadFile): El archivo a validar.
        
    Raises:
        HTTPException: Si el archivo no cumple con las validaciones.
    """
    # Validar tipo de archivo
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido. Tipos permitidos: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Validar tamaño del archivo
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo es demasiado grande. Tamaño máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

async def upload_image(
    file: UploadFile, 
    folder: str = "ecommerce",
    transform_to_webp: bool = True,
    quality: str = "auto:good",
    width: Optional[int] = None,
    height: Optional[int] = None,
    check_duplicates: bool = True
) -> str:
    """
    Sube una imagen a Cloudinary y devuelve la URL segura.
    
    Args:
        file (UploadFile): El archivo de imagen a subir.
        folder (str): Carpeta donde se almacenará la imagen.
        transform_to_webp (bool): Si se debe convertir a WebP automáticamente.
        quality (str): Calidad de la imagen (ej: "auto:good", "80").
        width (Optional[int]): Ancho máximo de la imagen.
        height (Optional[int]): Alto máximo de la imagen.
        check_duplicates (bool): Si se debe verificar duplicados antes de subir.
        
    Returns:
        str: La URL segura de la imagen subida.
        
    Raises:
        HTTPException: Si ocurre un error durante la subida.
    """
    try:
        # Validar el archivo antes de subirlo
        validate_image_file(file)
        
        # ✅ VERIFICAR DUPLICADOS: Calcular hash y buscar en cache
        if check_duplicates:
            file_hash = calculate_file_hash(file)
            if file_hash:
                cached_url = get_cached_image_url(file_hash)
                if cached_url:
                    print(f"🔄 DUPLICADO DETECTADO: Usando imagen existente del cache")
                    return cached_url
        
        # Opciones de subida
        upload_options = {
            "folder": folder,
            "resource_type": "image"
        }
        
        # Para forzar la conversión a WebP, usamos el parámetro format directamente
        if transform_to_webp:
            upload_options["format"] = "webp"
        
        # Aplicar calidad si se especifica
        if quality:
            upload_options["quality"] = quality
            
        # Aplicar redimensionamiento si se especifica
        if width or height:
            if width:
                upload_options["width"] = width
            if height:
                upload_options["height"] = height
            upload_options["crop"] = "limit"  # Mantiene proporción
        
        # Subir el archivo a Cloudinary
        upload_result = cloudinary.uploader.upload(
            file.file, 
            **upload_options
        )
        
        # ✅ ALMACENAR EN CACHE: Guardar hash y URL para futuras verificaciones
        if check_duplicates and file_hash:
            image_url = upload_result.get("secure_url")
            cache_image_url(file_hash, image_url)
            print(f"💾 NUEVA IMAGEN: Hash {file_hash[:8]}... almacenado en cache")
        
        # Devuelve la URL segura de la imagen
        return upload_result.get("secure_url")
        
    except HTTPException:
        # Re-lanzar excepciones HTTP
        raise
    except Exception as e:
        # Lanza una excepción HTTP si algo sale mal
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir la imagen a Cloudinary: {str(e)}"
        )

def get_webp_url(original_url: str, quality: str = "auto:good") -> str:
    """
    Genera una URL de WebP optimizada a partir de una URL original de Cloudinary.
    
    Args:
        original_url (str): URL original de la imagen en Cloudinary.
        quality (str): Calidad de la imagen WebP.
        
    Returns:
        str: URL de la imagen en formato WebP con la calidad especificada.
    """
    try:
        # Extraer el public_id de la URL
        if "cloudinary.com" in original_url:
            # Construir URL con transformaciones
            base_url = original_url.split("/upload/")[0] + "/upload/"
            public_id = original_url.split("/upload/")[1].split(".")[0]
            
            # Aplicar transformaciones
            transformations = f"f_webp,q_{quality}"
            
            return f"{base_url}{transformations}/{public_id}.webp"
        else:
            return original_url
    except Exception:
        return original_url

def get_thumbnail_url(original_url: str, width: int = 300, height: int = 300, quality: str = "auto:good") -> str:
    """
    Genera una URL de thumbnail optimizado en WebP.
    
    Args:
        original_url (str): URL original de la imagen en Cloudinary.
        width (int): Ancho del thumbnail.
        height (int): Alto del thumbnail.
        quality (str): Calidad de la imagen.
        
    Returns:
        str: URL del thumbnail en formato WebP.
    """
    try:
        if "cloudinary.com" in original_url:
            base_url = original_url.split("/upload/")[0] + "/upload/"
            public_id = original_url.split("/upload/")[1].split(".")[0]
            
            # Transformaciones: formato WebP, redimensionamiento y calidad
            transformations = f"c_fill,f_webp,w_{width},h_{height},q_{quality}"
            
            return f"{base_url}{transformations}/{public_id}.webp"
        else:
            return original_url
    except Exception:
        return original_url

async def upload_multiple_images(
    files: List[UploadFile],
    folder: str = "ecommerce",
    transform_to_webp: bool = True,
    quality: str = "auto:good",
    width: Optional[int] = None,
    height: Optional[int] = None,
    generate_thumbnails: bool = True,
    check_duplicates: bool = True
) -> ProductImages:
    """
    Sube múltiples imágenes a Cloudinary y devuelve una estructura organizada.
    
    Args:
        files (List[UploadFile]): Lista de archivos de imagen a subir.
        folder (str): Carpeta donde se almacenarán las imágenes.
        transform_to_webp (bool): Si se debe convertir a WebP automáticamente.
        quality (str): Calidad de la imagen.
        width (Optional[int]): Ancho máximo de la imagen.
        height (Optional[int]): Alto máximo de la imagen.
        generate_thumbnails (bool): Si se deben generar miniaturas automáticamente.
        check_duplicates (bool): Si se debe verificar duplicados antes de subir.
        
    Returns:
        ProductImages: Estructura organizada con las URLs de las imágenes.
    """
    try:
        if not files:
            return ProductImages()
        
        # La primera imagen será la principal
        main_image = await upload_image(
            files[0], 
            folder, 
            transform_to_webp, 
            quality, 
            width, 
            height,
            check_duplicates
        )
        
        # Subir imágenes de la galería
        gallery_urls = []
        for file in files[1:]:
            gallery_url = await upload_image(
                file, 
                folder, 
                transform_to_webp, 
                quality, 
                width, 
                height,
                check_duplicates
            )
            gallery_urls.append(gallery_url)
        
        # Generar miniaturas si se solicita
        thumbnail_urls = []
        if generate_thumbnails:
            # Generar miniatura de la imagen principal
            main_thumbnail = get_thumbnail_url(main_image, 300, 300, quality)
            thumbnail_urls.append(main_thumbnail)
            
            # Generar miniaturas de la galería
            for gallery_url in gallery_urls:
                thumbnail = get_thumbnail_url(gallery_url, 300, 300, quality)
                thumbnail_urls.append(thumbnail)
        
        return ProductImages(
            main=main_image,
            gallery=gallery_urls,
            thumbnails=thumbnail_urls
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir múltiples imágenes: {str(e)}"
        )

async def delete_image(public_id: str) -> bool:
    """
    Elimina una imagen de Cloudinary.
    
    Args:
        public_id (str): ID público de la imagen a eliminar.
        
    Returns:
        bool: True si se eliminó correctamente, False en caso contrario.
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        print(f"Error al eliminar imagen de Cloudinary: {e}")
        return False

async def get_image_info(public_id: str) -> Optional[dict]:
    """
    Obtiene información de una imagen de Cloudinary.
    
    Args:
        public_id (str): ID público de la imagen.
        
    Returns:
        Optional[dict]: Información de la imagen o None si no se encuentra.
    """
    try:
        result = cloudinary.api.resource(public_id)
        return result
    except Exception as e:
        print(f"Error al obtener información de la imagen: {e}")
        return None

# ✅ FUNCIONES DE GESTIÓN DEL CACHE DE DUPLICADOS

def clear_image_cache() -> None:
    """
    Limpia el cache de imágenes duplicadas.
    """
    global _image_hash_cache
    _image_hash_cache.clear()
    print("🗑️ Cache de imágenes duplicadas limpiado")

def get_cache_stats() -> Dict[str, int]:
    """
    Obtiene estadísticas del cache de imágenes duplicadas.
    
    Returns:
        Dict[str, int]: Diccionario con estadísticas del cache.
    """
    return {
        "total_cached_images": len(_image_hash_cache),
        "cache_size_bytes": sum(len(hash_str) + len(url) for hash_str, url in _image_hash_cache.items())
    }

def is_image_cached(file: UploadFile) -> bool:
    """
    Verifica si una imagen ya está en el cache sin subirla.
    
    Args:
        file (UploadFile): El archivo a verificar.
        
    Returns:
        bool: True si la imagen está en cache, False en caso contrario.
    """
    try:
        file_hash = calculate_file_hash(file)
        return file_hash in _image_hash_cache
    except Exception:
        return False 