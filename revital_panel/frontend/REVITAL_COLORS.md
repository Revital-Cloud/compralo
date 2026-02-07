# 🎨 Colores de Revital - Guía de Uso

## Paleta de Colores Principal

### Colores Base

- **Revital Black**: `#1c1c1c` - Negro profundo para fondos oscuros y texto
- **Revital Green**: `#63e581` - Verde vibrante, color principal de la marca
- **Revital White**: `#ffffff` - Blanco puro para fondos claros y texto sobre oscuro

### Variables CSS

```css
:root {
  --revital-black: 0 0% 11%; /* #1c1c1c */
  --revital-green: 142 64% 65%; /* #63e581 */
  --revital-white: 0 0% 100%; /* #ffffff */
}
```

## Clases de Tailwind Disponibles

### Colores de Texto

- `text-revital-green` - Texto verde Revital
- `text-revital-black` - Texto negro Revital
- `text-revital-white` - Texto blanco Revital

### Fondos

- `bg-revital-green` - Fondo verde Revital
- `bg-revital-black` - Fondo negro Revital
- `bg-revital-white` - Fondo blanco Revital

### Bordes

- `border-revital-green` - Borde verde Revital
- `border-revital-black` - Borde negro Revital
- `border-revital-white` - Borde blanco Revital

### Variantes de Componentes

#### Botones

```tsx
// Botón principal Revital
<Button variant="revital">
  Acción Principal
</Button>

// Botón outline Revital
<Button variant="revitalOutline">
  Acción Secundaria
</Button>
```

#### Badges

```tsx
// Badge Revital
<Badge variant="revital">Etiqueta</Badge>
```

## Uso en Componentes

### Header

- Logo con texto verde Revital
- Enlaces hover en verde Revital
- Botón CTA en verde Revital con texto negro

### Hero Section

- Gradientes sutiles con verde Revital
- Botón principal en verde Revital
- Botón secundario con hover verde Revital

### Pricing

- Badge "Más Popular" en verde Revital
- Iconos de características en verde Revital
- Botones usando variantes Revital

### Contact Form

- Títulos en verde Revital
- Labels en verde Revital
- Bordes de inputs con verde Revital
- Botón de envío en verde Revital

### Footer

- Títulos de secciones en verde Revital
- Enlaces hover en verde Revital
- Gradiente sutil con verde Revital

## Tema Oscuro vs Claro

### Tema Claro

- Fondo: Blanco
- Texto principal: Negro Revital
- Acentos: Verde Revital
- Bordes: Verde Revital con transparencia

### Tema Oscuro

- Fondo: Negro Revital
- Texto principal: Blanco
- Acentos: Verde Revital
- Bordes: Verde Revital con transparencia

## Transparencias y Opacidades

### Verde Revital

- `bg-revital-green/10` - 10% opacidad (fondos sutiles)
- `bg-revital-green/20` - 20% opacidad (bordes)
- `bg-revital-green/40` - 40% opacidad (elementos destacados)
- `bg-revital-green/80` - 80% opacidad (hover states)
- `bg-revital-green/90` - 90% opacidad (botones hover)

### Negro Revital

- `bg-revital-black/60` - 60% opacidad (overlays)
- `border-revital-black/20` - 20% opacidad (bordes sutiles)

## Ejemplos de Implementación

### Gradientes

```css
/* Gradiente sutil con verde Revital */
bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(142,64%,65%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]
```

### Estados de Hover

```tsx
// Enlaces con hover verde Revital
className = "hover:text-revital-green transition-colors duration-200";

// Botones con hover verde Revital
className = "hover:bg-revital-green/10 hover:text-revital-green";
```

### Focus States

```tsx
// Inputs con focus verde Revital
className = "focus:border-revital-green focus:ring-revital-green/20";
```

## Consistencia Visual

### Principios de Diseño

1. **Verde Revital** para elementos de acción y acentos
2. **Negro Revital** para texto principal y fondos oscuros
3. **Blanco** para fondos claros y texto sobre oscuro
4. **Transparencias** para crear profundidad y sutileza

### Jerarquía Visual

1. **Títulos principales**: Verde Revital
2. **Subtítulos**: Verde Revital o Negro/Blanco según tema
3. **Texto de cuerpo**: Negro/Blanco según tema
4. **Enlaces**: Verde Revital con hover
5. **Botones**: Verde Revital para primarios, outline para secundarios

## Accesibilidad

### Contraste

- Verde Revital (#63e581) sobre Negro Revital (#1c1c1c): ✅ Excelente contraste
- Verde Revital (#63e581) sobre Blanco (#ffffff): ✅ Buen contraste
- Negro Revital (#1c1c1c) sobre Verde Revital (#63e581): ✅ Excelente contraste

### Estados de Focus

- Todos los elementos interactivos tienen focus visible en verde Revital
- Los botones mantienen contraste en todos los estados

---

**Nota**: Esta guía debe mantenerse actualizada conforme se agreguen nuevos componentes o se modifiquen los colores existentes.
