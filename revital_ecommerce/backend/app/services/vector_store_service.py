"""
Abstracción del "vector store" para búsqueda semántica de productos.

En la V2 usaremos PostgreSQL + pgvector, pero en esta V1 (sin tocar DB) usamos
una implementación en memoria para:

- Aprender el flujo de embeddings y búsqueda por similaridad.
- Tener una API estable que luego podamos implementar con pgvector sin romper
  el resto del sistema.

Qué hace un vector store:
- Guardar: (product_id -> embedding)
- Consultar: dado un embedding de query, devolver los product_id más similares

Métrica:
- Usaremos **cosine similarity** como base (muy estándar).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Protocol, Sequence, Tuple

from services.embedding_provider_service import Embedding


ProductId = int


@dataclass(frozen=True)
class VectorSearchResult:
    product_id: ProductId
    score: float  # mayor = más similar


class VectorStore(Protocol):
    """
    Contrato mínimo para almacenamiento y búsqueda por vectores.

    En pgvector esto se traduce a una tabla con columna `vector` y un índice
    ANN (approx nearest neighbors).
    """

    def upsert(self, items: Iterable[Tuple[ProductId, Embedding]]) -> None:
        """Inserta o actualiza embeddings de productos."""

    def delete(self, product_ids: Iterable[ProductId]) -> None:
        """Elimina embeddings para productos eliminados/desactivados."""

    def query(self, query_embedding: Embedding, *, top_k: int) -> List[VectorSearchResult]:
        """Devuelve los top_k productos más similares a la query."""

    def count(self) -> int:
        """Cantidad de embeddings almacenados."""


def _dot(a: Sequence[float], b: Sequence[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def _l2_norm(a: Sequence[float]) -> float:
    return (_dot(a, a)) ** 0.5


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    """
    Cosine similarity en rango [-1, 1].

    - 1.0   => idénticos (misma dirección)
    - 0.0   => sin relación (ortogonales)
    - -1.0  => opuestos
    """
    if not a or not b:
        return 0.0
    if len(a) != len(b):
        # Importante: embeddings de distinto tamaño NO son comparables.
        raise ValueError("Embeddings con distintas dimensiones")
    denom = _l2_norm(a) * _l2_norm(b)
    if denom == 0:
        return 0.0
    return _dot(a, b) / denom


class InMemoryVectorStore:
    """
    Vector store en memoria (solo para V1 / desarrollo).

    Trade-offs:
    - ✅ simple, sin migraciones
    - ❌ no persistente (se pierde al reiniciar)
    - ❌ O(N) por query (no escala)
    """

    def __init__(self) -> None:
        self._by_product_id: Dict[ProductId, Embedding] = {}

    def upsert(self, items: Iterable[Tuple[ProductId, Embedding]]) -> None:
        for product_id, embedding in items:
            self._by_product_id[int(product_id)] = list(embedding)

    def delete(self, product_ids: Iterable[ProductId]) -> None:
        for pid in product_ids:
            self._by_product_id.pop(int(pid), None)

    def query(self, query_embedding: Embedding, *, top_k: int) -> List[VectorSearchResult]:
        # Para el MVP: score exacto por cosine (búsqueda exhaustiva).
        scored: List[VectorSearchResult] = []
        for product_id, embedding in self._by_product_id.items():
            score = cosine_similarity(query_embedding, embedding)
            scored.append(VectorSearchResult(product_id=product_id, score=score))

        scored.sort(key=lambda r: r.score, reverse=True)
        return scored[: max(0, int(top_k))]

    def count(self) -> int:
        return len(self._by_product_id)

