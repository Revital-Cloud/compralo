# 🎯 Sistema Universal de Filtros - Guía de Uso

## 📋 Descripción

El **UniversalFilters** es un componente completamente reutilizable para implementar filtros en cualquier lista o tabla de la aplicación. Diseñado para ser flexible, responsive y fácil de configurar.

## ✨ Características

- ✅ **Completamente Reutilizable** - Úsalo en productos, categorías, líneas, sublíneas, marcas, proveedores
- ✅ **Responsive** - Se adapta perfectamente a móvil, tablet y desktop
- ✅ **Filtros Dinámicos** - Configura qué filtros mostrar según tu necesidad
- ✅ **Búsqueda Integrada** - Campo de búsqueda con icono incorporado
- ✅ **Ordenamiento** - Soporte para ordenamiento ASC/DESC
- ✅ **Estadísticas de Stock** - Badges opcionales para mostrar estado de inventario
- ✅ **TypeScript** - Completamente tipado
- ✅ **Dark Mode** - Soporte completo para tema oscuro

## 🚀 Uso Básico

### 1. Importar el Componente

```typescript
import { UniversalFilters } from '@/components/ui/universal-filters';
import { FilterConfig, SortOption } from '@/types/filters';
```

### 2. Configurar Filtros

```typescript
const filters: FilterConfig[] = [
  {
    id: 'category',
    label: 'Categoría',
    type: 'select',
    value: categoryValue,
    onChange: handleCategoryChange,
    options: categories,
    isLoading: loadingCategories
  },
  // ... más filtros
];

const sortOptions: SortOption[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'precio', label: 'Precio' },
  { value: 'stock', label: 'Stock' }
];
```

### 3. Usar el Componente

```tsx
<UniversalFilters
  title="Filtros de Productos"
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Buscar producto..."
  filters={filters}
  sortBy={sortBy}
  onSortByChange={setSortBy}
  sortOrder={sortOrder}
  onSortOrderChange={setSortOrder}
  sortOptions={sortOptions}
  totalResults={totalProducts}
  onClearFilters={handleClearFilters}
  hasActiveFilters={hasFilters}
  showStockBadges={true}
  stockStats={stockStats}
  showTotalResults={true}
  compact={true}
/>
```

## 📦 Props del Componente

### Búsqueda
- `searchValue?: string` - Valor del campo de búsqueda
- `onSearchChange?: (value: string) => void` - Callback al cambiar búsqueda
- `searchPlaceholder?: string` - Placeholder del campo de búsqueda

### Filtros Dinámicos
- `filters?: FilterConfig[]` - Array de configuraciones de filtros

### Ordenamiento
- `sortBy?: string` - Campo actual de ordenamiento
- `onSortByChange?: (value: string) => void` - Callback al cambiar ordenamiento
- `sortOrder?: 'ASC' | 'DESC'` - Dirección del ordenamiento
- `onSortOrderChange?: (order: 'ASC' | 'DESC') => void` - Callback al cambiar dirección
- `sortOptions?: SortOption[]` - Opciones de ordenamiento disponibles

### Estadísticas (Opcional)
- `stockStats?: StockStats` - Estadísticas de stock para badges
- `totalResults?: number` - Total de resultados

### Acciones
- `onClearFilters?: () => void` - Callback para limpiar filtros
- `hasActiveFilters?: boolean` - Indica si hay filtros activos

### Personalización
- `title?: string` - Título del componente (default: "Filtros")
- `showStockBadges?: boolean` - Mostrar badges de stock (default: false)
- `showTotalResults?: boolean` - Mostrar total de resultados (default: true)
- `compact?: boolean` - Modo compacto (default: true)

## 📝 Tipos de Filtros Disponibles

### Select (Desplegable)
```typescript
{
  id: 'category',
  label: 'Categoría',
  type: 'select',
  value: selectedCategory,
  onChange: setSelectedCategory,
  options: [
    { id: '1', nombre: 'Categoría 1' },
    { id: '2', nombre: 'Categoría 2' }
  ],
  isLoading: false
}
```

### Search (Búsqueda)
```typescript
{
  id: 'custom-search',
  label: 'Búsqueda Personalizada',
  type: 'search',
  value: searchValue,
  onChange: setSearchValue,
  placeholder: 'Buscar...'
}
```

## 🎨 Ejemplos de Uso

### Productos (Con Stock Badges)
```tsx
<UniversalFilters
  title="Filtros de Productos"
  searchValue={search}
  onSearchChange={setSearch}
  filters={productFilters}
  stockStats={{
    enStock: 50,
    stockBajo: 10,
    sinStock: 5
  }}
  showStockBadges={true}
  // ... resto de props
/>
```

### Categorías (Simple)
```tsx
<UniversalFilters
  title="Filtros de Categorías"
  searchValue={search}
  onSearchChange={setSearch}
  filters={[]} // Sin filtros adicionales
  sortBy={sortBy}
  onSortByChange={setSortBy}
  showStockBadges={false}
  // ... resto de props
/>
```

### Líneas (Con Filtro de Categoría)
```tsx
const filters: FilterConfig[] = [
  {
    id: 'category',
    label: 'Categoría',
    type: 'select',
    value: categoryFilter,
    onChange: setCategoryFilter,
    options: categories
  }
];

<UniversalFilters
  title="Filtros de Líneas"
  searchValue={search}
  onSearchChange={setSearch}
  filters={filters}
  // ... resto de props
/>
```

## 🎯 Componentes Pre-construidos

Ya están disponibles componentes de filtros listos para usar:

- `ProductsFilters` - Para productos (con stock badges y todos los filtros)
- `CategoriesFilters` - Para categorías (solo búsqueda y ordenamiento)
- `BrandsFilters` - Para marcas (solo búsqueda y ordenamiento)
- `LinesFilters` - Para líneas (con filtro de categoría)
- `ProvidersFilters` - Para proveedores (solo búsqueda y ordenamiento)

### Uso de Componentes Pre-construidos

```tsx
import { ProductsFilters } from '@/components/admin/products/products-filters';

<ProductsFilters
  search={search}
  onSearchChange={setSearch}
  sortBy={sortBy}
  onSortByChange={setSortBy}
  sortOrder={sortOrder}
  onSortOrderChange={setSortOrder}
  category={category}
  onCategoryChange={setCategory}
  // ... resto de props
/>
```

## 🌈 Personalización con Clases

El componente usa Tailwind CSS y es completamente personalizable mediante las clases existentes. Los estados de dark mode están incorporados.

## 📱 Responsive Breakpoints

- **Mobile**: 1 columna
- **sm**: 2 columnas  
- **lg**: 3 columnas
- **xl**: 4 columnas
- **2xl**: 6 columnas

## 🔧 Mejoras Futuras

Posibles extensiones del componente:

- [ ] Filtros de rango de fechas
- [ ] Filtros de rango numérico (precio, stock)
- [ ] Multiselect para filtros
- [ ] Filtros con autocompletado
- [ ] Guardar configuraciones de filtros
- [ ] Exportar/Importar configuraciones

## 💡 Tips

1. **Usa `useMemo`** para calcular `hasActiveFilters` y evitar re-renders innecesarios
2. **Configura solo los filtros necesarios** - No todos los componentes necesitan todos los filtros
3. **Aprovecha los tipos TypeScript** - Te ayudarán a evitar errores
4. **Personaliza los `sortOptions`** según la entidad que estés filtrando

## 🐛 Troubleshooting

**Problema**: Los filtros no se muestran
- Verifica que el array `filters` tenga elementos
- Asegúrate de que los tipos sean correctos

**Problema**: El ordenamiento no funciona
- Verifica que `onSortByChange` y `onSortOrderChange` estén definidos
- Asegúrate de que `sortOptions` tenga elementos

**Problema**: Los badges de stock no aparecen
- Verifica que `showStockBadges={true}`
- Asegúrate de pasar `stockStats` con la estructura correcta

## 📚 Recursos

- Ver tipos en: `frontend/types/filters.ts`
- Ver componente en: `frontend/components/ui/universal-filters.tsx`
- Ver ejemplos en: `frontend/components/admin/*/` 

