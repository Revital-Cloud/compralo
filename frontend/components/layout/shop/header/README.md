# Header Atomizado

El componente `header.tsx` ha sido atomizado en componentes más pequeños para facilitar el mantenimiento y la integración con CMS headless.

## Estructura

```
header/
├── components/
│   ├── chevron-icon.tsx     # Icono de flecha para dropdowns
│   ├── navigation.tsx       # Navegación principal
│   ├── mobile-menu.tsx      # Menú móvil
│   ├── theme-toggle.tsx     # Toggle de tema claro/oscuro
│   ├── search-bar.tsx       # Barra de búsqueda
│   ├── cart-button.tsx      # Botón del carrito
│   ├── user-menu.tsx        # Menú de usuario
│   └── index.ts            # Exportaciones centralizadas
├── header.tsx              # Componente principal
└── README.md              # Esta documentación
```

## Componentes

### ChevronIcon
Icono simple para indicar dropdowns en la navegación.

### Navigation
Navegación principal con soporte para menús desplegables. Recibe items del tipo `NavItem[]`.

### MobileMenu
Menú desplegable para dispositivos móviles con animaciones de Framer Motion.

### ThemeToggle
Botón para alternar entre modo claro y oscuro con animaciones.

### SearchBar
Barra de búsqueda con funcionalidad de envío de formulario.

### CartButton
Botón del carrito con badge para mostrar cantidad de productos.

### UserMenu
Menú desplegable de usuario con opciones de perfil e inicio de sesión.

## Beneficios de la Atomización

1. **Mantenimiento**: Cada componente es independiente y fácil de mantener
2. **Reutilización**: Los componentes pueden reutilizarse en otras partes de la aplicación
3. **Testing**: Más fácil hacer testing unitario de cada componente
4. **CMS Headless**: Facilita la integración con sistemas de gestión de contenido
5. **Performance**: Permite lazy loading y code splitting más granular
6. **Desarrollo**: Equipos pueden trabajar en paralelo en diferentes componentes

## Uso

```tsx
import EcommerceHeader from './header'

// O importar componentes individuales
import { Navigation, SearchBar, CartButton } from './components'
``` 