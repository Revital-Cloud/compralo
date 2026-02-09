# Footer Atomizado 📄

**Footer modular con soporte para CMS headless y dark mode**

El componente `footer.tsx` ha sido atomizado en componentes más pequeños para facilitar el mantenimiento, integración con CMS headless y soporte completo para dark mode.

## Estructura

```
footer/
├── components/
│   ├── newsletter-section.tsx   # Sección de suscripción al newsletter
│   ├── about-section.tsx        # Sección "Acerca de nosotros"
│   ├── categories-section.tsx   # Secciones de categorías reutilizable
│   ├── social-section.tsx       # Redes sociales
│   ├── features-section.tsx     # Características del servicio
│   ├── payment-methods.tsx      # Métodos de pago
│   ├── legal-links.tsx          # Enlaces legales
│   ├── copyright-section.tsx    # Copyright y "Hecho por revital"
│   └── index.ts                # Exportaciones centralizadas
├── footer.tsx                  # Componente principal
└── README.md                   # Esta documentación
```

## Componentes

### NewsletterSection
- Sección de suscripción con validación de email
- Soporte para callbacks personalizados
- Gradientes adaptativos para dark mode

### AboutSection
- Información de la empresa configurable
- Información de contacto (teléfono, email, dirección)
- Iconos con fondo adaptativo al tema

### CategoriesSection
- Componente reutilizable para diferentes grupos de enlaces
- Acepta arrays de categorías personalizables
- Hover states adaptativos

### SocialSection
- Enlaces a redes sociales configurables
- Iconos con colores hover específicos por plataforma
- Accesibilidad completa con aria-labels

### FeaturesSection
- Características destacadas del servicio
- Iconos coloridos con backgrounds temáticos
- Grid responsivo

### PaymentMethods
- Métodos de pago visualizados como badges
- Colores personalizables por método
- Tooltips informativos

### LegalLinks
- Enlaces legales estándar
- Estructura responsiva
- Estados hover adaptativos

### CopyrightSection
- Copyright dinámico con año actual
- Texto personalizable "Hecho por revital"
- Estructura responsive

## Características de Dark Mode

- ✅ Colores de texto adaptativos (`dark:text-gray-400`)
- ✅ Fondos de componentes adaptativos (`dark:bg-gray-950`)
- ✅ Separadores adaptativos (`dark:bg-gray-600`)
- ✅ Estados hover consistentes en ambos temas
- ✅ Gradientes adaptativos en newsletter
- ✅ Iconos con fondos temáticos

## Beneficios de la Atomización

1. **Modularidad**: Cada sección es independiente y configurable
2. **CMS Headless**: Fácil integración con sistemas de gestión de contenido
3. **Dark Mode**: Soporte completo para temas claro y oscuro
4. **Reutilización**: Componentes reutilizables en diferentes contextos
5. **Mantenimiento**: Cambios aislados por componente
6. **Performance**: Code splitting más granular
7. **Testing**: Testing unitario más fácil por componente

## Uso

```tsx
import Footer from './footer'

// Uso básico
<Footer />

// Con callback de newsletter
<Footer onNewsletterSubscribe={(email) => console.log(email)} />

// O importar componentes individuales
import { NewsletterSection, AboutSection } from './components'
```

## Personalización

Cada componente acepta props para personalización:

```tsx
// Newsletter personalizado
<NewsletterSection onSubscribe={handleSubscription} />

// About section personalizada
<AboutSection 
  title="Nuestra empresa"
  description="Descripción personalizada"
  contact={{
    phone: "+1 234-567-8900",
    email: "info@empresa.com", 
    address: "Dirección personalizada"
  }}
/>

// Categorías personalizadas
<CategoriesSection 
  title="Mis categorías"
  categories={[
    { label: "Categoría 1", href: "/cat1" },
    { label: "Categoría 2", href: "/cat2" }
  ]}
/>
```

## 📚 Documentación Relacionada

- [Frontend E-commerce README](../../../../README.md)
- [Componentes de Layout](../README.md)
- [Sistema de Dark Mode](../../../../Docs/DARK_MODE_IMPLEMENTATION.md)

---

**Footer Components** - Footer modular y configurable 📄 