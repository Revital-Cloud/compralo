import pytest
from fastapi.testclient import TestClient


@pytest.mark.parametrize("environment", ["development", "production"])
def test_csp_script_src_does_not_allow_unsafe_directives(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, environment: str
):
    monkeypatch.setenv("ENVIRONMENT", environment)

    response = client.get("/")
    csp = response.headers.get("Content-Security-Policy", "")
    script_src = next(
        (
            directive.strip()
            for directive in csp.split(";")
            if directive.strip().startswith("script-src ")
        ),
        "",
    )

    assert script_src
    assert "'unsafe-inline'" not in script_src
    assert "'unsafe-eval'" not in script_src
