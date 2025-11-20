# Variables de Entorno del Frontend

## Configuración de la API

### Variables Requeridas

```bash
# URL de la API del backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# URL alternativa para desarrollo local
NEXT_PUBLIC_API_URL_LOCAL=http://localhost:8000/api

# Configuración de Wompi (Pagos)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Variables Opcionales

```bash
# Configuración de la aplicación
NEXT_PUBLIC_APP_NAME=Synkro
NEXT_PUBLIC_APP_VERSION=1.0.0

# Configuración de analytics (opcional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

## Problema Identificado

**Discrepancia en variables de entorno:**

- `apiWrapper.ts` usa: `process.env.NEXT_PUBLIC_API_URL`
- `config.ts` usa: `process.env.NEXT_PUBLIC_API_URL_LOCAL`

**Solución:**
1. Usar `NEXT_PUBLIC_API_URL` en ambos archivos
2. O crear un archivo `.env.local` con la variable correcta

## Archivo .env.local Recomendado

```bash
# Crear archivo: frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Verificación

Para verificar que la API esté funcionando:

1. **Backend**: Asegurar que esté corriendo en `http://localhost:8000`
2. **Frontend**: Verificar que `NEXT_PUBLIC_API_URL` esté configurado
3. **CORS**: Verificar que el backend permita requests del frontend
4. **Endpoints**: Verificar que `/api/categories` esté disponible

## Debug

Si las categorías no se cargan:

1. Abrir DevTools → Console
2. Verificar logs de la API
3. Verificar Network tab para requests a `/categories`
4. Verificar que no haya errores de CORS
