# Implementación de Cloudinary en Revital

## Descripción General

Cloudinary es un servicio de gestión de medios en la nube que permite almacenar, transformar y optimizar imágenes y videos. En este proyecto, se utiliza para la gestión de imágenes de productos.

## Características Implementadas

### ✅ Funcionalidades Principales

1. **Subida de Imágenes**
   - Validación automática de tipos de archivo
   - Límite de tamaño (10MB máximo)
   - Conversión automática a formato WebP
   - Optimización de calidad automática

2. **Transformaciones Automáticas**
   - Conversión a WebP para mejor rendimiento web
   - Redimensionamiento automático (máximo 1200x1200px)
   - Optimización de calidad con `auto:good`
   - Mantenimiento de proporciones originales

3. **Validaciones de Seguridad**
   - Tipos de archivo permitidos: JPEG, PNG, GIF, WebP, BMP
   - Validación de tamaño de archivo
   - Manejo de errores robusto

### 🔧 Configuración

#### Variables de Entorno Requeridas

```bash
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

#### Instalación de Dependencias

```bash
pip install cloudinary
```

### 📁 Estructura de Archivos

```
backend/app/services/
├── cloudinary_service.py      # Servicio principal de Cloudinary
└── product_service.py         # Integración con productos

backend/app/core/
└── config.py                  # Configuración de variables de entorno
```

## Uso del Servicio

### Subida Básica de Imagen

```python
from services.cloudinary_service import upload_image

# Subida simple con transformaciones por defecto
image_url = await upload_image(image_file)
```

### Subida con Opciones Personalizadas

```python
# Subida con opciones específicas
image_url = await upload_image(
    file=image_file,
    folder="productos",
    transform_to_webp=True,  # Convierte automáticamente a WebP
    quality="80",
    width=800,
    height=600
)
```

### Generación de URLs WebP en Tiempo de Entrega

```python
from services.cloudinary_service import get_webp_url, get_thumbnail_url

# Obtener URL WebP optimizada de una imagen existente
webp_url = get_webp_url(image_url, quality="auto:good")

# Obtener thumbnail WebP optimizado
thumbnail_url = get_thumbnail_url(image_url, width=300, height=300)
```

### Eliminación de Imagen

```python
from services.cloudinary_service import delete_image

# Eliminar imagen por public_id
success = await delete_image("ecommerce/producto_123")
```

### Obtener Información de Imagen

```python
from services.cloudinary_service import get_image_info

# Obtener metadatos de la imagen
image_info = await get_image_info("ecommerce/producto_123")
```

## Integración con Productos

### Creación de Producto con Imagen

```python
# En product_service.py
if image_file:
    image_url = await cloudinary_service.upload_image(
        image_file,
        transform_to_webp=True,
        quality="auto:good",
        width=1200,
        height=1200
    )
    product.img_producto = image_url
```

### Actualización de Producto con Nueva Imagen

```python
# En product_service.py
if image_file:
    image_url = await cloudinary_service.upload_image(
        image_file,
        transform_to_webp=True,
        quality="auto:good",
        width=1200,
        height=1200
    )
    product.img_producto = image_url
```

## Configuración de Transformaciones

### Opciones Disponibles

- **`transform_to_webp`**: Convierte automáticamente a WebP en el momento de la subida
- **`quality`**: Calidad de la imagen (`auto:good`, `80`, etc.)
- **`width`**: Ancho máximo de la imagen
- **`height`**: Alto máximo de la imagen
- **`folder`**: Carpeta de almacenamiento en Cloudinary

### Conversión Automática a WebP

La conversión a WebP se realiza **durante la subida** usando el parámetro `format: "webp"` de Cloudinary. Esto significa que:

1. **La imagen se almacena directamente en formato WebP** en Cloudinary
2. **No se mantiene el formato original** - se convierte permanentemente
3. **Mejor compresión** - archivos más pequeños
4. **Compatibilidad web moderna** - soporte nativo en navegadores modernos

### Transformaciones Automáticas

```python
# Ejemplo de transformaciones aplicadas
transformation_options = [
    {"format": "webp"},           # Conversión a WebP
    {"quality": "auto:good"},     # Optimización automática
    {"width": 1200, "height": 1200, "crop": "limit"}  # Redimensionamiento
]
```

## Manejo de Errores

### Tipos de Errores

1. **Error de Validación** (400)
   - Tipo de archivo no permitido
   - Archivo demasiado grande
   - Formato inválido

2. **Error de Subida** (500)
   - Problemas de conexión con Cloudinary
   - Errores de autenticación
   - Errores del servidor

### Ejemplo de Manejo

```python
try:
    image_url = await upload_image(image_file)
except HTTPException as e:
    # Manejar errores HTTP específicos
    logger.error(f"Error al subir imagen: {e.detail}")
    raise
except Exception as e:
    # Manejar errores generales
    logger.error(f"Error inesperado: {str(e)}")
    raise HTTPException(
        status_code=500,
        detail="Error interno del servidor"
    )
```

## Beneficios de la Implementación

### 🚀 Rendimiento
- **WebP**: Formato moderno con mejor compresión
- **Optimización automática**: Calidad adaptativa según el contenido
- **CDN global**: Distribución rápida de imágenes

### 💾 Almacenamiento
- **Carpeta organizada**: Imágenes en carpeta "ecommerce"
- **Metadatos preservados**: Información original mantenida
- **Escalabilidad**: Sin límites de almacenamiento local

### 🔒 Seguridad
- **Validación estricta**: Solo tipos de archivo seguros
- **Límites de tamaño**: Prevención de ataques DoS
- **URLs seguras**: HTTPS por defecto

## Próximas Mejoras

### 🎯 Funcionalidades Planificadas

1. **Variantes de Imagen**
   - Thumbnails automáticos
   - Diferentes resoluciones
   - Formatos múltiples

2. **Optimización Avanzada**
   - Compresión inteligente
   - Detección de contenido
   - Lazy loading

3. **Gestión de Medios**
   - Galerías de productos
   - Categorización automática
   - Backup y recuperación

## Troubleshooting

### Problemas Comunes

1. **Error de Autenticación**
   - Verificar variables de entorno
   - Comprobar permisos de API
   - Validar límites de cuenta

2. **Error de Subida**
   - Verificar tamaño de archivo
   - Comprobar tipo de archivo
   - Revisar conectividad de red

3. **Imagen No Visible**
   - Verificar URL de respuesta
   - Comprobar permisos de acceso
   - Validar transformaciones aplicadas

4. **Imagen No Se Convierte a WebP**
   - Verificar que `transform_to_webp=True` esté configurado
   - Comprobar que la imagen se subió correctamente
   - Verificar que la URL termine en `.webp`
   - Usar `get_webp_url()` para forzar conversión en tiempo de entrega

## Recursos Adicionales

- [Documentación Oficial de Cloudinary](https://cloudinary.com/documentation)
- [API de Python](https://cloudinary.com/documentation/python_integration)
- [Transformaciones de Imagen](https://cloudinary.com/documentation/image_transformations)
- [Optimización WebP](https://cloudinary.com/documentation/image_optimization)
