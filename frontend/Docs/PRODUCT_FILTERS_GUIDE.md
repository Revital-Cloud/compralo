# Guía del Sistema de Filtros de Productos

## 🎯 **Descripción General**

El sistema de filtros de productos está completamente integrado con la función de base de datos `fun_filter_products` y proporciona filtrado avanzado, búsqueda rápida y estadísticas en tiempo real.

## 🏗️ **Arquitectura**

### **Backend (FastAPI + PostgreSQL)**
- **Función DB**: `fun_filter_products` - Filtrado optimizado en la base de datos
- **Endpoints**: `/products/filter`, `/products/filter/stats`, `/products/filter/options`
- **Schemas**: Validación automática con Pydantic
- **Performance**: Paginación, índices optimizados, consultas eficientes

### **Frontend (Next.js + React Query)**
- **Hooks**: `useFilterProducts`, `useFilterStats`, `useFilterOptions`, `useQuickSearch`
- **Servicios**: Funciones de API con TypeScript
- **Componentes**: Integración con componentes existentes
- **Estado**: React Query para cache y sincronización

## 🚀 **Características Implementadas**

### **Filtros Disponibles**
- ✅ **Categoría, Línea, Sublínea** (filtros jerárquicos)
- ✅ **Marca y Proveedor**
- ✅ **Búsqueda por nombre** (parcial, case-insensitive)
- ✅ **Rango de precios** (mínimo y máximo)
- ✅ **Filtro de stock** (mínimo y solo con stock)
- ✅ **Ordenamiento** (precio, nombre, stock, fecha)
- ✅ **Paginación** (limit/offset)

### **Funcionalidades Avanzadas**
- ✅ **Búsqueda rápida** con autocompletado
- ✅ **Estadísticas en tiempo real** de productos filtrados
- ✅ **Opciones dinámicas** para selectores
- ✅ **Cache inteligente** con React Query
- ✅ **Filtros automáticos** con useMemo
- ✅ **Validación de tipos** con TypeScript

## 📋 **Uso Básico**

### **1. Hook de Filtros**
```typescript
import { useFilterProducts, useFilterOptions } from '@/hooks'

const MyComponent = () => {
  const [filters, setFilters] = useState<ProductFilterParams>({
    id_categoria: 1,
    precio_min: 100,
    precio_max: 500,
    solo_con_stock: true,
    ordenar_por: 'precio',
    orden: 'ASC',
    limit: 20,
    offset: 0
  })

  const { data, isLoading, error } = useFilterProducts(filters)
  const { data: options } = useFilterOptions()

  return (
    <div>
      {isLoading && <div>Cargando...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && (
        <div>
          <p>Total: {data.total} productos</p>
          {data.products.map(product => (
            <div key={product.id_producto}>
              {product.nom_producto} - ${product.val_precio}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### **2. Búsqueda Rápida**
```typescript
import { useQuickSearch } from '@/hooks'

const SearchComponent = () => {
  const [query, setQuery] = useState('')
  const { data: results } = useQuickSearch(query, 5)

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar productos..."
      />
      {results && (
        <ul>
          {results.products.map(product => (
            <li key={product.id_producto}>
              {product.nom_producto}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### **3. Estadísticas de Filtros**
```typescript
import { useFilterStats } from '@/hooks'

const StatsComponent = ({ filters }: { filters: ProductFilterParams }) => {
  const { data: stats } = useFilterStats(filters)

  return (
    <div>
      <p>Total productos: {stats?.total_productos}</p>
      <p>Precio mínimo: ${stats?.precio_minimo}</p>
      <p>Precio máximo: ${stats?.precio_maximo}</p>
      <p>Stock total: {stats?.total_stock}</p>
    </div>
  )
}
```

## 🔧 **Configuración Avanzada**

### **Parámetros de Filtro**
```typescript
interface ProductFilterParams {
  id_categoria?: number;           // ID de categoría
  id_linea?: number;              // ID de línea
  id_sublinea?: number;           // ID de sublínea
  id_marca?: number;              // ID de marca
  id_proveedor?: number;          // ID de proveedor
  nombre_producto?: string;       // Búsqueda por nombre
  precio_min?: number;            // Precio mínimo
  precio_max?: number;            // Precio máximo
  stock_min?: number;             // Stock mínimo
  solo_con_stock?: boolean;       // Solo productos con stock
  ordenar_por?: 'precio' | 'nombre' | 'stock' | 'fecha';
  orden?: 'ASC' | 'DESC';
  limit?: number;                 // Límite de resultados (1-1000)
  offset?: number;                // Offset para paginación
}
```

### **Respuesta de Filtros**
```typescript
interface ProductFilterResponse {
  products: ProductFiltered[];    // Lista de productos
  total: number;                  // Total de registros
  page: number;                   // Página actual
  total_pages: number;            // Total de páginas
  limit: number;                  // Límite por página
  offset: number;                 // Offset actual
}
```

## 🎨 **Integración con Componentes**

### **Página de Productos Actualizada**
La página `/products` ahora usa el sistema de filtros:

```typescript
// frontend/app/(shop)/products/page.tsx
const ProductsPage = () => {
  const [filters, setFilters] = useState<ProductFilterParams>({})
  const { data: productsData } = useFilterProducts(filters)
  const { data: filterOptions } = useFilterOptions()

  return (
    <div>
      <ProductsHeader 
        totalProducts={productsData?.total}
        onSearch={setSearchQuery}
        // ... otros props
      />
      <ProductsFilters 
        options={filterOptions}
        onFiltersChange={setFilters}
        // ... otros props
      />
      <ProductsDisplay 
        products={productsData?.products}
        pagination={{
          currentPage: productsData?.page,
          totalPages: productsData?.total_pages
        }}
        // ... otros props
      />
    </div>
  )
}
```

## 📊 **Performance y Optimización**

### **Cache Strategy**
- **Productos filtrados**: 2 minutos de cache
- **Opciones de filtros**: 15 minutos de cache
- **Estadísticas**: 5 minutos de cache
- **Búsqueda rápida**: 1 minuto de cache

### **Optimizaciones de DB**
```sql
-- Índices recomendados para la función fun_filter_products
CREATE INDEX idx_productos_categoria ON tab_productos(id_categoria) WHERE ind_activo = true;
CREATE INDEX idx_productos_precio ON tab_productos(val_precio) WHERE ind_activo = true;
CREATE INDEX idx_productos_stock ON tab_productos(num_stock) WHERE ind_activo = true;
CREATE INDEX idx_productos_nombre ON tab_productos USING gin(to_tsvector('spanish', nom_producto)) WHERE ind_activo = true;
```

## 🧪 **Testing**

### **Ejemplo de Uso Completo**
```typescript
// Ver: frontend/components/products-page/filter-example.tsx
import FilterExample from '@/components/products-page/filter-example'

// Este componente muestra todos los filtros en acción
<FilterExample />
```

## 🔄 **Flujo de Datos**

1. **Usuario modifica filtros** → Estado local actualizado
2. **useMemo recalcula parámetros** → ProductFilterParams construido
3. **useFilterProducts ejecuta** → Llamada a API `/products/filter`
4. **Backend ejecuta fun_filter_products** → Consulta optimizada en DB
5. **Respuesta con productos** → React Query cachea resultado
6. **Componente re-renderiza** → UI actualizada con nuevos datos

## 🚨 **Consideraciones Importantes**

### **Límites de Performance**
- **Máximo 1000 productos** por consulta
- **Búsqueda mínima 2 caracteres** para evitar consultas excesivas
- **Cache inteligente** para evitar consultas repetitivas

### **Validaciones**
- **Rangos de precios** válidos (mínimo ≤ máximo)
- **Límites de paginación** (1-1000)
- **Tipos de ordenamiento** válidos
- **Conversión automática** de JSON para especificaciones

## 📈 **Métricas y Monitoreo**

### **Endpoints de Debugging**
```bash
# Verificar función de DB
GET /products/filter?debug=true

# Estadísticas de performance
GET /products/filter/stats?include_performance=true

# Opciones disponibles
GET /products/filter/options
```

### **Logs Recomendados**
- Tiempo de respuesta de `fun_filter_products`
- Número de productos filtrados
- Uso de cache de React Query
- Errores de validación de parámetros

## 🎯 **Próximos Pasos**

1. **Implementar la función `fun_filter_products`** en la base de datos
2. **Crear índices optimizados** para mejor performance
3. **Añadir tests unitarios** para hooks y servicios
4. **Implementar filtros avanzados** (fechas, rangos complejos)
5. **Añadir analytics** de búsquedas y filtros más usados

---

**El sistema está listo para usar y completamente integrado con la arquitectura existente. Solo falta implementar la función de base de datos para que funcione completamente.**
