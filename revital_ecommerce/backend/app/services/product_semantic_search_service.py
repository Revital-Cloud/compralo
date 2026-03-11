"""
Orquestador de búsqueda semántica de productos (AI Product Search).

Este módulo conecta 3 conceptos:

1) Producto -> texto (para embeddings)
   - lo hace `product_embedding_service.build_embedding_text_from_filtered_product`

2) Texto -> embedding (vector)
   - lo hace un `EmbeddingProvider`
   - por ahora usamos `HashingEmbeddingProvider` (NO semántico, solo para demostrar flujo)

3) Embedding -> topK product_ids (pgvector)
   - lo hace `pgvector_product_embeddings_service.semantic_search_product_ids`

Luego, con esos product_ids, devolvemos objetos `ProductFiltered` para el frontend.

Nota importante (MVP):
- Para evitar reescribir SQL complejo de listado, reutilizamos `fun_filter_products`
  para obtener un set grande de productos y luego filtramos por IDs preservando el orden
  del ranking semántico.
- Esto NO escala, pero es perfecto para aprender y para una primera integración.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Dict, List, Sequence, TypedDict

from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from schemas.product_schema import ProductFilterParams, ProductFilterResponse, ProductFiltered
from services.ollama_embedding_provider_service import OllamaEmbeddingProvider
from services.pgvector_product_embeddings_service import semantic_search_product_ids, count_embeddings
from services.embedding_provider_service import EmbeddingsNotConfiguredError


DEFAULT_EMBEDDING_DIMENSIONS = 768
# Gate por score absoluto del mejor match.
#
# Si el top-1 tiene score MUY bajo, es señal de que la query no "pega" con nada del
# catálogo (o de que el embedding está siendo ruidoso). En ese caso es mejor
# hacer fallback a búsqueda clásica que reordenar el catálogo con resultados flojos.
# Con catálogo pequeño y queries en español, un umbral ~0.45 funciona mejor.
MIN_BEST_SCORE_FOR_SEMANTIC = 0.45


@dataclass(frozen=True)
class SemanticSearchDebug:
    embeddings_count: int
    used_fallback: bool
    reason: str | None = None


class RankedMatch(TypedDict):
    product_id: int
    score: float


def _fetch_products_by_ids(db: Session, product_ids: Sequence[int]) -> Dict[int, dict]:
    """
    Trae solo los productos necesarios para el listado, por `product_ids`.

    Esto evita el patrón anterior de traer un bloque grande (ej. 10k) y reordenar
    en memoria. Aquí el coste escala con el número de resultados, no con el
    tamaño total del catálogo.
    """
    if not product_ids:
        return {}

    # Eliminamos duplicados y normalizamos a enteros.
    ids = [int(pid) for pid in dict.fromkeys(product_ids)]

    q = text(
        """
        SELECT
          p.id              AS product_id,
          p.category_id     AS category_id,
          c.nom_categoria   AS nom_categoria,
          p.nom_producto    AS nom_producto,
          p.slug_producto   AS slug_producto,
          p.description     AS description,
          p.id_marca        AS id_marca,
          m.nom_marca       AS nom_marca,
          p.precio_min      AS precio_min,
          p.precio_max      AS precio_max,
          p.stock_total     AS stock_total,
          p.img_principal   AS img_principal
        FROM tab_products p
        LEFT JOIN tab_categories c
          ON c.id_categoria = p.category_id
        LEFT JOIN tab_marcas m
          ON m.id_marca = p.id_marca
        WHERE p.id = ANY(:ids)
        """
    )
    rows = db.execute(q, {"ids": ids}).mappings().all()
    return {int(r["product_id"]): dict(r) for r in rows}


def _to_product_filtered(row: dict, *, total_registros: int) -> ProductFiltered:
    return ProductFiltered(
        category_id=int(row.get("category_id") or 0),
        id=int(row.get("product_id") or 0),
        slug=row.get("slug_producto"),
        category_name=(row.get("nom_categoria") or "") or "",
        name=(row.get("nom_producto") or "") or "",
        description=row.get("description"),
        image_url=row.get("img_principal"),
        price_min=row.get("precio_min") or Decimal("0"),
        price_max=row.get("precio_max") or row.get("precio_min") or Decimal("0"),
        stock_total=int(row.get("stock_total") or 0),
        total_registros=int(total_registros),
        rating=None,
        id_marca=int(row.get("id_marca")) if row.get("id_marca") is not None else None,
        nom_marca=row.get("nom_marca"),
        fec_insert=None,
    )


def semantic_search_products(
    db: Session,
    *,
    query: str,
    limit: int = 20,
    offset: int = 0,
    min_score: float | None = None,
    min_score_ratio: float | None = None,
    max_score_drop: float | None = None,
) -> tuple[ProductFilterResponse, SemanticSearchDebug, List[RankedMatch] | None]:
    """
    Endpoint-level function:
    - si hay embeddings, usa pgvector para ranking
    - si no hay embeddings, hace fallback a búsqueda clásica por nombre
    """
    q = (query or "").strip()
    if not q:
        empty = ProductFilterResponse(products=[], total=0, page=1, total_pages=0, limit=limit, offset=offset)
        return (
            empty,
            SemanticSearchDebug(embeddings_count=count_embeddings(db), used_fallback=True, reason="empty_query"),
            [],
        )

    embeddings_cnt = count_embeddings(db)
    if embeddings_cnt <= 0:
        # Fallback: usar búsqueda clásica por nombre (misma que /products/search).
        filters = ProductFilterParams(
            nombre_producto=q,
            limit=limit,
            offset=offset,
            ordenar_por="nombre",
            orden="ASC",
        )
        # Reusar servicio existente
        from services import product_service

        return (
            product_service.filter_products(db, filters),
            SemanticSearchDebug(
                embeddings_count=embeddings_cnt,
                used_fallback=True,
                reason="no_embeddings_indexed",
            ),
            None,
        )

    provider = OllamaEmbeddingProvider()
    try:
        query_embedding = provider.embed_query(q)
    except EmbeddingsNotConfiguredError:
        # Si Ollama no está disponible, caemos a búsqueda clásica.
        filters = ProductFilterParams(
            nombre_producto=q,
            limit=limit,
            offset=offset,
            ordenar_por="nombre",
            orden="ASC",
        )
        from services import product_service

        return (
            product_service.filter_products(db, filters),
            SemanticSearchDebug(
                embeddings_count=embeddings_cnt,
                used_fallback=True,
                reason="embedding_provider_unavailable",
            ),
            None,
        )
    if len(query_embedding) != DEFAULT_EMBEDDING_DIMENSIONS:
        # Si esto pasa, tu DB/funciones están en una dimensión distinta del provider.
        raise ValueError(
            f"Dimensión de embedding inesperada: {len(query_embedding)} (esperada {DEFAULT_EMBEDDING_DIMENSIONS})"
        )

    # Pedimos más que `limit` para poder paginar con offset sin recalcular.
    top_k = max(1, int(offset) + int(limit))
    ranked = semantic_search_product_ids(db, query_embedding=query_embedding, top_k=top_k)

    matches: List[RankedMatch] = [{"product_id": r.product_id, "score": float(r.score)} for r in ranked]

    if ranked and float(ranked[0].score) < MIN_BEST_SCORE_FOR_SEMANTIC:
        filters = ProductFilterParams(
            nombre_producto=q,
            limit=limit,
            offset=offset,
            ordenar_por="nombre",
            orden="ASC",
        )
        from services import product_service

        return (
            product_service.filter_products(db, filters),
            SemanticSearchDebug(
                embeddings_count=embeddings_cnt,
                used_fallback=True,
                reason="best_score_below_min_best_score",
            ),
            matches,
        )

    # 1) Corte relativo (recomendado): conserva resultados "cerca" del mejor.
    # Esto evita que queries genéricas devuelvan "todo reordenado".
    if ranked:
        best = float(ranked[0].score)
        cutoff_candidates: list[float] = []
        if min_score_ratio is not None:
            cutoff_candidates.append(best * float(min_score_ratio))
        if max_score_drop is not None:
            cutoff_candidates.append(best - float(max_score_drop))
        if cutoff_candidates:
            cutoff = max(cutoff_candidates)
            ranked = [r for r in ranked if float(r.score) >= cutoff]

    # 2) Umbral absoluto adicional (opcional)
    if min_score is not None:
        ranked = [r for r in ranked if float(r.score) >= float(min_score)]
    ranked_ids = [r.product_id for r in ranked]

    if not ranked_ids:
        filters = ProductFilterParams(
            nombre_producto=q,
            limit=limit,
            offset=offset,
            ordenar_por="nombre",
            orden="ASC",
        )
        from services import product_service

        return (
            product_service.filter_products(db, filters),
            SemanticSearchDebug(
                embeddings_count=embeddings_cnt,
                used_fallback=True,
                reason="no_ranked_results_or_below_threshold",
            ),
            matches,
        )

    # Traemos solo los productos necesarios para los IDs rankeados.
    by_id = _fetch_products_by_ids(db, ranked_ids)
    ordered_rows = [by_id[pid] for pid in ranked_ids if pid in by_id]
    total = len(ordered_rows)

    page = (offset // limit) + 1 if limit else 1
    total_pages = (total + limit - 1) // limit if total and limit else 0

    slice_rows = ordered_rows[int(offset) : int(offset) + int(limit)]
    products = [_to_product_filtered(r, total_registros=total) for r in slice_rows]

    return (
        ProductFilterResponse(
            products=products,
            total=total,
            page=page,
            total_pages=total_pages,
            limit=int(limit),
            offset=int(offset),
        ),
        SemanticSearchDebug(embeddings_count=embeddings_cnt, used_fallback=False, reason=None),
        matches,
    )

