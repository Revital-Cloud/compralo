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
from typing import List

from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from schemas.product_schema import ProductFiltered
from services.ollama_embedding_provider_service import OllamaEmbeddingProvider
from services.pgvector_product_embeddings_service import upsert_product_embedding
from services.product_embedding_service import build_embedding_text_from_filtered_product
from services.embedding_provider_service import EmbeddingsNotConfiguredError


DEFAULT_EMBEDDING_DIMENSIONS = 768
DEFAULT_EMBED_CONCURRENCY = 8


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
          NULL, NULL, FALSE, FALSE, 'nombre', 'ASC',
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
    rows = _fetch_products_for_indexing(db, limit=limit)

    # 1) Construimos todos los textos primero (barato)
    index_items: list[tuple[Decimal, str]] = []
    for row in rows:
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
        index_items.append((product_id, source_text))

    # 2) Embeddings en batch (con concurrencia limitada)
    provider = OllamaEmbeddingProvider()
    try:
        embeddings = provider.embed_many([t for (_pid, t) in index_items], concurrency=DEFAULT_EMBED_CONCURRENCY)
    except EmbeddingsNotConfiguredError:
        # Si Ollama no está disponible, no podemos indexar nada.
        return ReindexResult(indexed=0, failed=len(index_items))

    indexed = 0
    failed = 0
    for (product_id, source_text), embedding in zip(index_items, embeddings):
        try:
            if len(embedding) != DEFAULT_EMBEDDING_DIMENSIONS:
                raise ValueError(
                    f"Dimensión de embedding inesperada: {len(embedding)} (esperada {DEFAULT_EMBEDDING_DIMENSIONS})"
                )

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


def reindex_product_by_id(db: Session, *, product_id: Decimal) -> bool:
    """
    Reindexa un único producto activo.

    Devuelve:
    - True si se indexó correctamente.
    - False si el producto no está activo o no existe.
    """
    q = text(
        """
        SELECT
          p.id            AS product_id,
          p.category_id   AS category_id,
          c.name          AS nom_categoria,
          p.name          AS nom_producto,
          p.slug          AS slug_producto,
          p.description   AS description,
          p.id_marca      AS id_marca,
          m.nom_marca     AS nom_marca,
          p.is_active     AS ind_activo
        FROM tab_products p
        LEFT JOIN tab_categories c ON c.id = p.category_id
        LEFT JOIN tab_marcas m ON m.id_marca = p.id_marca
        WHERE p.id = :pid
        LIMIT 1
        """
    )
    row = db.execute(q, {"pid": product_id}).mappings().first()
    if not row:
        return False
    if not bool(row.get("ind_activo", False)):
        return False

    filtered = ProductFiltered(
        category_id=int(row.get("category_id") or 0),
        id=int(row.get("product_id")),
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
    provider = OllamaEmbeddingProvider()
    emb = provider.embed_product(source_text)
    if len(emb) != DEFAULT_EMBEDDING_DIMENSIONS:
        raise ValueError(
            f"Dimensión de embedding inesperada: {len(emb)} (esperada {DEFAULT_EMBEDDING_DIMENSIONS})"
        )
    upsert_product_embedding(
        db,
        product_id=Decimal(str(row.get("product_id"))),
        embedding=emb,
        source_text=source_text,
    )
    db.commit()
    return True


def delete_product_embedding(db: Session, *, product_id: Decimal) -> None:
    """
    Elimina embedding de un producto (útil al desactivar).
    """
    db.execute(
        text("DELETE FROM tab_product_embeddings WHERE product_id = :pid"),
        {"pid": product_id},
    )
    db.commit()

