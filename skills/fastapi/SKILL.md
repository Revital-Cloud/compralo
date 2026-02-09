---
name: fastapi
description: >
  FastAPI patterns, routers, dependencies, and best practices.
  Trigger: When creating/modifying FastAPI routers, dependencies, or API endpoints.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [root]
  auto_invoke: "Creating/modifying FastAPI routers"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Router Patterns

```python
# ✅ ALWAYS: Use APIRouter
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/")
async def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.post("/", status_code=201)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product
```

## Dependency Injection

```python
# ✅ ALWAYS: Use dependencies for reusable logic
from fastapi import Depends

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # Decode token and return user
    return user

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user
```

## Error Handling

```python
# ✅ ALWAYS: Use HTTPException for errors
from fastapi import HTTPException

@router.get("/products/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
```

## Pydantic Schemas

```python
# ✅ ALWAYS: Use Pydantic for validation
from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: float = Field(..., gt=0)
    description: str | None = None

class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    
    class Config:
        from_attributes = True
```

## Rules

**ALWAYS**:
- Use APIRouter for route organization
- Use dependency injection
- Use Pydantic for validation
- Use HTTPException for errors
- Separate routers, schemas, and services

**NEVER**:
- Put business logic in routers
- Skip validation
- Access DB directly without session
- Mix concerns
