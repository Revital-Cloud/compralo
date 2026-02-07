# 🚀 GUÍA COMPLETA DE PRUEBAS DE ENDPOINTS - DB_REVITAL

## 📋 Prerequisitos

1. **Ejecutar scripts en orden:**

   ```sql
   -- 1. Crear base de datos
   psql -f db_revital.sql

   -- 2. Poblar con datos iniciales
   psql -f SCRIPT_IMPLEMENTACION_COMPLETA.sql

   -- 3. Ejecutar simulaciones
   psql -f SCRIPT_SIMULACION_PRUEBAS_COMPLETAS.sql
   ```

2. **Configurar Postman:**
   - Importar: `Revital - Complete API Collection.postman_collection.json`
   - Variable `{{API_URL}}`: `http://127.0.0.1:8000/api`
   - Variable `{{USER_ID}}`: Se actualizará según el endpoint

---

## 🔐 FASE 1: AUTHENTICATION

### 1.1 Login Administrador

```http
POST {{API_URL}}/login
```

```json
{
  "email": "admin@dbrevital.com",
  "password": "admin123"
}
```

**✅ Resultado Esperado:** Token de administrador
**📝 Acción:** Copiar `access_token` a variable `{{TOKEN}}`

### 1.2 Login Cliente María

```http
POST {{API_URL}}/login
```

```json
{
  "email": "maria.gonzalez@email.com",
  "password": "cliente123"
}
```

**✅ Resultado Esperado:** Token de cliente
**📝 Acción:** Guardar token para pruebas de cliente

### 1.3 Get Current User Info

```http
GET {{API_URL}}/me
Authorization: Bearer {{TOKEN}}
```

**✅ Resultado Esperado:** Información del usuario logueado

---

## 👥 FASE 2: USERS MANAGEMENT

### 2.1 Get All Users (Admin)

```http
GET {{API_URL}}/users
Authorization: Bearer {{TOKEN}}
```

**✅ Resultado Esperado:** Lista de usuarios (admin, María, Pedro, Ana)

### 2.2 Create New User

```http
POST {{API_URL}}/users
```

```json
{
  "id_usuario": 1555666777,
  "nom_usuario": "Carlos",
  "ape_usuario": "Pérez",
  "email_usuario": "carlos.perez@email.com",
  "password_usuario": "carlos123",
  "ind_genero": true,
  "cel_usuario": "3001234567",
  "fec_nacimiento": "1988-07-15"
}
```

---

## 🛍️ FASE 3: PRODUCTS & CATALOG

### 3.1 Get All Products

```http
GET {{API_URL}}/products
```

**✅ Resultado Esperado:** Lista de productos creados en el script

### 3.2 Get Product by ID

```http
GET {{API_URL}}/products/1-2-2-1
```

**✅ Resultado Esperado:** Detalles del iPhone 14 Pro

### 3.3 Get All Categories

```http
GET {{API_URL}}/categories
```

**✅ Resultado Esperado:** 8 categorías (Electrónicos, Ropa, Hogar, etc.)

### 3.4 Get All Brands

```http
GET {{API_URL}}/brands
```

**✅ Resultado Esperado:** Marcas como Apple, Samsung, Nike, etc.

---

## 🎫 FASE 4: DISCOUNTS & POINTS

### 4.1 Get All Discounts

```http
GET {{API_URL}}/discounts
```

**✅ Resultado Esperado:** 5 descuentos creados en el script

### 4.2 Get Exchangeable Discounts for María

```http
GET {{API_URL}}/discounts/exchangeable/1098765432
```

**✅ Resultado Esperado:** Descuentos canjeables y puntos de María

### 4.3 Get Active Points Configuration

```http
GET {{API_URL}}/puntos/tasa-activa
```

**✅ Resultado Esperado:** Configuración de 1000 pesos = 1 punto

### 4.4 Get Points Movement Description

```http
GET {{API_URL}}/puntos/tipos-movimientos/1
Authorization: Bearer {{TOKEN}}
```

---

## ❤️ FASE 5: FAVORITES & SOCIAL

### 5.1 Get User Favorites (María)

```http
GET {{API_URL}}/favorites/1098765432
Authorization: Bearer {{TOKEN}}
```

**✅ Resultado Esperado:** iPhone 14 Pro y Blusa Elegante en favoritos

### 5.2 Add Product to Favorites

```http
POST {{API_URL}}/favorites
Authorization: Bearer {{TOKEN}}
```

```json
{
  "id_usuario": 1098765432,
  "id_categoria_producto": 1,
  "id_linea_producto": 3,
  "id_sublinea_producto": 1,
  "id_producto": 1
}
```

### 5.3 Get Comments

```http
GET {{API_URL}}/comentaries
```

**✅ Resultado Esperado:** Comentarios de María y Pedro

---

## 🛒 FASE 6: SHOPPING CART & ORDERS

### 6.1 Get User Cart

```http
POST {{API_URL}}/carrito-usuario
```

```json
{
  "id_usuario": 1098765432,
  "session_id": "234567890"
}
```

### 6.2 Add Product to Cart

```http
POST {{API_URL}}/carrito-productos
Authorization: Bearer {{TOKEN}}
```

```json
{
  "id_categoria_producto": 1,
  "id_linea_producto": 2,
  "id_sublinea_producto": 1,
  "id_producto": 1,
  "cantidad": 1,
  "session_id": "123456789"
}
```

### 6.3 Calculate Cart Total

```http
POST {{API_URL}}/calcular-total
```

```json
{
  "id_usuario": 1098765432,
  "session_id": "345678901",
  "canje_puntos": false,
  "puntos_a_canjear": 0
}
```

### 6.4 Get All Orders

```http
GET {{API_URL}}/orders
```

**✅ Resultado Esperado:** Órdenes creadas en las simulaciones

### 6.5 Get Order by ID

```http
GET {{API_URL}}/orders/1/1098765432
```

**✅ Resultado Esperado:** Primera orden de María

---

## 💰 FASE 7: POINTS & EXCHANGES

### 7.1 Get User Points

```http
GET {{API_URL}}/points-per-user
Authorization: Bearer {{TOKEN}}
```

**✅ Resultado Esperado:** Puntos acumulados por usuarios

### 7.2 Exchange Points for Discount

```http
POST {{API_URL}}/canjes-puntos-descuento
Authorization: Bearer {{TOKEN}}
```

```json
{
  "id_descuento": 3,
  "id_usuario": 1234567890
}
```

### 7.3 Get All Exchanges

```http
GET {{API_URL}}/canjes
```

**✅ Resultado Esperado:** Canje de Ana por descuento del 20%

---

## 🏢 FASE 8: SUPPLIER MANAGEMENT

### 8.1 Get All Providers

```http
GET {{API_URL}}/providers
```

**✅ Resultado Esperado:** 9 proveedores creados

### 8.2 Get All Order Buy Providers

```http
GET {{API_URL}}/orderbuyproviders
```

**✅ Resultado Esperado:** Orden de compra creada en simulación

### 8.3 Create Order Buy Provider

```http
POST {{API_URL}}/orderbuyproviders
Authorization: Bearer {{TOKEN}}
```

```json
{
  "id_proveedor": 2,
  "fec_orden_compra": "2025-01-28",
  "estado_orden": "pendiente",
  "total_orden": 5000000,
  "observaciones": "Orden de prueba desde Postman"
}
```

---

## 📧 FASE 9: CMS & EMAILS

### 9.1 Get All CMS Content

```http
GET {{API_URL}}/cms
```

**✅ Resultado Esperado:** 3 contenidos CMS creados

### 9.2 Send Welcome Email

```http
POST {{API_URL}}/emails/welcome
Authorization: Bearer {{TOKEN}}
```

```json
{
  "user_email": "carlos.perez@email.com",
  "user_name": "Carlos Pérez",
  "verify_url": "{{API_URL}}/auth/verify-email?token=test_token"
}
```

---

## 📊 FASE 10: STATISTICS & REPORTS

### 10.1 Get Products Statistics

```http
GET {{API_URL}}/estadisticas-productos
```

### 10.2 Get Categories Statistics

```http
GET {{API_URL}}/estadisticas-categorias
```

### 10.3 Validate Discount

```http
POST {{API_URL}}/discounts/validate
```

```json
{
  "id_descuento": 2,
  "id_usuario": 1234567890,
  "codigo_ingresado": "ELECTRONICO15",
  "usr_insert": 1234567890
}
```

---

## 🏠 FASE 11: ADDRESS MANAGEMENT

### 11.1 Get All Addresses

```http
GET {{API_URL}}/addresses
```

**✅ Resultado Esperado:** Direcciones de María, Pedro y Ana

### 11.2 Create Address

```http
POST {{API_URL}}/address
Authorization: Bearer {{TOKEN}}
```

```json
{
  "id_usuario": 1555666777,
  "nombre_direccion": "Oficina",
  "calle_direccion": "Carrera 15 #85-20",
  "ciudad": "Bogotá",
  "departamento": "Cundinamarca",
  "codigo_postal": "110111",
  "barrio": "Zona Rosa",
  "referencias": "Edificio de oficinas azul",
  "complemento": "Piso 8, Oficina 801"
}
```

---

## 🔍 VERIFICACIONES CRÍTICAS

### ✅ Verificar Triggers Automáticos

1. **Acumulación de Puntos:**

   ```http
   GET {{API_URL}}/points-per-user
   ```

   - María debe tener puntos por sus compras
   - Pedro debe tener puntos por sus compras

2. **Stock Actualizado:**

   ```http
   GET {{API_URL}}/products/1-2-2-1
   ```

   - iPhone 14 Pro debe tener stock reducido

3. **Uso de Descuentos:**
   ```http
   GET {{API_URL}}/discounts
   ```
   - BIENVENIDA10 debe mostrar 1 uso
   - ELECTRONICO15 debe mostrar 1 uso

### ✅ Verificar Límites y Validaciones

1. **Intentar usar descuento de primera compra dos veces** (debe fallar)
2. **Canjear puntos sin tener suficientes** (debe fallar)
3. **Usar código de descuento inexistente** (debe fallar)

---

## 📈 MÉTRICAS DE ÉXITO

Al finalizar todas las pruebas, deberías tener:

- ✅ **4+ usuarios** registrados
- ✅ **6+ órdenes** completadas
- ✅ **20+ productos** en catálogo
- ✅ **5 descuentos** configurados (algunos usados)
- ✅ **Puntos acumulados** por compras automáticamente
- ✅ **Favoritos y comentarios** funcionando
- ✅ **Carritos migrados** correctamente
- ✅ **Stock actualizado** después de ventas
- ✅ **CMS content** creado y funcional

---

## 🚨 Troubleshooting

### Error de Autenticación

- Verificar que el token esté en `{{TOKEN}}`
- Re-hacer login si el token expiró

### Error 404 en Endpoints

- Verificar que el backend esté corriendo
- Verificar `{{API_URL}}` = `http://127.0.0.1:8000/api`

### Datos No Encontrados

- Ejecutar scripts SQL en orden correcto
- Verificar que los IDs en Postman coincidan con los de la BD

### Errores de Validación

- Revisar tipos de datos (decimales, enteros, strings)
- Verificar campos obligatorios en el JSON

---

## 🎯 ENDPOINTS CRÍTICOS PARA PRODUCCIÓN

### Alto Impacto:

1. **POST /login** - Autenticación
2. **GET /products** - Catálogo
3. **POST /carrito-productos** - Agregar al carrito
4. **POST /orders** - Crear orden
5. **GET /discounts/exchangeable/{user_id}** - Descuentos canjeables

### Funcionalidad de Negocio:

1. **POST /canjes-puntos-descuento** - Canje de puntos
2. **GET /points-per-user** - Puntos del usuario
3. **POST /discounts/validate** - Validar descuentos
4. **GET /orders** - Historial de compras
5. **POST /favorites** - Gestión de favoritos

¡Con esta guía puedes probar el sistema completo como si estuviera en producción! 🚀
