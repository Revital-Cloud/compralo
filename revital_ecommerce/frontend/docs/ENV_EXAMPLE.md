# Configuración de Variables de Entorno

Para configurar las secciones de la tienda, crea un archivo `.env.local` en la raíz del proyecto frontend (`/frontend/.env.local`) con el siguiente contenido:

## 📋 Variables Requeridas

```env
# =============================================================================
# CONFIGURACIÓN DE SECCIONES DE LA TIENDA
# =============================================================================

# Mostrar/ocultar sección "Don't Miss Out New Drops"
# Valores: true | false
NEXT_PUBLIC_SHOW_NEW_DROPS=true

# Mostrar/ocultar sección "Categories"
# Valores: true | false  
NEXT_PUBLIC_SHOW_CATEGORIES=true

# =============================================================================
# CONFIGURACIÓN DE LA API
# =============================================================================

# URL base de la API del backend
# En desarrollo: http://localhost:8000/api/v1
# En producción: https://tu-dominio.com/api/v1
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# =============================================================================
# CONFIGURACIÓN DE LA TIENDA (OPCIONAL)
# =============================================================================

# Nombre de la tienda
NEXT_PUBLIC_STORE_NAME="Revital Store"

# Moneda por defecto
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_CURRENCY_SYMBOL=$

# Productos por página
NEXT_PUBLIC_PRODUCTS_PER_PAGE=12

# =============================================================================
# CONFIGURACIÓN DE CARACTERÍSTICAS (OPCIONAL)
# =============================================================================

# Habilitar lista de deseos
NEXT_PUBLIC_ENABLE_WISHLIST=true

# Habilitar sistema de reseñas
NEXT_PUBLIC_ENABLE_REVIEWS=true

# Habilitar búsqueda
NEXT_PUBLIC_ENABLE_SEARCH=true

# Habilitar filtros
NEXT_PUBLIC_ENABLE_FILTERS=true

# Habilitar comparación de productos
NEXT_PUBLIC_ENABLE_COMPARISON=false

# Habilitar notificaciones
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

## 🚀 Ejemplos de Configuración

### 1. Tienda Completa (Todas las secciones activas)
```env
NEXT_PUBLIC_SHOW_NEW_DROPS=true
NEXT_PUBLIC_SHOW_CATEGORIES=true
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 2. Solo Categorías (Sin New Drops)
```env
NEXT_PUBLIC_SHOW_NEW_DROPS=false
NEXT_PUBLIC_SHOW_CATEGORIES=true
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Solo New Drops (Sin Categorías)
```env
NEXT_PUBLIC_SHOW_NEW_DROPS=true
NEXT_PUBLIC_SHOW_CATEGORIES=false
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 4. Página Mínima (Solo Hero)
```env
NEXT_PUBLIC_SHOW_NEW_DROPS=false
NEXT_PUBLIC_SHOW_CATEGORIES=false
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 📝 Notas Importantes

1. **Prefijo NEXT_PUBLIC_**: Todas las variables que necesiten estar disponibles en el cliente deben comenzar con `NEXT_PUBLIC_`

2. **Valores Booleanos**: Para variables booleanas, usa exactamente `"true"` o `"false"` (como strings)

3. **Reinicio del Servidor**: Después de cambiar las variables de entorno, reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. **Deployment**: En producción, configura estas variables en tu plataforma de hosting (Vercel, Netlify, etc.)

## 🔄 Aplicar Cambios

1. Crea el archivo `.env.local` en `/frontend/`
2. Copia las variables necesarias de este ejemplo
3. Modifica los valores según tus necesidades
4. Reinicia el servidor de desarrollo
5. Los cambios se aplicarán automáticamente en la página

## 🛠️ Troubleshooting

**Las secciones no aparecen:**
- Verifica que el archivo `.env.local` esté en la raíz del frontend
- Asegúrate de que las variables tengan el prefijo `NEXT_PUBLIC_`
- Reinicia el servidor de desarrollo
- Verifica que los valores sean exactamente `"true"` o `"false"`

**Error de API:**
- Verifica que `NEXT_PUBLIC_API_URL` apunte a tu backend
- Asegúrate de que el backend esté corriendo
- Revisa que no haya errores de CORS 