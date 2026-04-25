"""
Servicios de pgvector para embeddings de productos.

Este módulo es la "capa de persistencia" para:
- Guardar embeddings en `tab_product_embeddings`
- Consultar productos más similares dado un embedding de query

En pgvector, el operador típico es:
- `<=>`  (cosine distance)  => menor es mejor

Notas:
- La tabla `tab_product_embeddings` ya existe (migración SQL manual).
- `tab_products.id` es DECIMAL(10), así que `product_id` también lo es.

Decisión de diseño:
- La lógica de UPSERT y búsqueda topK vive en funciones SQL:
  - fun_upsert_product_embedding(...)
  - fun_semantic_search_product_embeddings(...)
  Esto facilita auditoría y reutilización.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable, List, Sequence

from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from services.embedding_provider_service import Embedding
from services.vector_store_service import VectorSearchResult


def _to_pgvector_literal(embedding: Sequence[float]) -> str:
    """
    Convierte un embedding (lista de floats) a un literal compatible con pgvector.

    pgvector acepta strings tipo:
      '[0.1, -0.2, 0.3]'
    que luego se castea con `::vector`.
    """
    # Usamos una representación compacta; pgvector parsea floats estándar.
    return "[" + ",".join(f"{float(x):.8f}" for x in embedding) + "]"


def upsert_product_embedding(
    db: Session,
    *,
    product_id: Decimal,
    embedding: Embedding,
    source_text: str,
) -> None:
    """
    Inserta/actualiza el embedding de un producto.

    - `product_id` es PK, así que usamos ON CONFLICT DO UPDATE.
    - Actualizamos `updated_at` y también guardamos `source_text` para debug.
    """
    q = text("SELECT fun_upsert_product_embedding(:product_id, (:embedding)::vector, :source_text);")
    db.execute(
        q,
        {
            "product_id": product_id,
            "embedding": _to_pgvector_literal(embedding),
            "source_text": source_text,
        },
    )


def semantic_search_product_ids(
    db: Session,
    *,
    query_embedding: Embedding,
    top_k: int,
) -> List[VectorSearchResult]:
    """
    Devuelve los `product_id` más similares, ordenados por score descendente.

    En SQL obtenemos cosine distance (menor mejor) y la convertimos a score
    simple: score = 1 - distance.
    """
    q = text(
        "SELECT product_id, score FROM fun_semantic_search_product_embeddings((:q)::vector, :top_k);"
    )
    rows = db.execute(
        q,
        {
            "q": _to_pgvector_literal(query_embedding),
            "top_k": int(top_k),
        },
    ).mappings().all()

    results: List[VectorSearchResult] = []
    for r in rows:
        pid = r.get("product_id")
        if pid is None:
            continue
        # `product_id` en el schema es DECIMAL(10); lo convertimos a int para la app.
        results.append(VectorSearchResult(product_id=int(pid), score=float(r.get("score") or 0.0)))
    return results


def count_embeddings(db: Session) -> int:
    r = db.execute(text("SELECT COUNT(*) AS c FROM tab_product_embeddings;")).mappings().first()
    return int((r or {}).get("c") or 0)

