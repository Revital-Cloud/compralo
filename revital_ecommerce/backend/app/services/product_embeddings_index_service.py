"""
Indexado de embeddings de productos hacia `tab_product_embeddings`.

Qué hace:
- Lee productos (activos) desde la misma fuente que el catálogo (fun_filter_products)
- Construye el texto canónico (nombre, marca, categoría, descripción)
- Genera embedding (por ahora HashingEmbeddingProvider)
- Hace upsert en `tab_product_embeddings`

Por qué está separado de la búsqueda:
- Indexar es un proceso batch / admin.
- Buscar es un proceso de request-time.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable, List, Sequence

from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from schemas.product_schema import ProductFiltered
from services.fake_embedding_provider_service import HashingEmbeddingProvider
from services.pgvector_product_embeddings_service import upsert_product_embedding
from services.product_embedding_service import build_embedding_text_from_filtered_product


DEFAULT_EMBEDDING_DIMENSIONS = 1536


@dataclass(frozen=True)
class ReindexResult:
    indexed: int
    failed: int


def _fetch_products_for_indexing(db: Session, *, limit: int = 10000) -> List[dict]:
    """
    Trae productos activos y campos necesarios para construir el texto de embeddings.

    Reutiliza fun_filter_products para mantener consistencia con el catálogo.
    """
    # fun_filter_products no devuelve `nom_marca`, así que lo traemos por JOIN.
    q = text(
        """
        SELECT
          f.product_id,
          f.category_id,
          f.nom_categoria,
          f.nom_producto,
          f.slug_producto,
          f.description,
          f.id_marca,
          m.nom_marca
        FROM fun_filter_products(
          NULL, TRUE, NULL, NULL,
          NULL, NULL, FALSE, 'nombre', 'ASC',
          :p_limit, 0
        ) f
        LEFT JOIN tab_marcas m
          ON m.id_marca = f.id_marca
        """
    )
    rows = db.execute(q, {"p_limit": int(limit)}).mappings().all()
    return list(rows)


def reindex_all_products(db: Session, *, limit: int = 10000) -> ReindexResult:
    """
    Reindexa (upsert) embeddings para productos activos.

    MVP: una sola transacción. Si se corta a mitad, puedes re-ejecutarlo:
    el upsert hace que sea idempotente.
    """
    provider = HashingEmbeddingProvider(dimensions=DEFAULT_EMBEDDING_DIMENSIONS)
    rows = _fetch_products_for_indexing(db, limit=limit)

    indexed = 0
    failed = 0
    for row in rows:
        try:
            pid_raw = row.get("product_id")
            if pid_raw is None:
                continue
            product_id = Decimal(str(pid_raw))

            filtered = ProductFiltered(
                category_id=int(row.get("category_id") or 0),
                id=int(pid_raw),
                slug=row.get("slug_producto"),
                category_name=(row.get("nom_categoria") or "") or "",
                name=(row.get("nom_producto") or "") or "",
                description=row.get("description"),
                image_url=None,
                price_min=Decimal("0"),
                price_max=Decimal("0"),
                stock_total=0,
                total_registros=0,
                rating=None,
                id_marca=int(row.get("id_marca")) if row.get("id_marca") is not None else None,
                nom_marca=row.get("nom_marca"),
                fec_insert=None,
            )

            source_text = build_embedding_text_from_filtered_product(filtered)
            embedding = provider.embed_product(source_text)

            # IMPORTANT (PostgreSQL):
            # Si un INSERT/UPDATE falla dentro de una transacción, la transacción queda "abortada"
            # y todas las operaciones posteriores fallan hasta hacer rollback.
            # Para que un error en un producto NO tumbe todo el batch, usamos un SAVEPOINT.
            with db.begin_nested():
                upsert_product_embedding(
                    db,
                    product_id=product_id,
                    embedding=embedding,
                    source_text=source_text,
                )
            indexed += 1
        except Exception:
            failed += 1
            continue

    db.commit()
    return ReindexResult(indexed=indexed, failed=failed)

