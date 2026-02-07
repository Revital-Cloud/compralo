# 🤖 Guía de Integración LLM para Transformación de Datos en Revital

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Proceso de Transformación Detallado](#proceso-de-transformación-detallado)
4. [Implementación Técnica](#implementación-técnica)
5. [Casos de Uso](#casos-de-uso)
6. [Ventajas y Beneficios](#ventajas-y-beneficios)
7. [Comparación: Con LLM vs Sin LLM](#comparación-con-llm-vs-sin-llm)
8. [Próximos Pasos](#próximos-pasos)

---

## 🎯 Visión General

### ¿Qué problema resuelve?

Revital necesita importar productos desde múltiples plataformas de e-commerce (Shopify, PrestaShop, TiendaNube, ERPs, etc.), pero cada una tiene:
- **Formatos diferentes** (JSON, XML, CSV)
- **Estructuras de datos distintas** (campos con nombres diferentes)
- **Calidad de datos variable** (descripciones pobres, categorización inconsistente)

### La Solución: LLM como Transformador Universal

En lugar de crear un parser específico para cada plataforma (50+ conectores diferentes), usamos un **LLM (Large Language Model)** que:

✅ Entiende cualquier formato de entrada  
✅ Normaliza y estandariza los datos  
✅ Mapea inteligentemente a la estructura de Revital  
✅ Enriquece descripciones pobres  
✅ Corrige errores comunes automáticamente  
✅ Clasifica productos en categorías correctas  

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FUENTES DE DATOS                             │
│   Shopify  │  PrestaShop  │  TiendaNube  │  ERPs  │  CSV/Excel     │
└────────┬────────────┬──────────┬──────────┬────────┬─────────────────┘
         │            │          │          │        │
         └────────────┴──────────┴──────────┴────────┘
                              │
                              ▼
         ┌─────────────────────────────────────────┐
         │   Endpoint de Importación (FastAPI)     │
         │   POST /api/integrations/import         │
         └──────────────────┬──────────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────────┐
         │     Servicio de Transformación LLM      │
         │  • Analiza formato de entrada           │
         │  • Obtiene contexto de Revital           │
         │  • Transforma con OpenAI/Claude         │
         │  • Valida con Pydantic                  │
         └──────────────────┬──────────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────────┐
         │      Validación y Auto-corrección       │
         │  • Verifica campos requeridos           │
         │  • Crea marcas faltantes                │
         │  • Mapea categorías existentes          │
         │  • Enriquece descripciones cortas       │
         └──────────────────┬──────────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────────┐
         │      Preview en Dashboard (Opcional)    │
         │  Admin revisa productos transformados   │
         │  [Aprobar] [Editar] [Rechazar]          │
         └──────────────────┬──────────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────────┐
         │     Importación en Lote (PostgreSQL)    │
         │  POST /api/products (batch)             │
         │  • Transacción atómica                  │
         │  • Upload imágenes a Cloudinary         │
         │  • Logging detallado                    │
         └──────────────────┬──────────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────────┐
         │         Reporte de Resultados           │
         │  ✅ Importados: 147                      │
         │  ⚠️  Con correcciones: 12                │
         │  ❌ Errores: 3                           │
         │  ⏭️  Omitidos: 8                         │
         └─────────────────────────────────────────┘
```

---

## 🔄 Proceso de Transformación Detallado

### **FASE 1: Recepción de Datos** 📥

El admin sube datos desde cualquier plataforma:

```json
POST /api/integrations/import

{
  "source_platform": "shopify",
  "data_format": "json",
  "raw_data": [
    {
      "id": 12345,
      "title": "nike dri-fit running shirt - mens",
      "price": "129.99",
      "vendor": "Nike Inc.",
      "product_type": "Apparel",
      "tags": "running, sports, men",
      "body_html": "<p>Great shirt</p>",
      "variants": [
        {
          "price": "129.99",
          "inventory_quantity": 45
        }
      ],
      "image": {
        "src": "https://cdn.shopify.com/12345.jpg"
      }
    }
  ]
}
```

**¿Qué sucede aquí?**
- Endpoint recibe datos en formato nativo de la plataforma
- Valida que sea JSON/XML/CSV válido
- Almacena temporalmente para procesamiento

---

### **FASE 2: Análisis Inteligente con LLM** 🧠

#### Construcción del Prompt

El servicio construye un prompt estructurado con:

1. **Contexto del sistema** (qué debe hacer el LLM)
2. **Esquema objetivo** (estructura de productos en Revital)
3. **Datos de entrada** (productos a transformar)
4. **Catálogos de referencia** (categorías, marcas, líneas existentes)

```python
prompt = f"""
Eres un experto en normalización de datos de e-commerce.

TAREA: Transforma los siguientes productos del formato {source_platform} 
al esquema de Revital.

ESQUEMA REVITAL ESPERADO:
{{
  "nom_producto": "string (requerido, max 255)",
  "des_producto": "string (requerido, max 1000)",
  "precio": "decimal (requerido, positivo)",
  "stock_actual": "integer (requerido, >= 0)",
  "id_marca": "integer (requerido)",
  "id_categoria": "integer (requerido)",
  "id_linea": "integer (requerido)",
  "id_sublinea": "integer (requerido)",
  "img_producto": "url string (opcional)"
}}

DATOS DE ENTRADA:
{json.dumps(raw_data, indent=2)}

CATEGORÍAS DISPONIBLES EN REVITAL:
[
  {{"id_categoria": 1, "nom_categoria": "Electrónica"}},
  {{"id_categoria": 2, "nom_categoria": "Deportes"}},
  {{"id_categoria": 3, "nom_categoria": "Ropa"}}
]

MARCAS DISPONIBLES EN REVITAL:
[
  {{"id_marca": 5, "nom_marca": "Nike"}},
  {{"id_marca": 8, "nom_marca": "Adidas"}},
  {{"id_marca": 12, "nom_marca": "Puma"}}
]

INSTRUCCIONES:
1. Mapea cada campo al esquema Revital
2. Normaliza nombres: capitaliza correctamente, elimina caracteres especiales
3. Enriquece descripciones cortas (mínimo 100 caracteres)
4. Clasifica productos en categorías/líneas/sublíneas correctas
5. Mapea marcas a IDs existentes en Revital
6. Si falta información crítica, usa valores por defecto inteligentes
7. Devuelve SOLO JSON válido, sin comentarios

RESPONDE SOLO CON EL JSON TRANSFORMADO.
"""
```

#### Llamada al LLM

```python
async def transform_with_llm(raw_data: list, source: str) -> dict:
    """
    Transforma datos usando LLM (OpenAI/Claude)
    """
    
    # 1. Obtener contexto de la base de datos
    categorias = await get_categorias_disponibles(db)
    marcas = await get_marcas_disponibles(db)
    lineas = await get_lineas_disponibles(db)
    sublineas = await get_sublineas_disponibles(db)
    
    # 2. Construir prompt con contexto
    prompt = build_transformation_prompt(
        raw_data=raw_data,
        source=source,
        categorias=categorias,
        marcas=marcas,
        lineas=lineas,
        sublineas=sublineas
    )
    
    # 3. Llamar al LLM (OpenAI GPT-4)
    response = await openai.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {
                "role": "system", 
                "content": "Eres un experto en transformación de datos de e-commerce. Siempre respondes con JSON válido."
            },
            {
                "role": "user", 
                "content": prompt
            }
        ],
        response_format={ "type": "json_object" },  # Forzar respuesta JSON
        temperature=0.1,  # Baja temperatura = más consistente y predecible
        max_tokens=4000
    )
    
    # 4. Parsear respuesta
    transformed_data = json.loads(response.choices[0].message.content)
    
    return transformed_data
```

---

### **FASE 3: Mapeo Inteligente** 🗺️

#### Ejemplo Real de Transformación

**ENTRADA (Shopify):**
```json
{
  "id": 12345,
  "title": "nike dri-fit running shirt - mens",
  "vendor": "Nike",
  "product_type": "Apparel",
  "body_html": "<p>Great shirt</p>",
  "variants": [
    {
      "price": "129.99",
      "inventory_quantity": 45
    }
  ],
  "tags": "running, sports, men",
  "image": {
    "src": "https://cdn.shopify.com/12345.jpg"
  }
}
```

**SALIDA (Transformada por LLM):**
```json
{
  "nom_producto": "Camiseta Nike Dri-FIT Running - Hombre",
  "des_producto": "Camiseta deportiva Nike Dri-FIT diseñada específicamente para running. Fabricada con tecnología de absorción de humedad que mantiene seco y cómodo durante el ejercicio. Ideal para entrenamientos intensos y carreras. Material transpirable de alta calidad que permite máxima movilidad.",
  "precio": 129.99,
  "stock_actual": 45,
  "id_marca": 5,
  "id_categoria": 2,
  "id_linea": 8,
  "id_sublinea": 23,
  "img_producto": "https://cdn.shopify.com/12345.jpg"
}
```

#### ¿Qué hizo el LLM?

1. ✅ **Normalizó el nombre**: `"nike dri-fit running shirt - mens"` → `"Camiseta Nike Dri-FIT Running - Hombre"`
   - Capitalizó correctamente
   - Tradujo "mens" a "Hombre"
   - Mantuvo marca "Nike" y tecnología "Dri-FIT"

2. ✅ **Enriqueció la descripción**: De `"<p>Great shirt</p>"` (descripción pobre) a una descripción completa de 150+ caracteres con:
   - Características del producto
   - Beneficios clave
   - Uso recomendado
   - Atributos de calidad

3. ✅ **Mapeó la marca**: `"Nike"` → buscó en las marcas disponibles en Revital y asignó `id_marca: 5`

4. ✅ **Clasificó automáticamente**: 
   - Analizó: "running", "sports", "apparel", "shirt"
   - Categoría: "Deportes" (id: 2)
   - Línea: "Ropa Deportiva" (id: 8)
   - Sublínea: "Camisetas Running" (id: 23)

5. ✅ **Extrajo precio y stock**: De la estructura anidada `variants[0]` de Shopify

6. ✅ **Preservó la imagen**: URL directa de Cloudinary/CDN de Shopify

---

### **FASE 4: Validación y Auto-corrección** ✅

Después de la transformación del LLM, se aplica validación con Pydantic:

```python
from pydantic import BaseModel, Field, validator

class ProductoTransformado(BaseModel):
    """Esquema de validación para productos transformados"""
    
    nom_producto: str = Field(..., min_length=5, max_length=255)
    des_producto: str = Field(..., min_length=50, max_length=1000)
    precio: float = Field(..., gt=0)
    stock_actual: int = Field(..., ge=0)
    id_marca: int = Field(..., gt=0)
    id_categoria: int = Field(..., gt=0)
    id_linea: int = Field(..., gt=0)
    id_sublinea: int = Field(..., gt=0)
    img_producto: Optional[str] = None
    
    @validator('nom_producto')
    def validate_nombre(cls, v):
        # Eliminar caracteres especiales peligrosos
        forbidden = ['<', '>', '{', '}', '|', '\\', '^', '~', '[', ']', '`']
        if any(char in v for char in forbidden):
            raise ValueError('Nombre contiene caracteres no permitidos')
        return v
    
    @validator('des_producto')
    def validate_descripcion(cls, v):
        # Eliminar HTML no deseado
        clean_text = re.sub(r'<[^>]+>', '', v)
        if len(clean_text) < 50:
            raise ValueError('Descripción muy corta (mínimo 50 caracteres)')
        return clean_text


async def validate_and_correct(transformed_data: dict) -> dict:
    """
    Valida datos transformados y corrige errores comunes
    """
    
    errors = []
    warnings = []
    corrected_products = []
    
    for product in transformed_data['products']:
        try:
            # Validación Pydantic
            validated_product = ProductoTransformado(**product)
            
            # Validaciones adicionales contra DB
            
            # 1. Verificar que marca existe
            if not await marca_exists(db, product['id_marca']):
                # Auto-corrección: Crear marca automáticamente
                vendor_name = product.get('vendor_name', 'Marca Genérica')
                nueva_marca = await create_brand(db, vendor_name)
                product['id_marca'] = nueva_marca.id
                warnings.append({
                    "product": product['nom_producto'],
                    "message": f"Marca '{vendor_name}' creada automáticamente"
                })
            
            # 2. Verificar que categoría existe
            if not await categoria_exists(db, product['id_categoria']):
                errors.append({
                    "product": product['nom_producto'],
                    "error": f"Categoría ID {product['id_categoria']} no existe",
                    "severity": "critical"
                })
                continue
            
            # 3. Verificar que línea pertenece a la categoría
            if not await linea_belongs_to_categoria(db, product['id_linea'], product['id_categoria']):
                errors.append({
                    "product": product['nom_producto'],
                    "error": "Línea no pertenece a la categoría especificada",
                    "severity": "critical"
                })
                continue
            
            # 4. Verificar que sublínea pertenece a la línea
            if not await sublinea_belongs_to_linea(db, product['id_sublinea'], product['id_linea']):
                errors.append({
                    "product": product['nom_producto'],
                    "error": "Sublínea no pertenece a la línea especificada",
                    "severity": "critical"
                })
                continue
            
            # 5. Validar URL de imagen
            if product.get('img_producto'):
                if not is_valid_url(product['img_producto']):
                    warnings.append({
                        "product": product['nom_producto'],
                        "message": "URL de imagen inválida, se omitirá"
                    })
                    product['img_producto'] = None
            
            corrected_products.append(product)
            
        except ValidationError as e:
            errors.append({
                "product": product.get('nom_producto', 'Producto sin nombre'),
                "error": str(e),
                "severity": "critical"
            })
        except Exception as e:
            errors.append({
                "product": product.get('nom_producto', 'Desconocido'),
                "error": f"Error inesperado: {str(e)}",
                "severity": "critical"
            })
    
    return {
        "validated_products": corrected_products,
        "errors": errors,
        "warnings": warnings,
        "total_input": len(transformed_data['products']),
        "total_valid": len(corrected_products),
        "total_errors": len(errors)
    }
```

---

### **FASE 5: Matching Inteligente con Embeddings** 🎯

Para categorización más precisa, se pueden usar **embeddings semánticos**:

```python
async def smart_category_matching(product_data: dict) -> dict:
    """
    Usa embeddings del LLM para encontrar la categoría más similar
    basándose en significado semántico, no solo palabras clave
    """
    
    # 1. Obtener todas las categorías con sus descripciones
    categorias = await get_all_categories_with_descriptions(db)
    
    # 2. Crear texto descriptivo del producto
    product_text = (
        f"{product_data['title']} "
        f"{product_data.get('description', '')} "
        f"{product_data.get('tags', '')} "
        f"{product_data.get('product_type', '')}"
    )
    
    # 3. Generar embedding del producto
    product_embedding = await openai.embeddings.create(
        model="text-embedding-3-small",
        input=product_text
    )
    
    # 4. Comparar con embeddings de categorías (pre-calculados)
    similarities = []
    for cat in categorias:
        similarity = cosine_similarity(
            product_embedding.data[0].embedding,
            cat['embedding']
        )
        similarities.append({
            "categoria": cat,
            "score": similarity
        })
    
    # 5. Retornar la más similar si tiene confianza alta
    best_match = max(similarities, key=lambda x: x['score'])
    
    if best_match['score'] > 0.80:  # 80% de similitud
        return {
            "matched": True,
            "categoria": best_match['categoria'],
            "confidence": best_match['score']
        }
    else:
        # Si no hay match claro, sugerir al admin
        return {
            "matched": False,
            "suggestions": sorted(similarities, key=lambda x: x['score'], reverse=True)[:3],
            "message": "No se encontró una categoría con alta confianza"
        }
```

---

### **FASE 6: Importación en Lote** 📦

Finalmente, se insertan los productos validados en la base de datos:

```python
async def bulk_import_products(
    db: Session, 
    validated_data: dict, 
    user_id: int,
    auto_approve: bool = False
) -> dict:
    """
    Importa productos en lote con transacción atómica
    """
    
    results = {
        "imported": 0,
        "updated": 0,
        "errors": [],
        "skipped": 0,
        "created_brands": [],
        "created_categories": [],
        "total_processing_time": 0
    }
    
    start_time = time.time()
    
    try:
        async with db.begin():  # Transacción atómica
            for product in validated_data['products']:
                try:
                    # 1. Verificar si producto ya existe (por nombre o SKU)
                    existing = await get_product_by_name_or_sku(
                        db, 
                        product['nom_producto'],
                        product.get('sku')
                    )
                    
                    if existing:
                        if auto_approve or ask_user_overwrite(existing, product):
                            # Actualizar producto existente
                            updated = await update_product(
                                db=db,
                                product_id=existing.id_producto,
                                product_data=product,
                                user_id=user_id
                            )
                            results['updated'] += 1
                        else:
                            results['skipped'] += 1
                            continue
                    else:
                        # 2. Crear nuevo producto
                        new_product = await create_product(
                            db=db,
                            product_data=product,
                            user_id=user_id
                        )
                        
                        # 3. Subir imagen a Cloudinary (si existe)
                        if product.get('img_producto'):
                            try:
                                img_url = await upload_image_from_url(
                                    product['img_producto'],
                                    folder=f"products/{new_product.id_producto}"
                                )
                                await update_product_image(
                                    db=db,
                                    product_id=new_product.id_producto,
                                    image_url=img_url
                                )
                            except Exception as img_error:
                                # No fallar la importación por imagen
                                results['warnings'].append({
                                    "product": product['nom_producto'],
                                    "warning": f"Error subiendo imagen: {str(img_error)}"
                                })
                        
                        results['imported'] += 1
                        
                except IntegrityError as e:
                    # Error de integridad (duplicado, etc.)
                    results['errors'].append({
                        "product": product['nom_producto'],
                        "error": "Producto duplicado o error de integridad",
                        "details": str(e)
                    })
                    db.rollback()  # Rollback solo este producto
                    continue
                    
                except Exception as e:
                    results['errors'].append({
                        "product": product['nom_producto'],
                        "error": str(e)
                    })
                    db.rollback()
                    continue
            
            # Commit de todos los cambios exitosos
            await db.commit()
            
    except Exception as e:
        # Error catastrófico: rollback de todo
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error crítico en importación: {str(e)}"
        )
    
    results['total_processing_time'] = time.time() - start_time
    
    return results
```

---

## 💻 Implementación Técnica

### Estructura de Archivos

```
backend/app/
├── services/
│   ├── llm_transform_service.py      # Servicio principal de transformación LLM
│   ├── openai_service.py             # Cliente OpenAI/Claude
│   ├── embedding_service.py          # Generación de embeddings
│   └── import_service.py             # Orquestación de importaciones
│
├── routers/
│   └── integration_router.py         # Endpoints de integración
│
├── schemas/
│   ├── integration_schemas.py        # Schemas de importación
│   └── product_transform_schema.py   # Schemas de transformación
│
└── core/
    └── config.py                      # Variables LLM (API keys, modelos)
```

### Endpoints Principales

```python
# backend/app/routers/integration_router.py

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from services.llm_transform_service import LLMTransformService
from services.import_service import ImportService

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])


@router.post("/import")
async def import_products(
    source_platform: str,
    file: UploadFile = File(...),
    auto_approve: bool = False,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Importa productos desde cualquier plataforma usando transformación LLM
    
    Args:
        source_platform: Plataforma de origen (shopify, prestashop, woocommerce, etc.)
        file: Archivo CSV, JSON o XML con productos
        auto_approve: Si True, importa sin preview
        
    Returns:
        Reporte de importación con estadísticas
    """
    
    # 1. Leer archivo
    raw_data = await read_upload_file(file)
    
    # 2. Transformar con LLM
    llm_service = LLMTransformService(db)
    transformed = await llm_service.transform(
        raw_data=raw_data,
        source=source_platform
    )
    
    # 3. Validar
    validated = await llm_service.validate_and_correct(transformed)
    
    # 4. Importar (si auto_approve=True)
    if auto_approve:
        import_service = ImportService(db)
        results = await import_service.bulk_import(
            validated_data=validated,
            user_id=current_user.id_usuario
        )
        return results
    else:
        # Guardar en sesión temporal para preview
        preview_id = await save_preview(validated, current_user.id_usuario)
        return {
            "preview_id": preview_id,
            "total_products": len(validated['products']),
            "preview_url": f"/dashboard/integrations/preview/{preview_id}"
        }


@router.post("/preview/{preview_id}/approve")
async def approve_preview(
    preview_id: str,
    selected_products: Optional[List[int]] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Aprueba e importa productos del preview
    """
    
    # 1. Recuperar datos del preview
    preview_data = await get_preview_data(preview_id, current_user.id_usuario)
    
    # 2. Filtrar productos seleccionados (si aplica)
    if selected_products:
        preview_data['products'] = [
            p for i, p in enumerate(preview_data['products']) 
            if i in selected_products
        ]
    
    # 3. Importar
    import_service = ImportService(db)
    results = await import_service.bulk_import(
        validated_data=preview_data,
        user_id=current_user.id_usuario
    )
    
    # 4. Limpiar preview
    await delete_preview(preview_id)
    
    return results


@router.get("/platforms")
async def get_supported_platforms():
    """
    Lista plataformas soportadas para importación
    """
    return {
        "platforms": [
            {
                "id": "shopify",
                "name": "Shopify",
                "formats": ["json", "csv"],
                "description": "Importa productos desde tiendas Shopify"
            },
            {
                "id": "prestashop",
                "name": "PrestaShop",
                "formats": ["xml", "csv"],
                "description": "Importa productos desde PrestaShop"
            },
            {
                "id": "woocommerce",
                "name": "WooCommerce",
                "formats": ["json", "csv"],
                "description": "Importa productos desde WooCommerce"
            },
            {
                "id": "tiendanube",
                "name": "TiendaNube",
                "formats": ["json"],
                "description": "Importa productos desde TiendaNube"
            },
            {
                "id": "generic_erp",
                "name": "ERP Genérico",
                "formats": ["csv", "json", "xml"],
                "description": "Importa desde cualquier ERP con formato personalizado"
            }
        ]
    }
```

### Servicio de Transformación LLM

```python
# backend/app/services/llm_transform_service.py

import json
from typing import Dict, List, Any
from sqlalchemy.orm import Session
import openai
from core.config import settings

class LLMTransformService:
    def __init__(self, db: Session):
        self.db = db
        openai.api_key = settings.OPENAI_API_KEY
        
    async def transform(
        self, 
        raw_data: List[Dict], 
        source: str
    ) -> Dict[str, Any]:
        """
        Transforma datos usando LLM
        """
        
        # 1. Obtener contexto de Revital
        context = await self._get_revital_context()
        
        # 2. Construir prompt
        prompt = self._build_prompt(raw_data, source, context)
        
        # 3. Llamar a OpenAI
        response = await openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "Eres un experto en transformación de datos de e-commerce. Siempre respondes con JSON válido."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=4000
        )
        
        # 4. Parsear y retornar
        transformed = json.loads(response.choices[0].message.content)
        
        return {
            "products": transformed.get("products", []),
            "metadata": {
                "source": source,
                "total_input": len(raw_data),
                "total_output": len(transformed.get("products", [])),
                "model_used": "gpt-4-turbo-preview",
                "tokens_used": response.usage.total_tokens
            }
        }
    
    async def _get_revital_context(self) -> Dict:
        """
        Obtiene categorías, marcas, líneas y sublíneas de Revital
        """
        return {
            "categorias": await self._get_categorias(),
            "marcas": await self._get_marcas(),
            "lineas": await self._get_lineas(),
            "sublineas": await self._get_sublineas()
        }
    
    def _build_prompt(
        self, 
        raw_data: List[Dict], 
        source: str, 
        context: Dict
    ) -> str:
        """
        Construye el prompt para el LLM
        """
        
        return f"""
Transforma los siguientes productos de {source} al esquema de Revital.

ESQUEMA REVITAL:
{{
  "nom_producto": "string (requerido, max 255)",
  "des_producto": "string (requerido, min 50, max 1000)",
  "precio": "decimal (requerido, > 0)",
  "stock_actual": "integer (requerido, >= 0)",
  "id_marca": "integer (requerido)",
  "id_categoria": "integer (requerido)",
  "id_linea": "integer (requerido)",
  "id_sublinea": "integer (requerido)",
  "img_producto": "string (opcional, URL)"
}}

DATOS A TRANSFORMAR:
{json.dumps(raw_data[:10], indent=2)}

CONTEXTO REVITAL:
Categorías disponibles: {json.dumps(context['categorias'])}
Marcas disponibles: {json.dumps(context['marcas'])}
Líneas disponibles: {json.dumps(context['lineas'])}
Sublíneas disponibles: {json.dumps(context['sublineas'])}

INSTRUCCIONES:
1. Normaliza nombres (capitalización correcta)
2. Enriquece descripciones cortas (mínimo 50 caracteres)
3. Mapea marcas a IDs existentes
4. Clasifica en categorías/líneas/sublíneas correctas
5. Extrae precios y stock correctamente
6. Retorna solo JSON válido

Formato de respuesta:
{{
  "products": [
    {{ ... }},
    {{ ... }}
  ]
}}
"""
```

---

## 🎯 Casos de Uso

### **Caso 1: Migración Completa desde Shopify**

**Escenario:**
> "Tengo 5,000 productos en Shopify y quiero migrar completamente a Revital"

**Solución:**

1. **Exportar desde Shopify**:
   ```bash
   # En Shopify Admin
   Products → Export → Export as CSV
   ```

2. **Importar a Revital**:
   ```bash
   POST /api/integrations/import
   
   Form Data:
   - source_platform: "shopify"
   - file: shopify_products.csv
   - auto_approve: false (para revisar antes)
   ```

3. **LLM procesa y transforma** (2-3 minutos para 5,000 productos)

4. **Admin revisa preview** en dashboard

5. **Aprueba importación**:
   ```bash
   POST /api/integrations/preview/{preview_id}/approve
   ```

**Resultado:**
- ✅ 4,850 productos importados correctamente
- ⚠️ 120 productos con correcciones menores (descripciones enriquecidas)
- ❌ 30 productos con errores (imágenes rotas, categorías ambiguas)
- ⏭️ 0 omitidos

**Tiempo total:** ~15 minutos  
**Costo LLM:** ~$15 USD (usando GPT-4 Turbo)

---

### **Caso 2: Sincronización Nocturna con ERP**

**Escenario:**
> "Mi ERP actualiza precios y stock cada noche. Necesito sincronización automática."

**Solución:**

1. **Cron job** ejecuta a las 2 AM:
   ```python
   # scripts/sync_erp_nightly.py
   
   async def sync_erp_to_revital():
       # 1. Obtener productos del ERP
       erp_products = await erp_client.get_products()
       
       # 2. Transformar con LLM
       response = await revital_api.post(
           "/api/integrations/import",
           json={
               "source_platform": "generic_erp",
               "raw_data": erp_products,
               "auto_approve": True,  # Sin intervención humana
               "update_only": True    # Solo actualizar existentes
           }
       )
       
       # 3. Log de resultados
       logger.info(f"Sincronización completada: {response['imported']} actualizados")
   ```

2. **LLM transforma** XML propietario del ERP a formato Revital

3. **Actualiza** solo precios y stock (no recrea productos)

**Resultado:**
- Sincronización automática sin intervención humana
- Logs detallados enviados por email al admin
- Alertas si hay errores críticos

---

### **Caso 3: Múltiples Proveedores con Formatos Diferentes**

**Escenario:**
> "Tengo 10 proveedores, cada uno envía CSV con formato diferente"

**Solución:**

1. **Proveedor A** envía CSV con columnas: `Código|Nombre|Precio|Stock|Marca`

2. **Proveedor B** envía Excel con: `SKU,Descripción,Precio Venta,Disponible,Fabricante`

3. **Proveedor C** envía JSON desde su API

**Implementación:**

```python
# El mismo endpoint maneja todos los formatos

# Proveedor A (CSV)
POST /api/integrations/import
- source: "proveedor_a_csv"
- file: productos_a.csv

# Proveedor B (Excel)
POST /api/integrations/import
- source: "proveedor_b_excel"
- file: productos_b.xlsx

# Proveedor C (JSON)
POST /api/integrations/import
- source: "proveedor_c_api"
- raw_data: {...}  # Directamente desde API
```

**Resultado:**
- El LLM detecta y adapta cada formato automáticamente
- No necesitas crear 10 parsers diferentes
- Admin revisa todos juntos en el dashboard
- Importación selectiva por proveedor

---

## ✨ Ventajas y Beneficios

### **1. Flexibilidad Total** 🔄

**SIN LLM:**
```python
# Necesitas código específico para cada plataforma
def parse_shopify(data):
    return {
        "nom_producto": data['title'],
        "precio": data['variants'][0]['price']
        # ...
    }

def parse_prestashop(data):
    return {
        "nom_producto": data['name']['language'][0]['value'],
        "precio": data['price']
        # ...
    }

def parse_woocommerce(data):
    return {
        "nom_producto": data['name'],
        "precio": data['regular_price']
        # ...
    }

# ... 50 funciones más para cada plataforma 😫
```

**CON LLM:**
```python
# Un solo servicio universal
def transform_any_platform(data, source):
    return llm.transform(data, source)
    
# Funciona para CUALQUIER plataforma 🎉
```

---

### **2. Inteligencia Contextual** 🧠

El LLM **entiende contexto**, no solo mapea campos:

```python
# Ejemplo 1: Entiende abreviaciones
Entrada: "Nike Air Max 90 - Sz 42 - Men's"
Salida: {
    "nom_producto": "Nike Air Max 90 - Talla 42 - Hombre",
    "genero": "Masculino",
    "talla": "42"
}

# Ejemplo 2: Clasifica inteligentemente
Entrada: "Protein Whey Gold Standard 2lb"
Salida: {
    "id_categoria": 5,  # "Suplementos"
    "id_linea": 18,     # "Proteínas"
    "id_sublinea": 67   # "Whey Protein"
}

# Ejemplo 3: Corrige errores comunes
Entrada: "CAMISETA NIKE - talla m"  # Mal capitalizado
Salida: "Camiseta Nike - Talla M"   # Corregido

# Ejemplo 4: Maneja multi-idioma
Entrada: "T-shirt Nike" (inglés)
Salida: "Camiseta Nike" (español)
```

---

### **3. Enriquecimiento Automático** 📝

```python
# ANTES (descripción pobre del proveedor):
"Producto deportivo"

# DESPUÉS (enriquecida por LLM):
"Camiseta deportiva Nike Dri-FIT diseñada para alto rendimiento. 
Fabricada con tecnología de absorción de humedad que mantiene 
seco durante el ejercicio intenso. Material transpirable de 
alta calidad. Ideal para running, gym y deportes de alto impacto. 
Diseño ergonómico que permite máxima movilidad."

# El LLM generó una descripción de marketing completa
# basándose solo en el nombre "Nike Dri-FIT Running Shirt"
```

---

### **4. Auto-corrección de Errores** 🔧

```python
# Entrada con múltiples errores:
{
    "title": "CAMISETA NIKE - talla m",      # Mal capitalizado
    "price": "$129,99 USD",                  # Formato incorrecto
    "stock": "45 units available",           # Texto en lugar de número
    "category": "ropa deportiva para hombre" # Texto libre, no ID
}

# LLM corrige automáticamente:
{
    "nom_producto": "Camiseta Nike - Talla M",
    "precio": 129.99,                        # Float correcto
    "stock_actual": 45,                      # Integer extraído
    "id_categoria": 2,                       # Mapeó correctamente
    "id_linea": 8,
    "id_sublinea": 23
}
```

---

### **5. Matching Semántico** 🎯

```python
# El LLM entiende SIGNIFICADO, no solo palabras clave

Producto: "Auriculares inalámbricos Bluetooth con cancelación de ruido"

# Categorización tradicional (palabras clave):
if "auriculares" in titulo:
    categoria = "Audio"  # Muy genérico

# Categorización con LLM (semántica):
{
    "id_categoria": 1,   # "Electrónica"
    "id_linea": 4,       # "Audio y Video"
    "id_sublinea": 12    # "Auriculares Bluetooth"
}

# ¡El LLM entendió que es electrónica de audio específicamente
# para tecnología Bluetooth, no auriculares con cable!
```

---

## 📊 Comparación: Con LLM vs Sin LLM

| Aspecto | **Sin LLM (Tradicional)** | **Con LLM (Inteligente)** |
|---------|---------------------------|---------------------------|
| **Nuevas plataformas** | 2-5 días de desarrollo por plataforma | 0 días (funciona automáticamente) |
| **Mantenimiento** | Alto (cada cambio requiere código) | Bajo (LLM se adapta automáticamente) |
| **Formatos soportados** | Solo los programados | Cualquier formato (JSON, XML, CSV, etc.) |
| **Calidad de datos** | Depende 100% de la fuente | LLM mejora y enriquece |
| **Errores de formato** | Fallan las importaciones | LLM corrige automáticamente |
| **Descripciones pobres** | Se mantienen pobres | LLM enriquece automáticamente |
| **Categorización** | Manual o por palabras clave | Semántica e inteligente |
| **Multi-idioma** | Requiere traducción manual | LLM traduce automáticamente |
| **Costo inicial** | $5,000-$10,000 (desarrollo) | $1,000-$2,000 (integración LLM) |
| **Costo operativo** | $0 | ~$0.01-$0.05 por producto |
| **Escalabilidad** | Limitada (más código) | Ilimitada (mismo código) |
| **Flexibilidad** | Baja (código rígido) | Alta (LLM adaptable) |

---

## 🚀 Próximos Pasos

### **Para Implementar Esta Funcionalidad:**

1. **Decisiones Técnicas**:
   - ¿Qué LLM usar? (OpenAI GPT-4, Claude 3.5, o ambos)
   - ¿Integrado en FastAPI o microservicio separado?
   - ¿Preview obligatorio o importación automática?

2. **Configuración Requerida**:
   ```bash
   # .env
   OPENAI_API_KEY=sk-...
   LLM_MODEL=gpt-4-turbo-preview
   LLM_MAX_TOKENS=4000
   LLM_TEMPERATURE=0.1
   ```

3. **Instalación de Dependencias**:
   ```bash
   pip install openai
   pip install anthropic  # Si usas Claude
   pip install pandas     # Para manejo de CSV/Excel
   pip install openpyxl   # Para leer Excel
   ```

4. **Estructura de Archivos a Crear**:
   ```
   backend/app/
   ├── services/
   │   ├── llm_transform_service.py      # Nuevo
   │   ├── openai_service.py             # Nuevo
   │   └── import_service.py             # Nuevo
   │
   ├── routers/
   │   └── integration_router.py         # Nuevo
   │
   └── schemas/
       └── integration_schemas.py        # Nuevo
   ```

5. **Dashboard Frontend** (componentes a crear):
   ```
   frontend/components/admin/
   ├── IntegrationImport.tsx        # Upload de archivos
   ├── IntegrationPreview.tsx       # Preview de productos
   ├── ProductTransformCard.tsx     # Tarjeta de producto transformado
   └── ImportResults.tsx            # Resultados de importación
   ```

---

### **Preguntas para Finalizar el Plan:**

1. **¿Qué LLM prefieres?**
   - a) OpenAI GPT-4 Turbo (más preciso, ~$0.01/1K tokens)
   - b) Claude 3.5 Sonnet (excelente structured outputs, ~$0.003/1K tokens)
   - c) Ambos (seleccionable por el admin)

2. **¿Dónde alojar el servicio?**
   - a) Integrado en FastAPI actual (más fácil)
   - b) Microservicio separado (más escalable)

3. **¿Cómo subirán los datos?**
   - a) Dashboard admin (upload manual)
   - b) API pública (integraciones automáticas)
   - c) Ambos

4. **¿Preview obligatorio?**
   - a) Sí, siempre revisar antes de importar
   - b) No, importación automática con logs
   - c) Configurable por cliente

5. **¿Sincronización automática?**
   - a) Sí, con cron jobs programables
   - b) No, solo importación manual
   - c) Webhooks desde plataformas externas

---

## 📝 Resumen Ejecutivo

Esta guía documenta el sistema de **transformación inteligente de datos usando LLM** para Revital, que permite:

✅ Importar productos desde **cualquier plataforma** sin código específico  
✅ Normalizar y estandarizar datos automáticamente  
✅ Enriquecer descripciones pobres  
✅ Clasificar productos inteligentemente  
✅ Corregir errores comunes  
✅ Reducir tiempo de desarrollo de integraciones en **90%**  

**Beneficio principal:** Convertir Revital en una plataforma **verdaderamente universal** que puede conectarse con cualquier sistema de e-commerce existente sin necesidad de desarrollar conectores específicos.

---

**Documento creado:** 22 de Octubre, 2025  
**Versión:** 1.0  
**Proyecto:** Revital SaaS E-commerce Platform  
**Autor:** Equipo de Desarrollo Revital


