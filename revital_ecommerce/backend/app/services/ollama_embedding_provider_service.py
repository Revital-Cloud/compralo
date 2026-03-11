"""
Embedding provider usando Ollama (local).

Contexto:
- El usuario instaló Ollama en el servidor y corrió `ollama pull nomic-embed-text`.
- La API queda disponible en `http://127.0.0.1:11434`.

Endpoint típico:
- POST /api/embeddings
  Body: { "model": "nomic-embed-text", "prompt": "texto..." }
  Response: { "embedding": [float, ...] }

Este provider permite enchufar embeddings reales al AI Product Search sin depender
de proveedores externos.
"""

from __future__ import annotations

import asyncio
import os
import logging
from typing import Any, Dict

import httpx

from services.embedding_provider_service import Embedding, EmbeddingProvider, EmbeddingsNotConfiguredError


DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434"
DEFAULT_OLLAMA_EMBED_MODEL = "nomic-embed-text"


class OllamaEmbeddingProvider(EmbeddingProvider):
    def __init__(
        self,
        *,
        base_url: str | None = None,
        model: str | None = None,
        timeout_s: float = 30.0,
    ) -> None:
        self._base_url = (base_url or os.getenv("OLLAMA_BASE_URL") or DEFAULT_OLLAMA_BASE_URL).strip()
        self._model = (model or os.getenv("OLLAMA_EMBED_MODEL") or DEFAULT_OLLAMA_EMBED_MODEL).strip()
        self._timeout = float(timeout_s)
        # Evitar ruido de logs por request en producción/dev.
        logging.getLogger("httpx").setLevel(logging.WARNING)

    def embed_product(self, text: str) -> Embedding:
        # Para modelos de embeddings tipo "retrieval" (como nomic-embed-text),
        # es común distinguir documento vs consulta con prefijos.
        return self._embed(f"passage: {text}")

    def embed_query(self, text: str) -> Embedding:
        return self._embed(f"query: {text}")

    def _embed(self, text: str) -> Embedding:
        prompt = (text or "").strip()
        if not prompt:
            return []

        url = f"{self._base_url}/api/embeddings"
        payload: Dict[str, Any] = {"model": self._model, "prompt": prompt}

        try:
            # Client short-lived (simple). If you want higher throughput, reuse a client instance.
            with httpx.Client(timeout=self._timeout) as client:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
        except (httpx.ConnectError, httpx.TimeoutException) as exc:
            # Tratamos problema de red / servicio caído como "no hay embeddings".
            raise EmbeddingsNotConfiguredError(
                f"Error al conectar con Ollama en {self._base_url}: {exc}"
            ) from exc
        except httpx.HTTPStatusError as exc:
            # 5xx / 4xx del servidor de Ollama.
            raise EmbeddingsNotConfiguredError(
                f"Ollama devolvió un error HTTP: {exc.response.status_code}"
            ) from exc

        emb = data.get("embedding")
        if not isinstance(emb, list) or not emb:
            raise ValueError("Ollama no devolvió un embedding válido")
        # Coerce to float list
        return [float(x) for x in emb]

    def embed_many(self, texts: list[str], *, concurrency: int = 8) -> list[Embedding]:
        """
        Genera embeddings para múltiples textos.

        Implementación simplificada y 100% síncrona para evitar conflictos con
        el event loop de FastAPI (`asyncio.run()` no se puede usar ahí).
        Para el tamaño actual de catálogo es suficiente hacer las requests en serie
        reutilizando un solo Client.
        """
        prompts = [f"passage: {(t or '').strip()}" for t in texts]
        if not prompts:
            return []

        url = f"{self._base_url}/api/embeddings"
        results: list[Embedding] = []

        try:
            with httpx.Client(timeout=self._timeout) as client:
                for prompt in prompts:
                    if not prompt:
                        results.append([])
                        continue
                    payload: Dict[str, Any] = {"model": self._model, "prompt": prompt}
                    resp = client.post(url, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    emb = data.get("embedding")
                    if not isinstance(emb, list) or not emb:
                        raise ValueError("Ollama no devolvió un embedding válido")
                    results.append([float(x) for x in emb])
        except (httpx.ConnectError, httpx.TimeoutException) as exc:
            raise EmbeddingsNotConfiguredError(
                f"Error al conectar con Ollama en {self._base_url}: {exc}"
            ) from exc
        except httpx.HTTPStatusError as exc:
            raise EmbeddingsNotConfiguredError(
                f"Ollama devolvió un error HTTP: {exc.response.status_code}"
            ) from exc

        return results

