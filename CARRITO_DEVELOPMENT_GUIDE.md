# 🛒 Guía de Desarrollo del Sistema de Carrito - Synkro

## 📋 Resumen Ejecutivo

Esta guía detalla cómo desarrollar y ejecutar el sistema completo de carrito de compras en Synkro. El backend ya está **100% implementado** con todas las funcionalidades necesarias. Tu tarea es crear la integración del frontend.

## 🎯 Estado Actual

### ✅ **Backend (COMPLETO)**
- Todos los endpoints de carrito funcionando
- Gestión de carritos anónimos y de usuarios registrados
- Cálculo automático de totales, descuentos y puntos
- Migración automática de carrito anónimo a usuario registrado

### ❌ **Frontend (POR IMPLEMENTAR)**
- Servicio de carrito (`cart.service.ts`)
- Hook de carrito (`use-cart.ts`)
- Store Zustand para persistencia
- Integración completa con backend
- Actualización de UI existente

---

## 🏗️ Arquitectura del Sistema

### **Backend Endpoints Disponibles**
```bash
GET    /api/carritos                    # Obtener todos los carritos
GET    /api/carrito-productos          # Obtener productos en carrito
POST   /api/carrito-productos          # Agregar producto al carrito
DELETE /api/carrito-productos/{ids...} # Eliminar producto del carrito
POST   /api/carrito-usuario            # Obtener/crear carrito de usuario
POST   /api/carrito-productos-detalle  # Obtener detalle completo del carrito
POST   /api/calcular-total             # Calcular totales con descuentos
POST   /api/migrar                     # Migrar carrito anónimo a usuario
```

### **Estructura de Datos Principal**
```typescript
// Producto en el carrito
interface CartItem {
  id_carrito: number;
  id_categoria_producto: number;
  id_linea_producto: number;
  id_sublinea_producto: number;
  id_producto: number;
  cantidad: number;
  precio_unitario_carrito: number;
  // ... más campos de auditoría
}

// Respuesta de cálculo de totales
interface CartTotalResponse {
  success: boolean;
  total_final: number;
  total_productos: number;
  total_descuentos: number;
  ahorro_total: number;
  puntos_a_ganar: number;
  mensaje: string;
  // ... más campos detallados
}
```

---

## 🚀 Plan de Implementación (6-8 días)

### **📅 Día 1: Configuración Base**
- [ ] Crear tipos TypeScript para carrito
- [ ] Configurar servicio de carrito
- [ ] Definir estructura de store Zustand

### **📅 Día 2-3: Servicio y Hook**
- [ ] Implementar `cart.service.ts` completo
- [ ] Desarrollar `use-cart.ts` hook
- [ ] Configurar persistencia local

### **📅 Día 4-5: Integración Backend**
- [ ] Conectar servicio con endpoints
- [ ] Implementar gestión de usuarios anónimos
- [ ] Manejar migración de carrito al login

### **📅 Día 6-7: UI y Funcionalidades**
- [ ] Actualizar página de carrito existente
- [ ] Implementar contador en header
- [ ] Agregar validaciones de stock

### **📅 Día 8: Testing y Pulido**
- [ ] Testing de funcionalidades
- [ ] Optimización de performance
- [ ] Documentación final

---

## 🛠️ Setup de Desarrollo

### **1. Estructura de Archivos a Crear**
```
frontend/
├── services/
│   └── cart.service.ts          # ← CREAR
├── hooks/
│   └── use-cart.ts              # ← CREAR
├── stores/
│   └── cart-store.ts            # ← CREAR (nuevo directorio)
├── types/
│   └── cart/
│       └── index.ts             # ← CREAR
└── utils/
    └── cart-helpers.ts          # ← CREAR
```

### **2. Configuración Inicial**

#### **Instalar dependencias adicionales:**
```bash
cd frontend
npm install zustand immer uuid
npm install --save-dev @types/uuid
```

#### **Variables de entorno:**
Tu archivo `.env.local` ya debe tener:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 📋 Checklist de Funcionalidades

### **🛒 Gestión Básica del Carrito**
- [ ] Agregar productos al carrito
- [ ] Modificar cantidades de productos
- [ ] Eliminar productos del carrito
- [ ] Vaciar carrito completo
- [ ] Persistencia entre sesiones

### **👤 Gestión de Usuarios**
- [ ] Carrito para usuarios anónimos (session_id)
- [ ] Carrito para usuarios registrados (id_usuario)
- [ ] Migración automática al hacer login/registro
- [ ] Sincronización entre dispositivos

### **💰 Cálculos y Totales**
- [ ] Subtotal de productos
- [ ] Cálculo de descuentos automáticos
- [ ] Aplicación de cupones/puntos
- [ ] Cálculo de envío e impuestos
- [ ] Total final

### **🔄 Estado y Sincronización**
- [ ] Estado global con Zustand
- [ ] Persistencia en localStorage
- [ ] Sincronización con backend
- [ ] Manejo de errores de conexión
- [ ] Estados de loading

### **🎨 Interfaz de Usuario**
- [ ] Contador de items en header
- [ ] Página de carrito responsiva
- [ ] Botones agregar/quitar en productos
- [ ] Drawer/modal de carrito rápido
- [ ] Validaciones visuales

---

## 💻 Ejemplos de Código

### **1. Servicio de Carrito (cart.service.ts)**
```typescript
// Ejemplo de estructura
import { get, post, del } from '@/utils/apiWrapper';
import type { CartItem, CartTotalResponse } from '@/types/cart';

export const cartService = {
  // Obtener carrito del usuario
  async getCart(userId?: number, sessionId?: string) {
    // Implementación con backend
  },

  // Agregar producto
  async addProduct(productData: CartProductCreate) {
    // POST /api/carrito-productos
  },

  // Eliminar producto
  async removeProduct(productIds: string, quantity: number) {
    // DELETE /api/carrito-productos/{ids}
  },

  // Calcular totales
  async calculateTotals(userId?: number, sessionId?: string) {
    // POST /api/calcular-total
  }
};
```

### **2. Hook useCart**
```typescript
// Ejemplo de estructura
export const useCart = () => {
  const { 
    items, 
    isLoading, 
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    calculateTotals
  } = useCartStore();

  // Lógica del hook
  return {
    items,
    itemCount: items.length,
    isLoading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totals: calculateTotals()
  };
};
```

### **3. Store Zustand**
```typescript
// Ejemplo de estructura
interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Persistencia
  loadFromStorage: () => void;
  saveToStorage: () => void;
}
```

---

## 🔧 Comandos de Desarrollo

### **Iniciar desarrollo:**
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### **Testing endpoints:**
```bash
# Usar el archivo Postman incluido
# Synkro - Complete API Collection.postman_collection.json

# O usar curl:
curl -X POST http://localhost:8000/api/carrito-usuario \
  -H "Content-Type: application/json" \
  -d '{"session_id": 123456}'
```

---

## 📚 Recursos y Referencias

### **Archivos Backend a Revisar:**
- `backend/app/routers/cart_product_router.py` - Endpoints completos
- `backend/app/schemas/cart_product_schemas.py` - Tipos de datos
- `backend/app/services/cart_product_service.py` - Lógica de negocio

### **Archivos Frontend Existentes:**
- `frontend/app/(shop)/cart/page.tsx` - UI actual (usando mocks)
- `frontend/components/cart/cart-item.tsx` - Componente de item
- `frontend/utils/apiWrapper.ts` - Cliente HTTP configurado

### **Documentación de Referencia:**
- `backend/app/Docs/DOCUMENTATION.md` - Documentación completa del backend
- `FRONTEND_IMPLEMENTATION_PLAN.md` - Plan de integración frontend
- `PLAN_V1_SYNKRO.md` - Plan general del proyecto

---

## 🎯 Criterios de Éxito

### **Funcionalidad Mínima (MVP):**
- [x] Backend funcionando (YA ESTÁ)
- [ ] Agregar/quitar productos del carrito
- [ ] Persistencia entre sesiones
- [ ] Cálculo correcto de totales
- [ ] Contador en header funcionando

### **Funcionalidad Completa:**
- [ ] Gestión de usuarios anónimos
- [ ] Migración automática al login
- [ ] Aplicación de descuentos
- [ ] Validación de stock en tiempo real
- [ ] Interfaz responsive y pulida

### **Funcionalidad Avanzada (Nice to Have):**
- [ ] Carrito rápido (drawer/modal)
- [ ] Productos recomendados en carrito
- [ ] Guardado para después
- [ ] Notificaciones de stock bajo
- [ ] Analytics de carrito abandonado

---

## 🚨 Consideraciones Importantes

### **Gestión de Usuarios Anónimos:**
- Usar `session_id` único para usuarios no logueados
- Generar con `crypto.randomUUID()` o similar
- Persistir en localStorage
- Migrar automáticamente al hacer login

### **Optimización de Performance:**
- Debounce en cambios de cantidad
- Cachear respuestas de totales
- Lazy loading de componentes pesados
- Optimistic updates en UI

### **Manejo de Errores:**
- Validar stock antes de agregar
- Manejar productos eliminados
- Fallback a localStorage si backend falla
- Mensajes de error user-friendly

### **Testing:**
- Unit tests para hooks y servicios
- Integration tests para flujo completo
- E2E tests para casos críticos
- Testing en diferentes dispositivos

---

## 📞 Soporte

Si encuentras problemas durante el desarrollo:

1. **Revisar documentación del backend** en `/backend/app/Docs/`
2. **Usar Postman** para testing de endpoints
3. **Consultar archivos existentes** como referencia
4. **Testing incremental** - implementar paso a paso

¡El backend está completamente funcional y testado! Tu trabajo es crear una experiencia de usuario fluida en el frontend.

---

**¡Buena suerte con el desarrollo! 🚀**
