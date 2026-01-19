# Guía de Implementación Backend - Funcionalidades Restantes

## 📋 Resumen de Estado Actual

### ✅ Funcionalidades Ya Implementadas
- Autenticación (`auth_router`)
- Productos (`product_router`)
- Proveedores (`provider_router`)
- Usuarios (`user_router`)
- Marcas (`brand_router`)
- Sublíneas (`subline_router`)
- Categorías (`category_router`)
- Líneas (`lines_routers`)
- CMS (`cms_router`)
- Favoritos (`favorites_router`)
- Email (`email_router`)

### ❌ Funcionalidades Pendientes por Implementar
1. **Sistema de Carritos** (`tab_carritos`)
2. **Sistema de Órdenes/Pedidos** (`tab_ordenes`)
3. **Sistema de Puntos de Usuario** (`tab_puntos_usuario`)
4. **Sistema de Descuentos** (`tab_descuentos`)
5. **Canje de Puntos por Descuentos** (`tab_canjes_puntos_descuentos`)
6. **Movimientos de Puntos** (`tab_movimientos_puntos`)
7. **Configuración de Puntos de Empresa** (`tab_config_puntos_empresa`)
8. **Sistema de Roles** (`tab_roles`)
9. **Roles y Menús** (`tab_roles_menu`)
10. **Gestión de Menús** (`tab_menu`)
11. **Movimientos de Inventario** (`tab_movimientos_inventario`)
12. **Órdenes de Compra a Proveedores** (`tab_ordenes_compra_proveedor`)
13. **Detalle de Órdenes de Compra** (`tab_detalle_orden_compra_proveedor`)

---

## 🛠️ Plan de Implementación por Prioridad

### **FASE 1: Sistema de Carritos y Órdenes (Alta Prioridad)**
> **Tiempo estimado: 2-3 días**

#### 1.1 Implementar Sistema de Carritos

**Procedimientos almacenados disponibles:**
- `fn_calcular_total_carrito.sql`
- `fn_obtener_carrito_detalle.sql`
- `fn_obtener_carrito_usuario.sql`
- `sp_agregar_producto_carrito.sql`
- `sp_migrar_carrito_anonimo_a_usuario.sql`

**Pasos a seguir:**

**Paso 1:** Crear el Schema del Carrito
```bash
# Crear archivo: schemas/cart_schema.py
```

**Paso 2:** Crear el Service del Carrito
```bash
# Crear archivo: services/cart_service.py
```

**Paso 3:** Crear el Router del Carrito
```bash
# Crear archivo: routers/cart_router.py
```

**Paso 4:** Registrar el router en main.py
```python
from routers.cart_router import router as cart_router
app.include_router(cart_router, prefix=settings.API_STR)
```

#### 1.2 Implementar Sistema de Órdenes

**Procedimientos almacenados disponibles:**
- `fn_obtener_ordenes_usuario.sql`
- `sp_crear_orden_desde_carrito.sql`

**Pasos a seguir:**

**Paso 1:** Crear el Schema de Órdenes
```bash
# Crear archivo: schemas/order_schema.py
```

**Paso 2:** Crear el Service de Órdenes
```bash
# Crear archivo: services/order_service.py
```

**Paso 3:** Crear el Router de Órdenes
```bash
# Crear archivo: routers/order_router.py
```

**Paso 4:** Registrar el router en main.py
```python
from routers.order_router import router as order_router
app.include_router(order_router, prefix=settings.API_STR)
```

---

### **FASE 2: Sistema de Puntos y Descuentos (Alta Prioridad)**
> **Tiempo estimado: 3-4 días**

#### 2.1 Implementar Sistema de Puntos

**Procedimientos almacenados disponibles:**
- `fn_acumular_puntos_compra.sql`
- `fn_calcular_puntos_por_compra.sql`
- `fn_obtener_resumen_puntos_usuario.sql`
- `fn_obtener_descripcion_tipo_movimiento.sql`
- `fn_obtener_historial_puntos.sql`

**Pasos a seguir:**

**Paso 1:** Crear el Schema de Puntos
```bash
# Crear archivo: schemas/points_schema.py
```

**Paso 2:** Crear el Service de Puntos
```bash
# Crear archivo: services/points_service.py
```

**Paso 3:** Crear el Router de Puntos
```bash
# Crear archivo: routers/points_router.py
```

#### 2.2 Implementar Configuración de Puntos de Empresa

**Procedimientos almacenados disponibles:**
- `fn_actualizar_config_puntos_empresa.sql`
- `fn_obtener_config_puntos_activa.sql`

**Paso 1:** Crear el Schema de Configuración de Puntos
```bash
# Crear archivo: schemas/points_config_schema.py
```

**Paso 2:** Agregar endpoints en el service y router de puntos

#### 2.3 Implementar Sistema de Descuentos

**Procedimientos almacenados disponibles:**
- `fn_listar_descuentos_canjeables.sql`
- `fn_registrar_uso_descuento.sql`
- `fn_validar_descuento_aplicable.sql`
- `fn_canjear_puntos_descuento.sql`
- `fun_activar_desactivar_descuento.sql`
- `fun_insert_descuento.sql`
- `fun_listar_descuentos.sql`
- `fun_obtener_descuento.sql`
- `fun_update_descuento.sql`

**Pasos a seguir:**

**Paso 1:** Crear el Schema de Descuentos
```bash
# Crear archivo: schemas/discount_schema.py
```

**Paso 2:** Crear el Service de Descuentos
```bash
# Crear archivo: services/discount_service.py
```

**Paso 3:** Crear el Router de Descuentos
```bash
# Crear archivo: routers/discount_router.py
```

**Paso 4:** Registrar routers en main.py
```python
from routers.points_router import router as points_router
from routers.discount_router import router as discount_router

app.include_router(points_router, prefix=settings.API_STR)
app.include_router(discount_router, prefix=settings.API_STR)
```

---

### **FASE 3: Sistema de Roles y Menús (Prioridad Media)**
> **Tiempo estimado: 2-3 días**

#### 3.1 Implementar Sistema de Roles

**Procedimientos almacenados disponibles:**
- `fun_delete_roles.sql`
- `fun_insert_roles.sql`
- `fun_update_roles.sql`

#### 3.2 Implementar Sistema de Menús

**Procedimientos almacenados disponibles:**
- `fun_delete_menu.sql`
- `fun_insert_menu.sql`
- `fun_update_menu.sql`

#### 3.3 Implementar Roles-Menús

**Procedimientos almacenados disponibles:**
- `fun_delete_roles_menu.sql`
- `fun_insert_roles_menu.sql`
- `fun_update_roles_menu.sql`

**Pasos a seguir:**

**Paso 1:** Crear schemas correspondientes
```bash
# Crear archivos:
# - schemas/role_schema.py
# - schemas/menu_schema.py
# - schemas/role_menu_schema.py
```

**Paso 2:** Crear services correspondientes
```bash
# Crear archivos:
# - services/role_service.py
# - services/menu_service.py
```

**Paso 3:** Crear routers correspondientes
```bash
# Crear archivos:
# - routers/role_router.py
# - routers/menu_router.py
```

---

### **FASE 4: Sistema de Inventario y Órdenes de Compra (Prioridad Media-Baja)**
> **Tiempo estimado: 3-4 días**

#### 4.1 Implementar Movimientos de Inventario

**Procedimientos almacenados disponibles:**
- `fun_delete_movimientos_inventario.sql`
- `fun_insert_movimientos_inventario.sql`
- `fun_update_movimientos_inventario.sql`

#### 4.2 Implementar Órdenes de Compra a Proveedores

**Procedimientos almacenados disponibles:**
- `fun_delete_ordenes_compra_proveedor.sql`
- `fun_insert_ordenes_compra_proveedor.sql`
- `fun_update_ordenes_compra_proveedor.sql`

#### 4.3 Implementar Detalle de Órdenes de Compra

**Procedimientos almacenados disponibles:**
- `fun_delete_detalle_orden_compra_proveedor.sql`
- `fun_insert_detalle_orden_compra_proveedor.sql`
- `fun_update_detalle_orden_compra_proveedor.sql`

---

## 📝 Estructura de Archivos por Crear

```
/schemas/
├── cart_schema.py
├── order_schema.py
├── points_schema.py
├── points_config_schema.py
├── discount_schema.py
├── role_schema.py
├── menu_schema.py
├── role_menu_schema.py
├── inventory_schema.py
├── purchase_order_schema.py
└── purchase_order_detail_schema.py

/services/
├── cart_service.py
├── order_service.py
├── points_service.py
├── discount_service.py
├── role_service.py
├── menu_service.py
├── inventory_service.py
├── purchase_order_service.py
└── purchase_order_detail_service.py

/routers/
├── cart_router.py
├── order_router.py
├── points_router.py
├── discount_router.py
├── role_router.py
├── menu_router.py
├── inventory_router.py
├── purchase_order_router.py
└── purchase_order_detail_router.py
```

---

## 🔧 Comandos y Pasos Técnicos Detallados

### Para cada funcionalidad nueva:

#### 1. Crear el Schema
```python
# Ejemplo para cart_schema.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CartItemCreate(BaseModel):
    user_id: int
    product_id: int
    quantity: int
    
class CartItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    created_at: datetime
    updated_at: Optional[datetime]
```

#### 2. Crear el Service
```python
# Ejemplo para cart_service.py
from database.connection import get_database_connection
from schemas.cart_schema import CartItemCreate, CartItemResponse

class CartService:
    def __init__(self):
        self.db = get_database_connection()
    
    async def add_product_to_cart(self, cart_item: CartItemCreate):
        # Implementar llamada a sp_agregar_producto_carrito.sql
        pass
```

#### 3. Crear el Router
```python
# Ejemplo para cart_router.py
from fastapi import APIRouter, Depends, HTTPException
from services.cart_service import CartService
from schemas.cart_schema import CartItemCreate, CartItemResponse

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.post("/add-product", response_model=CartItemResponse)
async def add_product_to_cart(cart_item: CartItemCreate):
    # Implementar endpoint
    pass
```

#### 4. Registrar en main.py
```python
from routers.cart_router import router as cart_router
app.include_router(cart_router, prefix=settings.API_STR)
```

---

## ⚠️ Consideraciones Importantes

### 1. **Dependencias entre Funcionalidades**
- Los **carritos** deben implementarse antes que las **órdenes**
- El **sistema de puntos** debe implementarse antes que los **descuentos**
- Los **roles** deben implementarse antes que **roles-menús**

### 2. **Testing**
- Crear tests unitarios para cada service
- Crear tests de integración para cada router
- Probar todos los procedimientos almacenados

### 3. **Documentación**
- Actualizar la documentación de la API
- Documentar cada endpoint nuevo
- Actualizar el README principal

### 4. **Seguridad**
- Verificar permisos en cada endpoint
- Implementar validaciones de datos
- Asegurar que los usuarios solo accedan a sus propios datos

---

## 🎯 Próximos Pasos Inmediatos

1. **Comenzar con la Fase 1**: Sistema de Carritos
2. **Crear el schema de carritos** siguiendo la estructura de los schemas existentes
3. **Implementar el service de carritos** usando los procedimientos almacenados disponibles
4. **Crear el router de carritos** con todos los endpoints necesarios
5. **Probar la implementación** antes de continuar con las órdenes

---

## 📞 Puntos de Validación

Antes de continuar con cada fase, validar:
- ✅ Todos los endpoints funcionan correctamente
- ✅ Los procedimientos almacenados se ejecutan sin errores
- ✅ La documentación está actualizada
- ✅ Los tests pasan correctamente
- ✅ Los permisos y seguridad están implementados

---

*¿Quieres que comience con alguna funcionalidad específica o prefieres que siga el orden sugerido comenzando por el sistema de carritos?* 