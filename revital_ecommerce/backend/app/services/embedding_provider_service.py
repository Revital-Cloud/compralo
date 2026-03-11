"""
Abstracción del proveedor de embeddings (vectores) para AI Product Search.

Este módulo define *qué* necesitamos de un proveedor de embeddings sin decidir *cuál*.

¿Por qué existe?
- Para que el resto del sistema (indexado, búsqueda, endpoints) no dependa de OpenAI,
  modelos locales, etc.
- Para poder arrancar con una implementación "stub" (que falla claramente) mientras
  preparamos la V2 (DB clon + pgvector + proveedor real).

Conceptos:
- **Embedding**: lista de floats (vector) que representa el significado de un texto.
- Hay dos entradas típicas:
  - Texto de producto (name, brand, category, description).
  - Texto de consulta del usuario (query).

En algunos modelos conviene tratarlos distinto (p. ej. prefijos "query:" vs "passage:"),
por eso exponemos dos métodos separados.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Protocol


Embedding = List[float]


class EmbeddingProvider(Protocol):
    """
    Contrato mínimo para generar embeddings.

    NOTA: es síncrono a propósito para mantener el MVP simple. Si luego el proveedor
    es asíncrono o requiere batching, podemos añadir:
    - embed_products(texts: list[str]) -> list[Embedding]
    - o una versión async.
    """

    def embed_product(self, text: str) -> Embedding:
        """Genera el embedding para un texto que describe un producto."""

    def embed_query(self, text: str) -> Embedding:
        """Genera el embedding para la consulta del usuario."""


@dataclass(frozen=True)
class EmbeddingsNotConfiguredError(RuntimeError):
    """
    Error explícito cuando aún no hay proveedor de embeddings configurado.

    Lo usamos para que las capas superiores (endpoint / job) puedan:
    - devolver 503 con un mensaje claro, o
    - caer a búsqueda clásica por nombre.
    """

    message: str = "Proveedor de embeddings no configurado"

    def __str__(self) -> str:  # pragma: no cover
        return self.message


class NotConfiguredEmbeddingProvider:
    """
    Implementación placeholder.

    Útil para integrar el flujo end-to-end (sin DB) y ver qué piezas faltan,
    pero fallará en runtime si alguien intenta usar embeddings realmente.
    """

    def embed_product(self, text: str) -> Embedding:
        raise EmbeddingsNotConfiguredError()

    def embed_query(self, text: str) -> Embedding:
        raise EmbeddingsNotConfiguredError()

