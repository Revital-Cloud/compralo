# Hero Carousel Atomizado 🎠

**Carousel hero modular con soporte para CMS headless y dark mode**

El componente `hero.tsx` ha sido atomizado en componentes más pequeños para facilitar el mantenimiento, integración con CMS headless y soporte completo para dark mode.

## Estructura

```
hero/
├── components/
│   ├── product-badge.tsx        # Badge del producto (ofertas, etiquetas)
│   ├── product-info.tsx         # Información básica del producto
│   ├── product-pricing.tsx      # Precios y descuentos
│   ├── product-actions.tsx      # Botones de acción (comprar, wishlist)
│   ├── product-features.tsx     # Características destacadas
│   ├── product-image.tsx        # Imagen principal del producto
│   ├── product-thumbnails.tsx   # Miniaturas del producto
│   ├── navigation-buttons.tsx   # Botones de navegación del carousel
│   ├── slide-indicators.tsx     # Indicadores de slide
│   ├── product-counter.tsx      # Contador de productos
│   └── index.ts                # Exportaciones centralizadas
├── hero.tsx                    # Componente principal del carousel
└── README.md                   # Esta documentación
```

## Componentes

### ProductBadge
- Badge personalizable con icono y texto
- Soporte para diferentes variantes
- Backdrop blur y transparencias

### ProductInfo
- Título y subtítulo del producto
- Tipografía responsiva y adaptativa
- Colores de texto configurables

### ProductPricing
- Precios actuales y originales
- Cálculo automático de descuentos
- Badges de ahorro dinámicos

### ProductActions
- Botones de "Comprar" y "Agregar a lista de deseos"
- Callbacks configurables
- Estilos adaptativos para dark mode

### ProductFeatures
- Lista de características destacadas
- Iconos personalizables
- Diseño horizontal responsivo

### ProductImage
- Imagen principal con efectos flotantes
- Soporte para placeholder
- Animaciones hover y transiciones

### ProductThumbnails
- Galería de miniaturas seleccionables
- Estados activos y hover
- Anillos de selección adaptativos

### NavigationButtons
- Botones de navegación izquierda/derecha
- Control de autoplay al hover
- Backdrop blur y transparencias

### SlideIndicators
- Indicadores de posición del slide
- Estados activos dinámicos
- Navegación directa a slides

### ProductCounter
- Contador "X / Y" de productos
- Posicionamiento absoluto
- Backdrop blur adaptativo

## Características de Dark Mode

- ✅ Gradientes adaptativos (`dark:from-gray-800`)
- ✅ Badges con colores temáticos
- ✅ Botones con estados dark mode
- ✅ Transparencias adaptativas
- ✅ Indicadores con colores azules en dark mode
- ✅ Miniaturas con anillos azules
- ✅ Elementos flotantes adaptativos

## Beneficios de la Atomización

1. **CMS Headless Ready**: Cada componente es configurable independientemente
2. **Dark Mode Nativo**: Soporte completo para temas claro y oscuro
3. **Callbacks Personalizables**: Eventos manejables desde el componente padre
4. **Productos Configurables**: Array de productos personalizable
5. **Intervalos Ajustables**: Autoplay configurable
6. **Estilos Modulares**: Cada componente con sus propios estilos
7. **Testing Granular**: Testing unitario por componente
8. **Performance**: Code splitting más eficiente

## Uso

```tsx
import EcommerceHeroCarousel from './hero'

// Uso básico
<EcommerceHeroCarousel />

// Con configuraciones personalizadas
<EcommerceHeroCarousel 
  products={customProducts}
  autoPlayInterval={8000}
  onShopNow={(product) => handleShopNow(product)}
  onAddToWishlist={(product) => handleWishlist(product)}
  className="custom-hero-styles"
/>

// Componentes individuales para layouts personalizados
import { ProductInfo, ProductPricing, ProductActions } from './components'
```

## Configuración para CMS Headless

```tsx
// Ejemplo de datos desde CMS
const cmsProducts = [
  {
    id: 1,
    name: "Producto desde CMS",
    subtitle: "Descripción desde el CMS",
    price: "$99.99",
    originalPrice: "$129.99",
    badge: "Oferta CMS",
    mainImage: cmsImageUrl,
    thumbnails: cmsImageArray,
    backgroundColor: "from-blue-500 to-purple-600",
    textColor: "text-white"
  }
]

<EcommerceHeroCarousel 
  products={cmsProducts}
  onShopNow={(product) => router.push(`/products/${product.id}`)}
  onAddToWishlist={(product) => addToWishlist(product.id)}
/>
```

## Props Principales

| Prop | Tipo | Descripción | Default |
|------|------|-------------|---------|
| `products` | `Product[]` | Array de productos a mostrar | Default products |
| `autoPlayInterval` | `number` | Intervalo de autoplay en ms | 6000 |
| `onShopNow` | `(product) => void` | Callback al hacer clic en "Shop Now" | undefined |
| `onAddToWishlist` | `(product) => void` | Callback al agregar a wishlist | undefined |
| `className` | `string` | Clases CSS adicionales | "" |

## Responsive Design

- **Mobile**: Layout vertical con imágenes adaptadas
- **Tablet**: Grid responsivo con espaciado optimizado
- **Desktop**: Layout completo de 2 columnas
- **Navegación**: Botones ocultos en mobile, indicadores siempre visibles

El hero carousel ahora es completamente modular, compatible con CMS headless y tiene soporte nativo para dark mode, manteniendo toda la funcionalidad original pero con una arquitectura mucho más escalable y mantenible.

## 📚 Documentación Relacionada

- [Frontend E-commerce README](../../../../README.md)
- [Componentes de Layout](../README.md)
- [Sistema de Dark Mode](../../../../Docs/DARK_MODE_IMPLEMENTATION.md)

---

**Hero Carousel** - Carousel hero modular y escalable 🎠 