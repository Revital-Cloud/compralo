# Secciones de la Tienda - Componentes Configurables

Este directorio contiene los componentes principales de la tienda que pueden ser habilitados o deshabilitados mediante variables de entorno.

## 🚀 Secciones Disponibles

### 1. New Drops Section (`/new-drops/`)
Sección que muestra los productos más nuevos con carrusel y navegación.

**Características:**
- Carrusel de productos con navegación
- Badges de "NEW" en productos
- Sistema de ratings con estrellas
- Precios con descuentos
- Responsive design
- Botones de acción personalizables

**Variable de entorno:**
```env
NEXT_PUBLIC_SHOW_NEW_DROPS=true
```

### 2. Categories Section (`/categories/`)
Sección que muestra las categorías principales de productos.

**Características:**
- Grid responsivo de categorías
- Navegación con flechas y dots
- Contador de productos por categoría
- Badges de categorías destacadas
- Efectos hover y transiciones
- Diseño dark theme

**Variable de entorno:**
```env
NEXT_PUBLIC_SHOW_CATEGORIES=true
```

## ⚙️ Configuración

### Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto frontend con las siguientes variables:

```env
# Configuración de secciones de la tienda
NEXT_PUBLIC_SHOW_NEW_DROPS=true
NEXT_PUBLIC_SHOW_CATEGORIES=true

# Configuración de la API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Configuración opcional de la tienda
NEXT_PUBLIC_STORE_NAME="Mi Tienda"
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_CURRENCY_SYMBOL=$
NEXT_PUBLIC_PRODUCTS_PER_PAGE=12

# Features opcionales
NEXT_PUBLIC_ENABLE_WISHLIST=true
NEXT_PUBLIC_ENABLE_REVIEWS=true
NEXT_PUBLIC_ENABLE_SEARCH=true
NEXT_PUBLIC_ENABLE_FILTERS=true
NEXT_PUBLIC_ENABLE_COMPARISON=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

### Uso en Desarrollo

1. **Mostrar todas las secciones:**
   ```env
   NEXT_PUBLIC_SHOW_NEW_DROPS=true
   NEXT_PUBLIC_SHOW_CATEGORIES=true
   ```

2. **Ocultar sección New Drops:**
   ```env
   NEXT_PUBLIC_SHOW_NEW_DROPS=false
   NEXT_PUBLIC_SHOW_CATEGORIES=true
   ```

3. **Ocultar sección Categories:**
   ```env
   NEXT_PUBLIC_SHOW_NEW_DROPS=true
   NEXT_PUBLIC_SHOW_CATEGORIES=false
   ```

4. **Ocultar ambas secciones:**
   ```env
   NEXT_PUBLIC_SHOW_NEW_DROPS=false
   NEXT_PUBLIC_SHOW_CATEGORIES=false
   ```

## 🔧 Integración con la Configuración

Las secciones utilizan el sistema de configuración centralizado en `/lib/config.ts`:

```typescript
import { shouldShowSection } from "@/lib/config";

// En tu página o componente
export default function Home() {
  return (
    <div>
      {shouldShowSection('showNewDrops') && <NewDropsSection />}
      {shouldShowSection('showCategories') && <CategoriesSection />}
    </div>
  );
}
```

## 📱 Responsive Design

Ambas secciones están optimizadas para diferentes dispositivos:

- **Mobile (< 768px):** 1 columna
- **Tablet (768px - 1024px):** 2 columnas
- **Desktop (> 1024px):** 4 columnas (New Drops) / 2 columnas (Categories)

## 🎨 Personalización

### Colores y Estilos
Los componentes utilizan Tailwind CSS y pueden ser personalizados modificando las clases en cada componente.

### Datos de Productos
Los datos de ejemplo están hardcodeados. En producción, estos deben venir de la API:

```typescript
// Reemplazar los arrays de ejemplo con llamadas a la API
const { data: newProducts } = useQuery({
  queryKey: ['products', 'new'],
  queryFn: () => fetchNewProducts()
});
```

## 🚀 Deployment

### Variables de Producción
En producción, asegúrate de configurar las variables de entorno en tu plataforma de deployment:

**Vercel:**
```bash
vercel env add NEXT_PUBLIC_SHOW_NEW_DROPS
vercel env add NEXT_PUBLIC_SHOW_CATEGORIES
```

**Netlify:**
```bash
netlify env:set NEXT_PUBLIC_SHOW_NEW_DROPS true
netlify env:set NEXT_PUBLIC_SHOW_CATEGORIES true
```

## 📁 Estructura de Archivos

```
components/layout/shop/
├── new-drops/
│   ├── new-drops.tsx          # Componente principal
│   └── index.ts               # Export
├── categories/
│   ├── categories.tsx         # Componente principal
│   └── index.ts               # Export
├── hero/                      # Sección hero existente
├── header/                    # Header existente
├── footer/                    # Footer existente
└── README.md                  # Esta documentación
```

## 🔄 Próximas Mejoras

- [ ] Integración con API real
- [ ] Sistema de cache para productos
- [ ] Lazy loading de imágenes
- [ ] Animaciones más avanzadas
- [ ] Soporte para más configuraciones
- [ ] Testing unitario
- [ ] Storybook para documentación visual 