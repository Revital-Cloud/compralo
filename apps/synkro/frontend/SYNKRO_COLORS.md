# 🎨 Colores de Synkro - Guía de Uso

## Paleta de Colores Principal

### Colores Base

- **Synkro Black**: `#1c1c1c` - Negro profundo para fondos oscuros y texto
- **Synkro Green**: `#63e581` - Verde vibrante, color principal de la marca
- **Synkro White**: `#ffffff` - Blanco puro para fondos claros y texto sobre oscuro

### Variables CSS

```css
:root {
  --synkro-black: 0 0% 11%; /* #1c1c1c */
  --synkro-green: 142 64% 65%; /* #63e581 */
  --synkro-white: 0 0% 100%; /* #ffffff */
}
```

## Clases de Tailwind Disponibles

### Colores de Texto

- `text-synkro-green` - Texto verde Synkro
- `text-synkro-black` - Texto negro Synkro
- `text-synkro-white` - Texto blanco Synkro

### Fondos

- `bg-synkro-green` - Fondo verde Synkro
- `bg-synkro-black` - Fondo negro Synkro
- `bg-synkro-white` - Fondo blanco Synkro

### Bordes

- `border-synkro-green` - Borde verde Synkro
- `border-synkro-black` - Borde negro Synkro
- `border-synkro-white` - Borde blanco Synkro

### Variantes de Componentes

#### Botones

```tsx
// Botón principal Synkro
<Button variant="synkro">
  Acción Principal
</Button>

// Botón outline Synkro
<Button variant="synkroOutline">
  Acción Secundaria
</Button>
```

#### Badges

```tsx
// Badge Synkro
<Badge variant="synkro">Etiqueta</Badge>
```

## Uso en Componentes

### Header

- Logo con texto verde Synkro
- Enlaces hover en verde Synkro
- Botón CTA en verde Synkro con texto negro

### Hero Section

- Gradientes sutiles con verde Synkro
- Botón principal en verde Synkro
- Botón secundario con hover verde Synkro

### Pricing

- Badge "Más Popular" en verde Synkro
- Iconos de características en verde Synkro
- Botones usando variantes Synkro

### Contact Form

- Títulos en verde Synkro
- Labels en verde Synkro
- Bordes de inputs con verde Synkro
- Botón de envío en verde Synkro

### Footer

- Títulos de secciones en verde Synkro
- Enlaces hover en verde Synkro
- Gradiente sutil con verde Synkro

## Tema Oscuro vs Claro

### Tema Claro

- Fondo: Blanco
- Texto principal: Negro Synkro
- Acentos: Verde Synkro
- Bordes: Verde Synkro con transparencia

### Tema Oscuro

- Fondo: Negro Synkro
- Texto principal: Blanco
- Acentos: Verde Synkro
- Bordes: Verde Synkro con transparencia

## Transparencias y Opacidades

### Verde Synkro

- `bg-synkro-green/10` - 10% opacidad (fondos sutiles)
- `bg-synkro-green/20` - 20% opacidad (bordes)
- `bg-synkro-green/40` - 40% opacidad (elementos destacados)
- `bg-synkro-green/80` - 80% opacidad (hover states)
- `bg-synkro-green/90` - 90% opacidad (botones hover)

### Negro Synkro

- `bg-synkro-black/60` - 60% opacidad (overlays)
- `border-synkro-black/20` - 20% opacidad (bordes sutiles)

## Ejemplos de Implementación

### Gradientes

```css
/* Gradiente sutil con verde Synkro */
bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(142,64%,65%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]
```

### Estados de Hover

```tsx
// Enlaces con hover verde Synkro
className = "hover:text-synkro-green transition-colors duration-200";

// Botones con hover verde Synkro
className = "hover:bg-synkro-green/10 hover:text-synkro-green";
```

### Focus States

```tsx
// Inputs con focus verde Synkro
className = "focus:border-synkro-green focus:ring-synkro-green/20";
```

## Consistencia Visual

### Principios de Diseño

1. **Verde Synkro** para elementos de acción y acentos
2. **Negro Synkro** para texto principal y fondos oscuros
3. **Blanco** para fondos claros y texto sobre oscuro
4. **Transparencias** para crear profundidad y sutileza

### Jerarquía Visual

1. **Títulos principales**: Verde Synkro
2. **Subtítulos**: Verde Synkro o Negro/Blanco según tema
3. **Texto de cuerpo**: Negro/Blanco según tema
4. **Enlaces**: Verde Synkro con hover
5. **Botones**: Verde Synkro para primarios, outline para secundarios

## Accesibilidad

### Contraste

- Verde Synkro (#63e581) sobre Negro Synkro (#1c1c1c): ✅ Excelente contraste
- Verde Synkro (#63e581) sobre Blanco (#ffffff): ✅ Buen contraste
- Negro Synkro (#1c1c1c) sobre Verde Synkro (#63e581): ✅ Excelente contraste

### Estados de Focus

- Todos los elementos interactivos tienen focus visible en verde Synkro
- Los botones mantienen contraste en todos los estados

---

**Nota**: Esta guía debe mantenerse actualizada conforme se agreguen nuevos componentes o se modifiquen los colores existentes.
