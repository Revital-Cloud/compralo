"""
Proveedor de embeddings *de juguete* (determinístico) para desarrollo.

¿Por qué existe?
- Para que puedas ver el flujo completo (indexar -> guardar -> buscar) sin depender
  todavía de un proveedor real (OpenAI, modelo local, etc.).
- Esto es útil para aprendizaje y para integrar la parte de pgvector sin bloquearse
  por credenciales/costos.

IMPORTANTE:
- Este embedding NO es semántico. No "entiende" el texto.
- Genera vectores consistentes a partir del texto usando hashing.
- Cuando enchufemos un proveedor real, este archivo se puede borrar o dejar solo
  para tests/manual QA.
"""

from __future__ import annotations

import hashlib
from typing import List

from services.embedding_provider_service import Embedding, EmbeddingProvider


def _tokenize(text: str) -> List[str]:
    # Tokenización mínima: separa por espacios y baja a minúsculas.
    # (En un proveedor real, no harías esto; el modelo hace su propio tokenizado.)
    return [t for t in (text or "").lower().split() if t]


class HashingEmbeddingProvider(EmbeddingProvider):
    """
    Embeddings determinísticos basados en hashing.

    - `dimensions`: tamaño del vector. Debe coincidir con `vector(1536)` en la DB.
    - Los valores salen en rango aproximado [-1, 1].
    """

    def __init__(self, *, dimensions: int = 1536) -> None:
        self._dimensions = int(dimensions)
        if self._dimensions <= 0:
            raise ValueError("dimensions debe ser > 0")

    def embed_product(self, text: str) -> Embedding:
        return self._embed(text)

    def embed_query(self, text: str) -> Embedding:
        return self._embed(text)

    def _embed(self, text: str) -> Embedding:
        vec = [0.0] * self._dimensions
        tokens = _tokenize(text)
        if not tokens:
            return vec

        for tok in tokens:
            h = hashlib.sha256(tok.encode("utf-8")).digest()
            # Usamos 8 bytes para índice y 8 para valor.
            idx = int.from_bytes(h[:8], "big") % self._dimensions
            raw = int.from_bytes(h[8:16], "big")
            # Mapear a [-1, 1]
            val = (raw / ((1 << 64) - 1)) * 2.0 - 1.0
            vec[idx] += val

        # Normalización L2 para que cosine similarity tenga sentido.
        norm = sum(x * x for x in vec) ** 0.5
        if norm == 0:
            return vec
        return [x / norm for x in vec]

