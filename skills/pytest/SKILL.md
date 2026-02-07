---
name: pytest
description: >
  pytest patterns, fixtures, mocking, and testing best practices.
  Trigger: When writing Python tests with pytest.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [root]
  auto_invoke: "Writing Python tests with pytest"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Test Structure

```python
# ✅ ALWAYS: Use pytest fixtures
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    return TestClient(app)
```

## Test Patterns

```python
# ✅ ALWAYS: Use descriptive test names
def test_create_product_returns_201_on_success(client):
    response = client.post("/products", json={"name": "Test", "price": 10.0})
    assert response.status_code == 201

# ✅ ALWAYS: Use parametrize for multiple cases
@pytest.mark.parametrize("price,expected", [
    (10.0, 201),
    (-1.0, 422),
    (0.0, 422),
])
def test_create_product_validates_price(client, price, expected):
    response = client.post("/products", json={"name": "Test", "price": price})
    assert response.status_code == expected
```

## Mocking Patterns

```python
# ✅ ALWAYS: Mock external dependencies
from unittest.mock import patch, MagicMock

@patch('app.services.email.send_email')
def test_send_welcome_email(mock_send_email):
    send_welcome_email("user@example.com")
    mock_send_email.assert_called_once()
```

## Rules

**ALWAYS**:
- Use fixtures for setup/teardown
- Use descriptive test names
- Use parametrize for multiple cases
- Mock external dependencies

**NEVER**:
- Skip fixtures for DB setup
- Use generic test names
- Hardcode test data unnecessarily
