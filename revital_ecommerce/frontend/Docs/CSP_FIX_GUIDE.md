# 🛡️ Guía de Solución - CSP Bloqueando API

## ❌ Problema Identificado

El Content Security Policy (CSP) estaba bloqueando las conexiones a `http://localhost:8000/api` porque no estaba incluido en la directiva `connect-src`.

## ✅ Solución Implementada

### 1. **Frontend - next.config.ts**
```typescript
// Configuración flexible que detecta el entorno
const isDevelopment = process.env.NODE_ENV === 'development';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// CSP que incluye localhost en desarrollo
connect-src: `'self' ${apiUrl} http://localhost:8000 https://api.revital.com https://*.cloudinary.com`
```

### 2. **Backend - security_middleware.py**
```python
# Configuración flexible para desarrollo y producción
if is_development:
    csp = "connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:8000 https://api.revital.com"
else:
    csp = "connect-src 'self' https://api.revital.com"
```

### 3. **Variables de Entorno**
```bash
# frontend/.env.local (crear si no existe)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NODE_ENV=development
```

## 🔧 Pasos para Aplicar la Solución

### 1. **Reiniciar el Frontend**
```bash
cd frontend
npm run dev
```

### 2. **Reiniciar el Backend**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. **Verificar la Conexión**
```bash
cd frontend
npm run verify-api
```

## 🧪 Verificación Manual

### 1. **Abrir DevTools**
- F12 → Console
- Buscar errores de CSP

### 2. **Verificar Network Tab**
- Debe ver requests exitosos a `http://localhost:8000/api/*`
- Status 200 para endpoints válidos

### 3. **Verificar Headers de Respuesta**
```bash
curl -I http://localhost:8000/api/categories
```

Debe mostrar:
```
Content-Security-Policy: connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:8000 https://api.revital.com
```

## 🚨 Si Aún Hay Problemas

### 1. **Verificar CORS en Backend**
```python
# En main.py debe estar:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. **Verificar Orden de Middlewares**
```python
# El orden correcto es:
app.add_middleware(CORSMiddleware, ...)  # Primero
app.add_middleware(SecurityMiddleware)   # Segundo
app.add_middleware(AuthMiddleware, ...)  # Tercero
```

### 3. **Limpiar Cache del Navegador**
- Ctrl+Shift+R (Hard Refresh)
- O abrir en ventana incógnita

## 📊 Estado de la Configuración

| Componente | Estado | Detalles |
|------------|--------|----------|
| **Frontend CSP** | ✅ Corregido | Incluye localhost:8000 |
| **Backend CSP** | ✅ Corregido | Configuración flexible |
| **CORS** | ✅ Configurado | Permite todos los orígenes |
| **Variables ENV** | ✅ Configurado | NEXT_PUBLIC_API_URL |

## 🎯 Resultado Esperado

- ✅ Frontend se conecta a `http://localhost:8000/api`
- ✅ No hay errores de CSP en la consola
- ✅ Las categorías y productos se cargan correctamente
- ✅ Los formularios funcionan sin problemas
- ✅ La validación XSS sigue activa

## 🔍 Debug Adicional

Si persisten los problemas, ejecutar:

```bash
# Verificar que el backend esté corriendo
curl http://localhost:8000/api/categories

# Verificar headers de seguridad
curl -I http://localhost:8000/api/categories

# Verificar desde el frontend
npm run verify-api
```

## 📝 Notas Importantes

1. **Desarrollo vs Producción**: La configuración es diferente para cada entorno
2. **Seguridad**: El CSP sigue siendo estricto, solo permite conexiones necesarias
3. **Performance**: No afecta el rendimiento de la aplicación
4. **Compatibilidad**: Funciona con todos los navegadores modernos
