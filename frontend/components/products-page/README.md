# Products Page Components

Esta carpeta contiene todos los componentes modulares de la página de productos de Synkro.

## 🏗️ Estructura

```
products-page/
├── index.ts                 # Exports centralizados
├── products-header.tsx      # Header con título, contador y controles
├── products-filters.tsx     # Panel lateral de filtros
├── products-display.tsx     # Visualización de productos con filtrado
└── README.md               # Esta documentación
```

## 📊 Componentes

### ProductsHeader
Header de la página con título, contador de productos, ordenamiento y vista.

```tsx
<ProductsHeader
  productsData={productsData}
  productsLoading={productsLoading}
  productsError={productsError}
  sortBy={sortBy}
  setSortBy={setSortBy}
  viewMode={viewMode}
  setViewMode={setViewMode}
  showFilters={showFilters}
  setShowFilters={setShowFilters}
  activeFiltersCount={activeFiltersCount}
/>
```

### ProductsFilters
Panel lateral con todos los filtros disponibles.

```tsx
<ProductsFilters
  showFilters={showFilters}
  setShowFilters={setShowFilters}
  priceRange={priceRange}
  setPriceRange={setPriceRange}
  selectedCategories={selectedCategories}
  setSelectedCategories={setSelectedCategories}
  inStockOnly={inStockOnly}
  setInStockOnly={setInStockOnly}
  onSaleOnly={onSaleOnly}
  setOnSaleOnly={setOnSaleOnly}
  categoriesData={categoriesData}
  categoriesLoading={categoriesLoading}
  activeFiltersCount={activeFiltersCount}
  clearAllFilters={clearAllFilters}
  applyFilters={applyFilters}
/>
```

### ProductsDisplay
Visualización principal de productos con filtrado y paginación.

```tsx
<ProductsDisplay
  productsData={productsData}
  productsLoading={productsLoading}
  productsError={productsError}
  viewMode={viewMode}
  priceRange={priceRange}
  selectedCategories={selectedCategories}
  inStockOnly={inStockOnly}
  onSaleOnly={onSaleOnly}
/>
```

## 🔍 Funcionalidades de Filtrado

### Filtros Disponibles:
- **Rango de Precio**: Slider con valores de $0 a $10,000
- **Categorías**: Checkboxes dinámicos desde el API
- **Disponibilidad**: Solo en stock y solo en oferta

### Características:
- **Filtrado en tiempo real** sin recargar página
- **Contador de filtros activos** con badges informativos
- **Indicador de productos filtrados** vs total
- **Responsive design** para móvil y desktop
- **Helper de precio integrado** usando `formatPrice`

## 🎯 Ventajas de la Refactorización

### ✅ Antes (componentes en app/products/components)
- Componentes específicos de la página
- Difícil reutilización en otras páginas
- Estructura menos organizada

### ✅ Después (componentes en components/products-page)
- **Componentes reutilizables** en otras páginas
- **Mejor organización** en la carpeta principal de componentes
- **Fácil testing** y mantenimiento
- **Separación clara** de responsabilidades

## 📱 Responsive Design

Todos los componentes son completamente responsive:
- **Desktop**: Panel de filtros fijo en el lado derecho
- **Tablet**: Layout adaptable
- **Mobile**: Filtros ocultos por defecto, botón para mostrar/ocultar

## 🎨 UI/UX

- **Loading states** en todos los componentes
- **Error handling** con mensajes informativos
- **Filtros activos** con badges informativos
- **Contador de productos** en tiempo real
- **Vista grid/list** intercambiable
- **Ordenamiento** por múltiples criterios

## 🚀 Próximos Pasos

1. **Conectar backend real** para filtrado
2. **Tests unitarios** para cada componente
3. **Storybook** para documentación visual
4. **Caching** con React Query
5. **Filtros avanzados** (marca, rating, etc.)

## 📝 Uso

```tsx
import {
  ProductsHeader,
  ProductsFilters,
  ProductsDisplay
} from '@/components/products-page'

// También se pueden importar individualmente:
import { ProductsHeader } from '@/components/products-page/products-header'
```

Esta refactorización mejora significativamente la mantenibilidad, escalabilidad y reutilización de los componentes de la página de productos.
