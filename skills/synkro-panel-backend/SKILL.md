---
name: synkro-panel-backend
description: >
  FastAPI backend patterns for SaaS panel.
  Trigger: When creating/modifying FastAPI routers, schemas, services in synkro_panel/backend.
license: MIT
metadata:
  author: synkro
  version: "1.0"
  scope: [synkro_panel/backend]
  auto_invoke: "Creating/modifying FastAPI routers in panel"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Structure

```
synkro_panel/backend/
├── app/
│   ├── core/            # Config (DB, JWT, rate limiting)
│   ├── middlewares/     # Auth, security
│   ├── routers/         # API endpoints
│   ├── schemas/         # Pydantic validation
│   ├── services/        # Business logic
│   └── main.py          # FastAPI app entry
├── requirements.txt
└── README.md
```

## Router Patterns

```python
# ✅ ALWAYS: Use dependency injection for auth
from app.core.dependencies import get_current_user

@router.get("/instances")
async def get_instances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Returns instances metadata, NOT instance data
    pass

# ✅ ALWAYS: Rate limiting for SaaS endpoints
from app.core.rate_limit import rate_limit

@router.post("/instances")
@rate_limit(max_calls=10, period=60)  # 10 calls per minute
async def create_instance(...):
    pass
```

## Schema Patterns

```python
# ✅ ALWAYS: Use Pydantic for validation
from pydantic import BaseModel, Field

class InstanceCreate(BaseModel):
    client_id: int
    plan_id: int
    domain: str = Field(..., pattern=r'^[a-z0-9-]+\.(com|net|org)$')
    
class SubscriptionResponse(BaseModel):
    id: int
    client_id: int
    plan_id: int
    status: str
    # ...
```

## Service Patterns

```python
# ✅ ALWAYS: Business logic in services
class InstanceService:
    @staticmethod
    def create_instance(db: Session, instance_data: InstanceCreate) -> Instance:
        # Creates instance metadata
        # Does NOT access instance database directly
        db_instance = Instance(**instance_data.dict())
        db.add(db_instance)
        db.commit()
        return db_instance
```

## Rules

**ALWAYS**:
- Store only metadata about instances
- Use rate limiting for SaaS endpoints
- Separate routers, schemas, and services
- Use Pydantic for validation

**NEVER**:
- Access instance databases directly
- Duplicate e-commerce logic
- Reference `synkro_ecommerce` code
- Store instance data in panel DB

## Related Skills

- `fastapi` - General FastAPI patterns
- `synkro-panel` - Panel overview
