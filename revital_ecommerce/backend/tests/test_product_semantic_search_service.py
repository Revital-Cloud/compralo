from decimal import Decimal

from schemas.product_schema import ProductFilterResponse, ProductFiltered
from services import product_semantic_search_service as semantic_service
from services.vector_store_service import VectorSearchResult


def _build_response(names: list[str]) -> ProductFilterResponse:
    products: list[ProductFiltered] = []
    for idx, name in enumerate(names, start=1):
        products.append(
            ProductFiltered(
                category_id=1,
                id=idx,
                slug=f"slug-{idx}",
                category_name="Categoria",
                name=name,
                description=None,
                image_url=None,
                price_min=Decimal("10"),
                price_max=Decimal("10"),
                stock_total=5,
                total_registros=len(names),
                rating=None,
                id_marca=None,
                nom_marca=None,
                fec_insert=None,
            )
        )
    return ProductFilterResponse(
        products=products,
        total=len(products),
        page=1,
        total_pages=1 if products else 0,
        limit=10,
        offset=0,
    )


def _row_for_product(pid: int, name: str) -> dict:
    return {
        "product_id": pid,
        "category_id": 1,
        "nom_categoria": "Categoria",
        "nom_producto": name,
        "description": None,
        "img_principal": None,
        "precio_min": Decimal("10"),
        "precio_max": Decimal("10"),
        "stock_total": 3,
        "id_marca": None,
        "nom_marca": None,
    }


class _DummyProvider:
    def embed_query(self, _query: str) -> list[float]:
        return [0.1] * 768


def test_semantic_search_uses_classic_when_no_embeddings(monkeypatch):
    monkeypatch.setattr(semantic_service, "count_embeddings", lambda _db: 0)
    monkeypatch.setattr(
        semantic_service,
        "_fallback_classic_or_text_search",
        lambda _db, query, limit, offset: _build_response(["Producto A"]),
    )

    result, debug, _matches = semantic_service.semantic_search_products(
        db=object(),
        query="ropa",
        limit=10,
        offset=0,
    )

    assert result.total == 1
    assert result.products[0].name == "Producto A"
    assert debug.used_fallback is True
    assert debug.reason == "no_embeddings_indexed"


def test_semantic_search_best_score_below_threshold_falls_back_to_classic(monkeypatch):
    monkeypatch.setattr(semantic_service, "count_embeddings", lambda _db: 5)
    monkeypatch.setattr(semantic_service, "OllamaEmbeddingProvider", _DummyProvider)
    monkeypatch.setattr(
        semantic_service,
        "semantic_search_product_ids",
        lambda _db, query_embedding, top_k: [VectorSearchResult(product_id=10, score=0.30)],
    )
    monkeypatch.setattr(
        semantic_service,
        "_fallback_classic_or_text_search",
        lambda _db, query, limit, offset: _build_response(["Producto B"]),
    )

    result, debug, matches = semantic_service.semantic_search_products(
        db=object(),
        query="celulares",
        limit=10,
        offset=0,
    )

    assert result.total == 1
    assert result.products[0].name == "Producto B"
    assert debug.used_fallback is True
    assert debug.reason == "best_score_below_min_best_score"
    assert matches and matches[0]["product_id"] == 10


def test_semantic_search_returns_empty_when_classic_and_thresholds_leave_empty(monkeypatch):
    monkeypatch.setattr(semantic_service, "count_embeddings", lambda _db: 5)
    monkeypatch.setattr(semantic_service, "OllamaEmbeddingProvider", _DummyProvider)
    monkeypatch.setattr(
        semantic_service,
        "semantic_search_product_ids",
        lambda _db, query_embedding, top_k: [
            VectorSearchResult(product_id=21, score=0.60),
            VectorSearchResult(product_id=22, score=0.59),
        ],
    )
    monkeypatch.setattr(
        semantic_service,
        "_fallback_classic_or_text_search",
        lambda _db, query, limit, offset: _build_response([]),
    )
    result, debug, _matches = semantic_service.semantic_search_products(
        db=object(),
        query="luz",
        limit=10,
        offset=0,
        min_score=0.95,
        min_score_ratio=0.99,
        max_score_drop=0.0,
    )

    assert result.total == 0
    assert result.products == []
    assert debug.used_fallback is True
    assert debug.reason == "no_ranked_results_or_below_threshold"


def test_semantic_search_prefers_classic_if_thresholds_empty_semantic_and_classic_has_data(monkeypatch):
    monkeypatch.setattr(semantic_service, "count_embeddings", lambda _db: 5)
    monkeypatch.setattr(semantic_service, "OllamaEmbeddingProvider", _DummyProvider)
    monkeypatch.setattr(
        semantic_service,
        "semantic_search_product_ids",
        lambda _db, query_embedding, top_k: [
            VectorSearchResult(product_id=31, score=0.60),
            VectorSearchResult(product_id=32, score=0.58),
        ],
    )
    monkeypatch.setattr(
        semantic_service,
        "_fallback_classic_or_text_search",
        lambda _db, query, limit, offset: _build_response(["Producto C"]),
    )

    result, debug, _matches = semantic_service.semantic_search_products(
        db=object(),
        query="videojuegos",
        limit=10,
        offset=0,
        min_score=0.95,
        min_score_ratio=0.99,
        max_score_drop=0.0,
    )

    assert result.total == 1
    assert result.products[0].name == "Producto C"
    assert debug.used_fallback is True
    assert debug.reason == "no_ranked_results_or_below_threshold"
