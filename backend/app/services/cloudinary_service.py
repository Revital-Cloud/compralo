"""
Servicio para la gestión de imágenes con Cloudinary.

Este módulo proporciona funciones para interactuar con la API de Cloudinary,
permitiendo subir, transformar y gestionar imágenes y otros archivos multimedia.
"""

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status, UploadFile
from core.config import settings

# Configuración de Cloudinary utilizando los valores de la configuración de la aplicación
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

async def upload_image(file: UploadFile) -> str:
    """
    Sube una imagen a Cloudinary y devuelve la URL segura.

    Args:
        file (UploadFile): El archivo de imagen a subir.

    Returns:
        str: La URL segura de la imagen subida.

    Raises:
        HTTPException: Si ocurre un error durante la subida.
    """
    try:
        # Sube el archivo a Cloudinary
        upload_result = cloudinary.uploader.upload(file.file, folder="ecommerce")
        
        # Devuelve la URL segura de la imagen
        return upload_result.get("secure_url")
    except Exception as e:
        # Lanza una excepción HTTP si algo sale mal
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir la imagen a Cloudinary: {e}"
        ) 