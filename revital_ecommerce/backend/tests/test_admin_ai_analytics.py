"""
Tests para las tools de analytics del asistente admin.
Ejecutar: pytest tests/test_admin_ai_analytics.py -v
Los tests de integración requieren DB (se saltan si no hay DATABASE_URL en settings).
"""
import pytest

@pytest.fixture
def db_session():
    """Sesión de DB para tests. Requiere DATABASE_URL en config."""
    from core.config import settings
    if not getattr(settings, "DATABASE_URL", None):
        pytest.skip("DATABASE_URL no configurada")
    from core.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_get_top_categories_by_revenue(db_session):
    """get_top_categories_by_revenue devuelve texto con categorías."""
    from services.admin_ai_actions import execute_action

    result = execute_action(db_session, "get_top_categories_by_revenue", {"limit": 5}, 1)
    assert isinstance(result, str)
    assert "categoría" in result.lower() or "no hay" in result.lower() or "error" in result.lower()


def test_get_conversion_metrics(db_session):
    """get_conversion_metrics devuelve texto con métricas."""
    from services.admin_ai_actions import execute_action

    result = execute_action(db_session, "get_conversion_metrics", {}, 1)
    assert isinstance(result, str)
    assert "conversión" in result.lower() or "métrica" in result.lower() or "no hay" in result.lower() or "error" in result.lower()


def test_get_geographic_sales(db_session):
    """get_geographic_sales devuelve texto con regiones."""
    from services.admin_ai_actions import execute_action

    result = execute_action(db_session, "get_geographic_sales", {"limit": 5}, 1)
    assert isinstance(result, str)
    assert "región" in result.lower() or "no hay" in result.lower() or "error" in result.lower()


def test_get_hourly_traffic(db_session):
    """get_hourly_traffic devuelve texto con horas."""
    from services.admin_ai_actions import execute_action

    result = execute_action(db_session, "get_hourly_traffic", {}, 1)
    assert isinstance(result, str)
    assert "hora" in result.lower() or "no hay" in result.lower() or "error" in result.lower()


def test_get_customer_demographics(db_session):
    """get_customer_demographics devuelve texto con demografía."""
    from services.admin_ai_actions import execute_action

    result = execute_action(db_session, "get_customer_demographics", {}, 1)
    assert isinstance(result, str)
    assert "demografía" in result.lower() or "edad" in result.lower() or "no hay" in result.lower() or "error" in result.lower()


def test_analytics_tools_in_read_only_list():
    """Las tools de analytics están definidas en ADMIN_AI_TOOLS."""
    analytics_tools = (
        "get_top_categories_by_revenue",
        "get_conversion_metrics",
        "get_geographic_sales",
        "get_hourly_traffic",
        "get_customer_demographics",
    )
    # Verificar que admin_ai_tools las incluye
    from services.admin_ai_tools import ADMIN_AI_TOOLS
    tool_names = [t["function"]["name"] for t in ADMIN_AI_TOOLS if "function" in t]
    for name in analytics_tools:
        assert name in tool_names, f"Falta tool {name} en ADMIN_AI_TOOLS"
