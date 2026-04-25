---
name: revital-ecommerce-backend
description: >
  FastAPI backend patterns for e-commerce instance.
  Trigger: When creating/modifying FastAPI routers, schemas, services in revital_ecommerce/backend.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [revital_ecommerce/backend]
  auto_invoke: "Creating/modifying FastAPI routers in e-commerce"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Structure

```
revital_ecommerce/backend/
├── app/
│   ├── core/            # Config (DB, JWT, dependencies)
│   ├── middlewares/     # Auth, roles, security
│   ├── routers/         # API endpoints
│   ├── schemas/         # Pydantic validation
│   ├── services/        # Business logic
│   ├── templates/       # Email templates (Resend)
│   └── main.py          # FastAPI app entry
├── requirements.txt
└── README.md
```

## Router Patterns

```python
# ✅ ALWAYS: Use dependency injection for auth
from app.core.dependencies import get_current_user, require_role

@router.get("/products")
async def get_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Implementation
    pass

# ✅ ALWAYS: Use role-based access
@router.post("/products")
async def create_product(
    product: ProductCreate,
    current_user: User = Depends(require_role(["Admin", "Employee"])),
    db: Session = Depends(get_db)
):
    # Implementation
    pass
```

## Schema Patterns

```python
# ✅ ALWAYS: Use Pydantic for validation
from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: float = Field(..., gt=0)
    description: str | None = None
    
# ✅ ALWAYS: Separate create/update/response schemas
class ProductUpdate(BaseModel):
    name: str | None = None
    price: float | None = Field(None, gt=0)
    
class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    # ...
```

## Service Patterns

```python
# ✅ ALWAYS: Business logic in services, not routers
class ProductService:
    @staticmethod
    def create_product(db: Session, product_data: ProductCreate) -> Product:
        # Business logic here
        db_product = Product(**product_data.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
```

## Database Patterns

```python
# ✅ ALWAYS: Use SQLAlchemy sessions from dependency
from app.core.database import get_db
from sqlalchemy.orm import Session

@router.get("/products")
async def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()
```

## Authentication Patterns

```python
# ✅ ALWAYS: Use JWT middleware
from app.middlewares.auth import get_current_user, require_role

# Roles: Admin, Employee, Customer
@router.get("/admin-only")
async def admin_endpoint(
    current_user: User = Depends(require_role(["Admin"]))
):
    pass
```

## Rules

**ALWAYS**:
- Use dependency injection for DB and auth
- Separate routers, schemas, and services
- Use Pydantic for validation
- Handle errors with HTTPException

**NEVER**:
- Access database directly without session
- Put business logic in routers
- Skip authentication/authorization

## Related Skills

- `fastapi` - General FastAPI patterns
- `revital-ecommerce` - E-commerce overview
