# Dashboard Components 📊

**Componentes modulares del dashboard administrativo de Revital**

Esta carpeta contiene todos los componentes modulares del dashboard administrativo de Revital. Los componentes han sido refactorizados desde un archivo monolítico de 617 líneas a una estructura modular y mantenible.

## 🏗️ Estructura

```
dashboard/
├── index.ts                 # Exports centralizados
├── kpi-card.tsx            # Tarjetas de KPIs
├── sales-chart.tsx         # Gráfico de ventas interactivo
├── best-sellers.tsx        # Lista de productos más vendidos
├── recent-orders.tsx       # Tabla/cards de órdenes recientes
├── dashboard-header.tsx    # Header con controles
├── loading-skeleton.tsx    # Esqueletos de carga
└── README.md              # Esta documentación
```

## 📊 Componentes

### KPICard
Tarjeta de métricas con indicadores de tendencia.

```tsx
<KPICard
  title="Total de Órdenes"
  data={{
    value: 2642600,
    growth: 34.7,
    trend: 'up',
    formatted: '$2.6M'
  }}
  icon={IconShoppingCart}
  loading={false}
/>
```

### SalesChart
Gráfico interactivo de barras con tooltips.

```tsx
<SalesChart
  salesData={salesDataArray}
  summary={{ totalSales: 450, totalOrders: 1299, conversionRate: '3.2' }}
  loading={false}
/>
```

### BestSellers
Lista rankeada de productos más vendidos.

```tsx
<BestSellers
  bestSellers={bestSellersArray}
  loading={false}
/>
```

### RecentOrders
Tabla responsive con vista de cards en mobile.

```tsx
<RecentOrders
  recentOrders={ordersArray}
  loading={false}
/>
```

### DashboardHeader
Header con controles de filtros y refresh.

```tsx
<DashboardHeader
  timeRange="monthly"
  onTimeRangeChange={setTimeRange}
  loading={false}
  lastUpdate={new Date()}
  onRefresh={refetchData}
/>
```

### LoadingSkeleton
Esqueleto de carga para estado inicial.

```tsx
<LoadingSkeleton />
```

## 🎯 Ventajas de la Refactorización

### ✅ Antes (page.tsx de 617 líneas)
- Un solo archivo gigante
- Difícil mantenimiento
- Tipos duplicados
- Lógica mezclada

### ✅ Después (Estructura modular)
- **page.tsx**: Solo 96 líneas limpias
- **Componentes separados**: Responsabilidad única
- **Hook personalizado**: Lógica de datos separada
- **Types exportados**: Reutilizables
- **Fácil testing**: Componentes aislados

## 🔄 Hook de Datos

El hook `useDashboardData` maneja:
- Estado de carga
- Auto-refresh cada 30 segundos
- Generación de datos mock
- Manejo de errores
- TypeScript completo

```tsx
const { data, loading, lastUpdate, refetch } = useDashboardData(timeRange)
```

## 📱 Responsive Design

Todos los componentes son completamente responsive:
- **Desktop**: Tablas y grids completos
- **Tablet**: Layouts adaptables
- **Mobile**: Cards apiladas y controles verticales

## 🎨 UI/UX

- **Loading states** en todos los componentes
- **Hover effects** y transiciones suaves
- **Skeleton loaders** para mejor percepción de velocidad
- **Error boundaries** preparados
- **Accessibility** considerado

## 🚀 Próximos Pasos

1. **Conectar backend real** (reemplazar mock data)
2. **Tests unitarios** para cada componente
3. **Storybook** para documentación visual
4. **Error handling** más robusto
5. **Caching** con React Query

## 📝 Uso

```tsx
import {
  KPICard,
  SalesChart,
  BestSellers,
  RecentOrders,
  DashboardHeader,
  LoadingSkeleton
} from '@/components/dashboard'

// También types:
import type { KPIData, SalesDataPoint, BestSeller, RecentOrder } from '@/components/dashboard'
```

Esta refactorización mejora significativamente la mantenibilidad, escalabilidad y testing del dashboard.

## 🌐 Localización en Español

Todos los componentes están completamente traducidos al español:

### Textos de UI
- **KPI Cards**: "Total de Órdenes", "Órdenes Activas", etc.
- **Sales Chart**: "Resumen de Ventas", "Tasa de Conversión"
- **Best Sellers**: "Productos Destacados", "vendidos"
- **Recent Orders**: "Actividad Reciente", estados en español
- **Dashboard Header**: "Actualizar", "Actualizando..."

### Estados de Órdenes
- `delivered` → "Entregado"
- `pending` → "Pendiente" 
- `processing` → "Procesando"
- `shipped` → "Enviado"
- `canceled` → "Cancelado"

### Datos Mock en Español
- **Clientes**: Nombres hispanos realistas
- **Fechas**: Formato español (es-ES)
- **Categorías**: "Zapatillas", "Casual", "Running"
- **Métricas**: "vendidos", "órdenes", "ingresos"

## 📚 Documentación Relacionada

- [Frontend E-commerce README](../../README.md)
- [Sistema de Autenticación](../../Docs/AUTH_GUIDE.md)
- [React Query Setup](../../Docs/REACT_QUERY_GUIDE.md)

---

**Dashboard Components** - Componentes modulares del dashboard administrativo 📊 