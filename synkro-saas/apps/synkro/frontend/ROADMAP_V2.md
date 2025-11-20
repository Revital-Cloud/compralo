# Synkro V2 - Integración Landing + Plataforma

## Concepto: Landing Page como Portal de Gestión

### Visión V2

Transformar la landing page en un **portal híbrido** donde los usuarios puedan:

1. **Descubrir** la plataforma (landing tradicional)
2. **Acceder** a su dashboard de e-commerce
3. **Gestionar** su tienda directamente desde aquí

---

## Arquitectura Propuesta

### 1. **Autenticación Unificada**

```
Landing Page (Next.js) ←→ Auth Service ←→ E-commerce Platform
```

**Implementación:**

- JWT tokens compartidos
- Single Sign-On (SSO)
- Estado de autenticación global
- Redirección inteligente según el estado del usuario

### 2. **Rutas Dinámicas**

```
/                    → Landing pública
/login              → Autenticación
/dashboard          → Panel principal (embebido)
/dashboard/products → Gestión de productos
/dashboard/orders   → Gestión de pedidos
/dashboard/analytics → Estadísticas
/store/[subdomain]  → Vista previa de tienda
```

### 3. **Componentes Híbridos**

#### **Header Inteligente**

```tsx
// Cambia según el estado del usuario
const Header = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PublicHeader />; // Landing tradicional
  }

  return <DashboardHeader user={user} />; // Panel de control
};
```

#### **Sidebar de Gestión**

```tsx
// Solo visible para usuarios autenticados
const DashboardSidebar = () => (
  <aside className="fixed left-0 top-16 h-full w-64">
    <nav>
      <Link href="/dashboard">📊 Dashboard</Link>
      <Link href="/dashboard/products">🛍️ Productos</Link>
      <Link href="/dashboard/orders">📦 Pedidos</Link>
      <Link href="/dashboard/customers">👥 Clientes</Link>
      <Link href="/dashboard/analytics">📈 Analytics</Link>
      <Link href="/dashboard/settings">⚙️ Configuración</Link>
    </nav>
  </aside>
);
```

---

## Flujo de Usuario V2

### **Usuario Nuevo (No Autenticado)**

1. Ve la landing page completa
2. Se registra desde cualquier CTA
3. Completa onboarding básico
4. Es redirigido al dashboard embebido

### **Usuario Existente (Autenticado)**

1. Ve header simplificado + sidebar
2. Acceso directo a funcionalidades
3. Puede alternar entre "modo gestión" y "vista pública"

### **Visitante de Tienda**

1. Accede via `/store/[subdomain]`
2. Ve solo la tienda del cliente
3. Proceso de compra normal

---

## Tecnologías para V2

### **Frontend Unificado**

- **Next.js 15+** (App Router)
- **React 19+** con Server Components
- **ShadcnUI** para consistencia visual
- **Framer Motion** para transiciones
- **Zustand** para estado global

### **Autenticación**

- **NextAuth.js** o **Clerk**
- **JWT** para comunicación con APIs
- **Middleware** para protección de rutas

### **Comunicación con Backend**

- **tRPC** o **GraphQL** para type-safety
- **React Query** para cache y sincronización
- **WebSockets** para updates en tiempo real

### **Deployment**

- **Vercel** para el frontend
- **Subdominios dinámicos** para tiendas
- **Edge Functions** para personalización

---

## Beneficios de esta Arquitectura

### **Para Usuarios**

✅ **Una sola URL** para todo (synkro.com)  
✅ **Experiencia fluida** sin redirecciones  
✅ **Acceso rápido** a funcionalidades  
✅ **Vista previa** de su tienda integrada

### **Para Synkro**

✅ **Menor fricción** en onboarding  
✅ **Mayor retención** (todo en un lugar)  
✅ **Mejor SEO** (dominio unificado)  
✅ **Datos unificados** de comportamiento

### **Para Desarrollo**

✅ **Codebase unificado**  
✅ **Componentes reutilizables**  
✅ **Deploy simplificado**  
✅ **Mantenimiento centralizado**

---

## Fases de Implementación

### **Fase 1: Preparación (V1.5)**

- [ ] Implementar autenticación en landing actual
- [ ] Crear componentes base para dashboard
- [ ] Configurar rutas protegidas
- [ ] Integrar con API de la plataforma

### **Fase 2: Dashboard Embebido (V2.0)**

- [ ] Migrar funcionalidades principales
- [ ] Implementar sidebar de navegación
- [ ] Crear vistas de gestión básicas
- [ ] Sistema de notificaciones

### **Fase 3: Tiendas Integradas (V2.1)**

- [ ] Subdominios dinámicos
- [ ] Vista previa en tiempo real
- [ ] Editor visual integrado
- [ ] Analytics unificados

### **Fase 4: Optimización (V2.2)**

- [ ] Performance optimization
- [ ] Mobile-first dashboard
- [ ] Offline capabilities
- [ ] Advanced analytics

---

## Consideraciones Técnicas

### **Performance**

- **Code splitting** por rutas
- **Lazy loading** de componentes pesados
- **CDN** para assets estáticos
- **Service Workers** para cache

### **Seguridad**

- **CSRF protection**
- **Rate limiting**
- **Input validation**
- **Audit logs**

### **Escalabilidad**

- **Microservicios** en backend
- **Database sharding** por tenant
- **Redis** para sessions
- **Queue system** para tareas pesadas

---

## Conclusión

Esta arquitectura V2 convertiría a Synkro en una **plataforma todo-en-uno** donde la landing page evoluciona naturalmente hacia el panel de control, eliminando fricciones y mejorando la experiencia del usuario significativamente.

La clave está en la **transición gradual** y **progresiva** que respete el flujo natural del usuario desde el descubrimiento hasta la gestión diaria de su e-commerce.
