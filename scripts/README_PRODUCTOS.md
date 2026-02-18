# Generador de Productos para Admin

Este directorio contiene scripts para generar productos con variantes basados en los datos reales de tu base de datos.

## Archivos Generados

### 1. `productos_generados.json`
Archivo JSON estructurado con todos los productos, variantes y combinaciones. Formato técnico para procesamiento automático.

### 2. `PRODUCTOS_PARA_ADMIN.md`
Documento Markdown legible con todos los productos formateados para crear manualmente desde el panel de administración.

## Cómo Regenerar los Productos

Si necesitas regenerar los productos (por ejemplo, después de agregar nuevas categorías, marcas o proveedores):

```bash
# Desde la raíz del proyecto
cd revital_ecommerce/backend
python3 ../../scripts/generate_products.py

# Esto generará productos_generados.json

# Luego, para generar el formato Markdown legible:
python3 ../../scripts/format_products_for_admin.py
```

## Requisitos

- Python 3.12+
- `psycopg2-binary` (para conexión a PostgreSQL)
- `python-dotenv` (para cargar variables de entorno)
- Archivo `.env` en `revital_ecommerce/backend/` con `DATABASE_URL` configurada

## Estructura de los Productos Generados

Cada producto incluye:

- **Información básica:**
  - Nombre
  - Slug (generado automáticamente)
  - Categoría (ID y nombre)
  - Marca (ID y nombre, si aplica)
  - Proveedor (ID y nombre, si aplica)
  - Descripción

- **Grupos de variantes:**
  - Atributo dominante (ej: Color)
  - Valor dominante (ej: Verde, Blanco)
  - Color hex (si aplica)

- **Combinaciones dentro de cada grupo:**
  - SKU único
  - Precio (COP)
  - Stock
  - Atributos adicionales (ej: Talla, Almacenamiento)

## Notas

- Los productos se generan basándose en **categorías hoja** (nietas) de tu base de datos
- Se utilizan **atributos reales** asignados a cada categoría
- Los valores de atributos predefinidos (colores, tallas, etc.) se toman de tu base de datos
- Los nombres de productos se generan combinando templates con marcas existentes
- Los SKUs son únicos y aleatorios
- Los precios están entre $50,000 y $500,000 COP
- Los stocks están entre 10 y 100 unidades

## Personalización

Si quieres modificar el número de productos o el rango de variantes, edita `generate_products.py`:

```python
# Línea ~410: Cambiar número de productos
num_products=50  # Cambiar a tu número deseado

# Línea ~280: Cambiar rango de variantes
num_variants = random.randint(3, 5)  # Cambiar rango según necesites
```
