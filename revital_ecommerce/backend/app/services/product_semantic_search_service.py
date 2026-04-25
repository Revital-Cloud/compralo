"""
Orquestador de búsqueda semántica de productos (AI Product Search).

Este módulo conecta 3 conceptos:

1) Producto -> texto (para embeddings)
   - lo hace `product_embedding_service.build_embedding_text_from_filtered_product`

2) Texto -> embedding (vector)
   - lo hace un `EmbeddingProvider`
   - usamos `OllamaEmbeddingProvider` para embeddings semánticos reales

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

from core.config import settings
from schemas.product_schema import ProductFilterParams, ProductFilterResponse, ProductFiltered
from services.ollama_embedding_provider_service import OllamaEmbeddingProvider
from services.pgvector_product_embeddings_service import semantic_search_product_ids, count_embeddings
from services.embedding_provider_service import EmbeddingsNotConfiguredError
from services.vector_store_service import VectorSearchResult


DEFAULT_EMBEDDING_DIMENSIONS = 768


@dataclass(frozen=True)
class SemanticSearchDebug:
    embeddings_count: int
    used_fallback: bool
    reason: str | None = None


class RankedMatch(TypedDict):
    product_id: int
    score: float


def _build_alt_query(query: str) -> str | None:
    q_lower = (query or "").strip().lower()
    if " " in q_lower:
        return None
    if q_lower.endswith("es") and len(q_lower) > 4:
        return q_lower[:-2]
    if q_lower.endswith("s") and len(q_lower) > 3:
        return q_lower[:-1]
    return None


def _looks_like_category_intent(query: str) -> bool:
    q = (query or "").strip().lower()
    if not q:
        return False
    tokens = [t for t in q.split() if t]
    if len(tokens) == 0 or len(tokens) > 3:
        return False
    if any(any(ch.isdigit() for ch in t) for t in tokens):
        return False
    stop = {"para", "con", "sin", "de", "del", "y", "o"}
    if any(t in stop for t in tokens):
        return False
    return True


def _rerank_semantic_candidates(
    db: Session,
    *,
    query: str,
    ranked: Sequence[VectorSearchResult],
) -> List[VectorSearchResult]:
    """
    Re-ranking híbrido (semántico + léxico) sobre candidatos semánticos.

    Usa `source_text` de `tab_product_embeddings` para aportar una señal textual
    adicional sin salir del flujo AI principal.
    """
    if not ranked:
        return []

    try:
        ids = [int(r.product_id) for r in ranked]
        if not ids:
            return list(ranked)

        q = (query or "").strip()
        q_lower = q.lower()
        alt_q = _build_alt_query(q)

        rows = db.execute(
            text(
                """
                SELECT
                  e.product_id,
                  ts_rank_cd(
                    to_tsvector('spanish', COALESCE(e.source_text, '')),
                    plainto_tsquery('spanish', :q)
                  ) AS lex_rank,
                  CASE WHEN LOWER(COALESCE(e.source_text, '')) LIKE :like_q THEN 1 ELSE 0 END AS lex_hit,
                  CASE WHEN :like_alt IS NOT NULL AND LOWER(COALESCE(e.source_text, '')) LIKE :like_alt THEN 1 ELSE 0 END AS lex_hit_alt
                FROM tab_product_embeddings e
                WHERE e.product_id = ANY(:ids)
                """
            ),
            {
                "q": q,
                "ids": ids,
                "like_q": f"%{q_lower}%",
                "like_alt": f"%{alt_q}%" if alt_q else None,
            },
        ).mappings().all()

        sem_score_by_id = {int(r.product_id): float(r.score) for r in ranked}
        lex_score_by_id: Dict[int, float] = {}
        for row in rows:
            pid = int(row["product_id"])
            lex_rank = float(row.get("lex_rank") or 0.0)
            lex_hit = float(row.get("lex_hit") or 0.0)
            lex_hit_alt = float(row.get("lex_hit_alt") or 0.0)
            # Escala pequeña para hits de substring; deja dominar al semántico.
            lex_score_by_id[pid] = lex_rank + (0.15 * lex_hit) + (0.10 * lex_hit_alt)

        reranked: list[tuple[int, float]] = []
        for pid, sem in sem_score_by_id.items():
            lex = lex_score_by_id.get(pid, 0.0)
            # Boost pequeño y controlado: preserva ranking semántico base
            # pero eleva candidatos con evidencia léxica real en source_text.
            hybrid = float(sem) + min(0.10, max(0.0, lex) * 0.30)
            reranked.append((pid, hybrid))

        reranked.sort(key=lambda x: x[1], reverse=True)
        return [VectorSearchResult(product_id=pid, score=float(score)) for pid, score in reranked]
    except Exception:
        # Nunca romper búsqueda por fallos de re-ranking.
        return list(ranked)


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
          c.name            AS nom_categoria,
          p.name            AS nom_producto,
          p.slug            AS slug_producto,
          p.description     AS description,
          p.id_marca        AS id_marca,
          m.nom_marca       AS nom_marca,
          (
            SELECT MIN(cmb.price)
            FROM tab_product_variant_combinations cmb
            JOIN tab_product_variant_groups g ON g.id = cmb.group_id
            WHERE g.product_id = p.id
              AND cmb.is_active = TRUE
          )                 AS precio_min,
          (
            SELECT MAX(cmb.price)
            FROM tab_product_variant_combinations cmb
            JOIN tab_product_variant_groups g ON g.id = cmb.group_id
            WHERE g.product_id = p.id
              AND cmb.is_active = TRUE
          )                 AS precio_max,
          (
            SELECT COALESCE(SUM(cmb.stock), 0)
            FROM tab_product_variant_combinations cmb
            JOIN tab_product_variant_groups g ON g.id = cmb.group_id
            WHERE g.product_id = p.id
              AND cmb.is_active = TRUE
          )                 AS stock_total,
          COALESCE(
            (
              SELECT pvi.image_url
              FROM tab_product_variant_images pvi
              JOIN tab_product_variant_groups g ON g.id = pvi.variant_group_id
              WHERE g.product_id = p.id
                AND LOWER(TRIM(COALESCE(g.dominant_value, ''))) = 'sin color'
              ORDER BY pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
              LIMIT 1
            ),
            (
              SELECT pvi.image_url
              FROM tab_product_variant_images pvi
              JOIN tab_product_variant_groups g ON g.id = pvi.variant_group_id
              WHERE g.product_id = p.id
              ORDER BY g.id, pvi.sort_order, pvi.id
              LIMIT 1
            )
          )                 AS img_principal
        FROM tab_products p
        LEFT JOIN tab_categories c
          ON c.id = p.category_id
        LEFT JOIN tab_marcas m
          ON m.id_marca = p.id_marca
        WHERE p.id = ANY(:ids)
          AND p.is_active = TRUE
        """
    )
    rows = db.execute(q, {"ids": ids}).mappings().all()
    return {int(r["product_id"]): dict(r) for r in rows}


def _filter_active_product_ids(db: Session, product_ids: Sequence[int]) -> List[int]:
    """
    Filtra IDs para conservar solo productos activos que siguen existiendo.

    Esto estabiliza la paginación cuando hay embeddings huérfanos
    (producto desactivado o eliminado sin limpiar embedding).
    """
    if not product_ids:
        return []

    ids = [int(pid) for pid in dict.fromkeys(product_ids)]
    rows = db.execute(
        text(
            """
            SELECT p.id AS product_id
            FROM tab_products p
            WHERE p.id = ANY(:ids)
              AND p.is_active = TRUE
            """
        ),
        {"ids": ids},
    ).mappings().all()
    valid_ids = {int(r["product_id"]) for r in rows}
    return [pid for pid in ids if pid in valid_ids]


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


def _lexical_search_products(
    db: Session,
    *,
    query: str,
    limit: int,
    offset: int,
) -> ProductFilterResponse:
    """
    Fallback de texto con FTS (español) sobre:
    nombre + descripción + categoría + categoría padre + marca.

    Esto evita depender solo de `nombre_producto` exacto cuando la semántica
    no alcanza umbral, y mejora casos como "celulares", "ropa", etc.
    """
    q = (query or "").strip()
    if not q:
        return ProductFilterResponse(products=[], total=0, page=1, total_pages=0, limit=limit, offset=offset)
    q_lower = q.lower()
    alt_q = _build_alt_query(q)

    fts_expr = """
      setweight(to_tsvector('spanish', COALESCE(p.name, '')), 'A') ||
      setweight(to_tsvector('spanish', COALESCE(p.description, '')), 'B') ||
      setweight(to_tsvector('spanish', COALESCE(c.name, '')), 'A') ||
      setweight(to_tsvector('spanish', COALESCE(cp.name, '')), 'A') ||
      setweight(to_tsvector('spanish', COALESCE(m.nom_marca, '')), 'C')
    """
    tsq_expr = "plainto_tsquery('spanish', :q)"
    text_concat_expr = "LOWER(COALESCE(p.name, '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(c.name, '') || ' ' || COALESCE(cp.name, '') || ' ' || COALESCE(m.nom_marca, ''))"
    lexical_match_expr = f"""
      (
        ({fts_expr}) @@ ({tsq_expr})
        OR {text_concat_expr} LIKE :like_q
        OR (:like_alt IS NOT NULL AND {text_concat_expr} LIKE :like_alt)
      )
    """

    total_q = text(
        f"""
        SELECT COUNT(*) AS total
        FROM tab_products p
        LEFT JOIN tab_categories c ON c.id = p.category_id
        LEFT JOIN tab_categories cp ON cp.id = c.parent_id
        LEFT JOIN tab_marcas m ON m.id_marca = p.id_marca
        WHERE p.is_active = TRUE
          AND {lexical_match_expr}
        """
    )
    total_row = db.execute(
        total_q,
        {
            "q": q,
            "like_q": f"%{q_lower}%",
            "like_alt": f"%{alt_q}%" if alt_q else None,
        },
    ).mappings().first()
    total = int((total_row or {}).get("total") or 0)
    if total <= 0:
        return ProductFilterResponse(products=[], total=0, page=1, total_pages=0, limit=limit, offset=offset)

    rows_q = text(
        f"""
        SELECT
          p.id              AS product_id,
          p.category_id     AS category_id,
          c.name            AS nom_categoria,
          p.name            AS nom_producto,
          p.slug            AS slug_producto,
          p.description     AS description,
          p.id_marca        AS id_marca,
          m.nom_marca       AS nom_marca,
          (
            SELECT MIN(cmb.price)
            FROM tab_product_variant_combinations cmb
            JOIN tab_product_variant_groups g ON g.id = cmb.group_id
            WHERE g.product_id = p.id
              AND cmb.is_active = TRUE
          )                 AS precio_min,
          (
            SELECT MAX(cmb.price)
            FROM tab_product_variant_combinations cmb
            JOIN tab_product_variant_groups g ON g.id = cmb.group_id
            WHERE g.product_id = p.id
              AND cmb.is_active = TRUE
          )                 AS precio_max,
          (
            SELECT COALESCE(SUM(cmb.stock), 0)
            FROM tab_product_variant_combinations cmb
            JOIN tab_product_variant_groups g ON g.id = cmb.group_id
            WHERE g.product_id = p.id
              AND cmb.is_active = TRUE
          )                 AS stock_total,
          COALESCE(
            (
              SELECT pvi.image_url
              FROM tab_product_variant_images pvi
              JOIN tab_product_variant_groups g ON g.id = pvi.variant_group_id
              WHERE g.product_id = p.id
                AND LOWER(TRIM(COALESCE(g.dominant_value, ''))) = 'sin color'
              ORDER BY pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
              LIMIT 1
            ),
            (
              SELECT pvi.image_url
              FROM tab_product_variant_images pvi
              JOIN tab_product_variant_groups g ON g.id = pvi.variant_group_id
              WHERE g.product_id = p.id
              ORDER BY g.id, pvi.sort_order, pvi.id
              LIMIT 1
            )
          )                 AS img_principal,
          ts_rank_cd(({fts_expr}), ({tsq_expr})) AS rank_score
        FROM tab_products p
        LEFT JOIN tab_categories c ON c.id = p.category_id
        LEFT JOIN tab_categories cp ON cp.id = c.parent_id
        LEFT JOIN tab_marcas m ON m.id_marca = p.id_marca
        WHERE p.is_active = TRUE
          AND {lexical_match_expr}
        ORDER BY rank_score DESC, p.id DESC
        LIMIT :limit OFFSET :offset
        """
    )
    rows = db.execute(
        rows_q,
        {
            "q": q,
            "like_q": f"%{q_lower}%",
            "like_alt": f"%{alt_q}%" if alt_q else None,
            "limit": int(limit),
            "offset": int(offset),
        },
    ).mappings().all()
    products = [_to_product_filtered(dict(r), total_registros=total) for r in rows]
    page = (offset // limit) + 1 if limit else 1
    total_pages = (total + limit - 1) // limit if total and limit else 0
    return ProductFilterResponse(
        products=products,
        total=total,
        page=page,
        total_pages=total_pages,
        limit=int(limit),
        offset=int(offset),
    )


def _fallback_classic_or_text_search(
    db: Session,
    *,
    query: str,
    limit: int,
    offset: int,
) -> ProductFilterResponse:
    """
    1) intenta búsqueda de texto (FTS)
    2) si no trae nada, usa fallback clásico existente por nombre
    """
    lexical = _lexical_search_products(db, query=query, limit=limit, offset=offset)
    if lexical.total > 0:
        return lexical

    filters = ProductFilterParams(
        nombre_producto=query,
        limit=limit,
        offset=offset,
        ordenar_por="nombre",
        orden="ASC",
    )
    from services import product_service

    return product_service.filter_products(db, filters)


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
    min_best_score_for_semantic = float(settings.AI_SEARCH_MIN_BEST_SCORE)
    if min_score is None:
        min_score = settings.AI_SEARCH_DEFAULT_MIN_SCORE
    if min_score_ratio is None:
        min_score_ratio = settings.AI_SEARCH_DEFAULT_MIN_SCORE_RATIO
    if max_score_drop is None:
        max_score_drop = settings.AI_SEARCH_DEFAULT_MAX_SCORE_DROP

    if not q:
        empty = ProductFilterResponse(products=[], total=0, page=1, total_pages=0, limit=limit, offset=offset)
        return (
            empty,
            SemanticSearchDebug(embeddings_count=count_embeddings(db), used_fallback=True, reason="empty_query"),
            [],
        )

    embeddings_cnt = count_embeddings(db)
    if embeddings_cnt <= 0:
        return (
            _fallback_classic_or_text_search(db, query=q, limit=limit, offset=offset),
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
        return (
            _fallback_classic_or_text_search(db, query=q, limit=limit, offset=offset),
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

    # Calculamos ranking completo para que `total`/`total_pages` sean estables
    # entre páginas y no dependan de `offset`.
    top_k = max(1, int(embeddings_cnt))
    ranked = semantic_search_product_ids(db, query_embedding=query_embedding, top_k=top_k)
    ranked = _rerank_semantic_candidates(db, query=q, ranked=ranked)

    matches: List[RankedMatch] = [{"product_id": r.product_id, "score": float(r.score)} for r in ranked]

    if _looks_like_category_intent(q):
        try:
            category_like = _lexical_search_products(db, query=q, limit=limit, offset=offset)
            if category_like.total > 0:
                return (
                    category_like,
                    SemanticSearchDebug(
                        embeddings_count=embeddings_cnt,
                        used_fallback=False,
                        reason="category_intent_lexical_hybrid",
                    ),
                    matches,
                )
        except Exception:
            pass

    if ranked and float(ranked[0].score) < min_best_score_for_semantic:
        classic_result = _fallback_classic_or_text_search(db, query=q, limit=limit, offset=offset)
        if classic_result.total > 0:
            return (
                classic_result,
                SemanticSearchDebug(
                    embeddings_count=embeddings_cnt,
                    used_fallback=True,
                    reason="best_score_below_min_best_score",
                ),
                matches,
            )
        return (
            ProductFilterResponse(products=[], total=0, page=1, total_pages=0, limit=limit, offset=offset),
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
    ranked_ids = _filter_active_product_ids(db, ranked_ids)

    if not ranked_ids:
        classic_result = _fallback_classic_or_text_search(db, query=q, limit=limit, offset=offset)
        if classic_result.total > 0:
            return (
                classic_result,
                SemanticSearchDebug(
                    embeddings_count=embeddings_cnt,
                    used_fallback=True,
                    reason="no_ranked_results_or_below_threshold",
                ),
                matches,
            )
        return (
            ProductFilterResponse(products=[], total=0, page=1, total_pages=0, limit=limit, offset=offset),
            SemanticSearchDebug(
                embeddings_count=embeddings_cnt,
                used_fallback=True,
                reason="no_ranked_results_or_below_threshold",
            ),
            matches,
        )

    total = len(ranked_ids)

    page = (offset // limit) + 1 if limit else 1
    total_pages = (total + limit - 1) // limit if total and limit else 0

    page_ids = ranked_ids[int(offset) : int(offset) + int(limit)]
    by_id = _fetch_products_by_ids(db, page_ids)
    slice_rows = [by_id[pid] for pid in page_ids if pid in by_id]
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

