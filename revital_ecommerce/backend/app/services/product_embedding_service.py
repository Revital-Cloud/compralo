"""
Servicio de utilidades para construir textos de productos orientados a embeddings.

Este módulo NO genera todavía los vectores numéricos. Su responsabilidad es:

- Definir una representación textual canónica de un producto, pensada para modelos
  de embeddings (\"AI Product Search\").
- Proveer funciones helper que aceptan los esquemas Pydantic ya existentes
  (`Product` y `ProductFiltered`) y devuelven una única cadena lista para ser
  enviada a un modelo de embeddings.

Mantener esta lógica en un módulo separado nos permite reutilizarla desde:

- Un job de indexado que genere embeddings de todos los productos.
- Endpoints de búsqueda semántica.
- Cualquier otra funcionalidad de IA que necesite una descripción textual
  consistente de los productos.
"""

from typing import Optional

from app.schemas.product_schema import Product, ProductFiltered


def build_product_embedding_text(
    *,
    name: str,
    brand_name: Optional[str] = None,
    category_name: Optional[str] = None,
    description: Optional[str] = None,
) -> str:
    """
    Construye una representación textual canónica de un producto.

    La idea es condensar en una sola cadena la información más útil para
    un modelo de embeddings:

    - Nombre
    - Marca
    - Categoría
    - Descripción

    El formato está pensado para ser legible por humanos y por modelos:

        \"{name} - {brand} | Categoría: {category} | Descripción: {description}\"

    Todos los campos, salvo `name`, son opcionales. Los que no estén presentes
    simplemente se omiten de la cadena resultante.
    """
    parts: list[str] = []

    normalized_name = name.strip()
    if not normalized_name:
        # En teoría name siempre debería venir con valor,
        # pero evitamos devolver una cadena vacía.
        normalized_name = "Producto sin nombre"

    # Primera parte: nombre (y opcionalmente marca en la misma frase).
    header = normalized_name
    if brand_name:
        brand_clean = brand_name.strip()
        if brand_clean:
            header = f"{header} - {brand_clean}"
    parts.append(header)

    # Segunda parte: categoría.
    if category_name:
        category_clean = category_name.strip()
        if category_clean:
            parts.append(f"Categoría: {category_clean}")

    # Tercera parte: descripción libre.
    if description:
        description_clean = description.strip()
        if description_clean:
            parts.append(f"Descripción: {description_clean}")

    return " | ".join(parts)


def build_embedding_text_from_product(product: Product) -> str:
    """
    Construye el texto de embeddings a partir de un `Product`.

    Usa los campos de alto nivel incluidos en el esquema:

    - `name`           → nombre del producto.
    - `nom_marca`      → nombre de la marca (si está disponible).
    - `category_name`  → nombre legible de la categoría.
    - `description`    → descripción libre.
    """
    return build_product_embedding_text(
        name=product.name,
        brand_name=product.nom_marca,
        category_name=product.category_name,
        description=product.description,
    )


def build_embedding_text_from_filtered_product(filtered: ProductFiltered) -> str:
    """
    Construye el texto de embeddings a partir de un `ProductFiltered`.

    Este esquema es el que se usa en las respuestas de filtrado/listado
    (`/products/filter`, `/products/search`), por lo que resulta útil cuando
    queremos generar embeddings directamente desde los resultados que ya
    se devuelven a la tienda.
    """
    return build_product_embedding_text(
        name=filtered.name,
        brand_name=filtered.nom_marca,
        category_name=filtered.category_name,
        description=filtered.description,
    )

