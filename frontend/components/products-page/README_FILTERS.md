# Sistema de Filtros Mejorado para Productos

## Descripción

Se ha mejorado significativamente el sistema de filtros de la página de productos para incluir filtros por categorías, líneas, sublíneas y marcas, además de los filtros existentes de precio y disponibilidad.

## Características Implementadas

### 1. Filtros de Categorización
- **Categorías**: Filtro por categorías principales de productos
- **Líneas**: Filtro por líneas de productos dentro de cada categoría
- **Sub-líneas**: Filtro por sub-líneas específicas dentro de cada línea
- **Marcas**: Filtro por marcas de productos

### 2. Filtros de Precio y Disponibilidad
- **Rango de Precio**: Slider para seleccionar rango de precios (mínimo y máximo)
- **Stock**: Opción para mostrar solo productos en stock
- **Ofertas**: Opción para mostrar solo productos en oferta

### 3. Funcionalidades Adicionales
- **Contador de Filtros Activos**: Muestra cuántos filtros están aplicados
- **Botón Limpiar**: Limpia todos los filtros seleccionados
- **Resumen de Filtros**: Muestra un resumen de los filtros activos
- **Responsive**: Funciona tanto en móvil como en desktop

## Estructura de Archivos

### Hooks Actualizados
- `frontend/hooks/use-products.ts` - Hook para productos y marcas
- `frontend/hooks/use-lines.ts` - Hook para líneas (nuevo: `useAllLines`)
- `frontend/hooks/use-sublines.ts` - Hook para sublíneas (nuevo: `useAllSublines`)

### Servicios Actualizados
- `frontend/services/line.service.ts` - Nuevo método `getAllLines()`
- `frontend/services/subline.service.ts` - Nuevo método `getAllSublines()`

### Componentes Actualizados
- `frontend/components/products-page/products-filters.tsx` - Filtros principales
- `frontend/components/products-page/products-display.tsx` - Lógica de filtrado
- `frontend/app/(shop)/products/page.tsx` - Página principal con estados

### Componente de Demostración
- `frontend/components/products-page/enhanced-filters-demo.tsx` - Ejemplo visual

## Implementación Técnica

### Estados del Componente
```typescript
const [selectedCategories, setSelectedCategories] = useState<string[]>([])
const [selectedLines, setSelectedLines] = useState<string[]>([])
const [selectedSublines, setSelectedSublines] = useState<string[]>([])
const [selectedBrands, setSelectedBrands] = useState<string[]>([])
const [priceRange, setPriceRange] = useState([0, 10000])
const [inStockOnly, setInStockOnly] = useState(false)
const [onSaleOnly, setOnSaleOnly] = useState(false)
```

### Lógica de Filtrado
```typescript
const getFilteredProducts = (products: any[]) => {
  return products.filter(product => {
    // Filtro por categoría
    if (selectedCategories.length > 0) {
      const productCategory = product.id_categoria?.toString()
      if (!productCategory || !selectedCategories.includes(productCategory)) {
        return false
      }
    }
    
    // Filtro por línea
    if (selectedLines.length > 0) {
      const productLine = product.id_linea?.toString()
      if (!productLine || !selectedLines.includes(productLine)) {
        return false
      }
    }
    
    // Filtro por sub-línea
    if (selectedSublines.length > 0) {
      const productSubline = product.id_sublinea?.toString()
      if (!productSubline || !selectedSublines.includes(productSubline)) {
        return false
      }
    }
    
    // Filtro por marca
    if (selectedBrands.length > 0) {
      const productBrand = product.id_marca?.toString()
      if (!productBrand || !selectedBrands.includes(productBrand)) {
        return false
      }
    }
    
    // Otros filtros...
    return true
  })
}
```

### Contador de Filtros Activos
```typescript
const activeFiltersCount = selectedCategories.length + 
  selectedLines.length + selectedSublines.length + selectedBrands.length +
  (inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + 
  (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0)
```

## Uso

### 1. Importar Hooks
```typescript
import { 
  useProducts, 
  useCategories, 
  useAllLines, 
  useAllSublines, 
  useBrands 
} from "@/hooks"
```

### 2. Usar Hooks en el Componente
```typescript
const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
const { data: linesData, isLoading: linesLoading } = useAllLines()
const { data: sublinesData, isLoading: sublinesLoading } = useAllSublines()
const { data: brandsData, isLoading: brandsLoading } = useBrands()
```

### 3. Pasar Props al Componente de Filtros
```typescript
<ProductsFilters
  // ... otras props
  selectedCategories={selectedCategories}
  setSelectedCategories={setSelectedCategories}
  selectedLines={selectedLines}
  setSelectedLines={setSelectedLines}
  selectedSublines={selectedSublines}
  setSelectedSublines={setSelectedSublines}
  selectedBrands={selectedBrands}
  setSelectedBrands={setSelectedBrands}
  categoriesData={categoriesData}
  categoriesLoading={categoriesLoading}
  linesData={linesData}
  linesLoading={linesLoading}
  sublinesData={sublinesData}
  sublinesLoading={sublinesLoading}
  brandsData={brandsData}
  brandsLoading={brandsLoading}
  // ... resto de props
/>
```

## Beneficios

1. **Mejor Experiencia de Usuario**: Los usuarios pueden filtrar productos de manera más específica
2. **Navegación Intuitiva**: Filtros organizados por jerarquía lógica (categoría → línea → sub-línea)
3. **Filtrado Preciso**: Combinación de múltiples filtros para resultados más relevantes
4. **Performance**: Uso de React Query para cache y optimización de consultas
5. **Responsive**: Funciona perfectamente en todos los dispositivos

## Próximas Mejoras Sugeridas

1. **Filtros Dependientes**: Hacer que las líneas se filtren según la categoría seleccionada
2. **Búsqueda en Filtros**: Agregar búsqueda dentro de cada categoría de filtros
3. **Filtros Guardados**: Permitir guardar combinaciones de filtros favoritas
4. **URL State**: Sincronizar filtros con la URL para compartir enlaces
5. **Filtros Avanzados**: Agregar filtros por rango de fechas, valoraciones, etc.

## Notas de Desarrollo

- Todos los filtros son opcionales y se pueden combinar
- El sistema maneja automáticamente los estados de carga
- Los filtros se aplican en tiempo real
- Se incluye manejo de errores y estados vacíos
- El diseño es consistente con el tema de la aplicación
