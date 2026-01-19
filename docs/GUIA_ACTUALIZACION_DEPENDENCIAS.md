# Guía: Actualización de Dependencias en Synkro

Esta guía explica cómo agregar nuevas dependencias (paquetes) al frontend o backend y qué hacer con Docker.

---

## 📦 Agregar Dependencias al Frontend (Next.js)

### Paso 1: Agregar la dependencia

Desde la raíz del monorepo (`/srv/synkro/code/`):

```bash
# Agregar dependencia a un frontend específico
cd apps/ecommerce/frontend
pnpm add <nombre-del-paquete>

# O desde la raíz usando filtros
pnpm --filter frontend-tienda-virtual add <nombre-del-paquete>
```

**Esto automáticamente:**
- ✅ Actualiza el `package.json` del app
- ✅ Actualiza el `pnpm-lock.yaml` en la raíz del monorepo
- ✅ Instala la dependencia localmente

### Paso 2: Verificar que funciona localmente

```bash
# Desde la raíz del monorepo
pnpm dev

# O solo el frontend específico
cd apps/ecommerce/frontend
pnpm dev
```

### Paso 3: Docker se actualiza automáticamente

**No necesitas modificar los Dockerfiles manualmente.** Los Dockerfiles ya están configurados para:

1. Copiar el `pnpm-lock.yaml` actualizado
2. Ejecutar `pnpm install --frozen-lockfile`

**Los Dockerfiles relevantes están en:**
- `/srv/synkro/containers/base/ecommerce/frontend/Dockerfile`
- `/srv/synkro/containers/base/synkro/frontend/Dockerfile`

### Paso 4: Reconstruir contenedores (cuando despliegues)

Cuando hagas deploy, los comandos estándar ya incluyen el rebuild:

```bash
cd /srv/synkro/containers/dev  # o staging/prod según corresponda
docker compose pull
docker compose build  # Esto reconstruirá con las nuevas dependencias
docker compose up -d --force-recreate
```

---

## 🐍 Agregar Dependencias al Backend (FastAPI/Python)

### Paso 1: Agregar la dependencia

**Opción A: Editar `requirements.txt` directamente**

```bash
cd apps/ecommerce/backend
# Editar requirements.txt y agregar la línea:
# nombre-paquete==version
```

**Opción B: Instalar y congelar (recomendado)**

```bash
cd apps/ecommerce/backend

# Activar entorno virtual (si usas uno localmente)
# python -m venv venv
# source venv/bin/activate

# Instalar el paquete
pip install <nombre-del-paquete>

# Actualizar requirements.txt con todas las dependencias
pip freeze > requirements.txt
```

**⚠️ Importante:** Revisa el `requirements.txt` generado y elimina dependencias que no necesites o que sean sub-dependencias innecesarias.

### Paso 2: Verificar que funciona localmente

```bash
cd apps/ecommerce/backend
# Asegúrate de tener las variables de entorno configuradas
python -m uvicorn app.main:app --reload
```

### Paso 3: Docker se actualiza automáticamente

**No necesitas modificar los Dockerfiles manualmente.** Los Dockerfiles ya están configurados para:

1. Copiar el `requirements.txt` actualizado
2. Ejecutar `pip install --no-cache-dir -r requirements.txt`

**Los Dockerfiles relevantes están en:**
- `/srv/synkro/containers/base/ecommerce/backend/Dockerfile`
- `/srv/synkro/containers/base/synkro/backend/Dockerfile`

### Paso 4: Reconstruir contenedores (cuando despliegues)

```bash
cd /srv/synkro/containers/dev  # o staging/prod según corresponda
docker compose pull
docker compose build  # Esto reconstruirá con las nuevas dependencias
docker compose up -d --force-recreate
```

---

## ⚡ Builds: Comandos por App

### Respuesta corta: **Cada app se construye independientemente**

Ya no usamos Turborepo. Cada aplicación tiene su propio `package.json` y se construye de forma independiente.

Cuando agregas dependencias:

1. **Actualiza el `package.json`** de la app correspondiente
2. **Ejecuta `pnpm install`** en el directorio de la app
3. **Ejecuta `pnpm build` o `pnpm dev`** según necesites

### Comandos por App

```bash
# Ecommerce Frontend
cd apps/ecommerce/frontend
pnpm install
pnpm build
pnpm dev

# Synkro Frontend  
cd apps/synkro/frontend
pnpm install
pnpm build
pnpm dev
```

### ¿Cuándo modificar configuración?

Solo necesitas modificar configuración si:
- Quieres agregar una **nueva tarea** (ej: `test`, `type-check`)
- Quieres cambiar las **dependencias entre tareas** (`dependsOn`)
- Quieres cambiar los **outputs** de una tarea (ej: agregar más carpetas de salida)

---

## 🔄 Flujo Completo: Ejemplo Práctico

### Ejemplo: Agregar `date-fns` al frontend de ecommerce

```bash
# 1. Agregar dependencia
cd /srv/synkro/code/apps/ecommerce/frontend
pnpm add date-fns

# 2. Usar en tu código
# import { format } from 'date-fns'

# 3. Probar localmente
pnpm dev

# 4. Commit y push
git add pnpm-lock.yaml apps/ecommerce/frontend/package.json
git commit -m "feat: add date-fns to ecommerce frontend"
git push origin tu-branch

# 5. Cuando GitHub Actions despliegue (o manualmente):
# Los comandos de deploy ya incluyen docker compose build
# que reconstruirá con las nuevas dependencias automáticamente
```

### Ejemplo: Agregar `python-jose` al backend de ecommerce

```bash
# 1. Agregar dependencia
cd /srv/synkro/code/apps/ecommerce/backend
pip install python-jose[cryptography]

# 2. Actualizar requirements.txt
pip freeze > requirements.txt
# Revisar y limpiar requirements.txt si es necesario

# 3. Probar localmente
python -m uvicorn app.main:app --reload

# 4. Commit y push
git add apps/ecommerce/backend/requirements.txt
git commit -m "feat: add python-jose for JWT handling"
git push origin tu-branch

# 5. Cuando despliegues, Docker reconstruirá automáticamente
```

---

## 🐳 Estructura de Dockerfiles (Referencia)

### Frontend Dockerfile (ya configurado)

```dockerfile
# Copia el lockfile actualizado
COPY pnpm-lock.yaml package.json ./

# Copia package.json del app
COPY apps/ecommerce/frontend/package.json apps/ecommerce/frontend/

# Instala dependencias (usa el lockfile)
RUN pnpm install --frozen-lockfile || pnpm install
```

**✅ No necesitas cambiar esto** - Ya está optimizado para usar el `pnpm-lock.yaml` actualizado.

### Backend Dockerfile (ya configurado)

```dockerfile
# Copia el código del backend
COPY apps/ecommerce/backend /app

# Instala dependencias desde requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
```

**✅ No necesitas cambiar esto** - Ya está configurado para usar `requirements.txt` actualizado.

---

## ⚠️ Errores Comunes y Soluciones

### Error: "Module not found" en Docker pero funciona localmente

**Causa:** El `pnpm-lock.yaml` o `requirements.txt` no está actualizado en el commit.

**Solución:**
```bash
# Frontend
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"

# Backend
git add requirements.txt
git commit -m "chore: update requirements"
```

### Error: Docker build falla con "frozen-lockfile"

**Causa:** El `pnpm-lock.yaml` está desincronizado.

**Solución:**
```bash
# Regenerar lockfile
cd /srv/synkro/code
rm pnpm-lock.yaml
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: regenerate lockfile"
```

### Error: Dependencia no disponible en el contenedor

**Causa:** El Dockerfile no está copiando el archivo de dependencias correctamente.

**Solución:** Verifica que el Dockerfile copie:
- Frontend: `pnpm-lock.yaml` y `package.json` del app
- Backend: `requirements.txt`

---

## 📝 Checklist Rápido

Cuando agregues una nueva dependencia:

- [ ] Agregar dependencia con `pnpm add` (frontend) o editar `requirements.txt` (backend)
- [ ] Verificar que funciona localmente (`pnpm dev` o `uvicorn`)
- [ ] Hacer commit de los archivos actualizados:
  - Frontend: `package.json` del app + `pnpm-lock.yaml`
  - Backend: `requirements.txt`
- [ ] Push y deploy (Docker se reconstruirá automáticamente)
- [ ] **NO** modificar Dockerfiles manualmente (ya están configurados)
- [ ] Cada app tiene su propia configuración independiente

---

## 🎯 Resumen

1. **Frontend:** `pnpm add <paquete>` → actualiza `pnpm-lock.yaml` → Docker lo usa automáticamente
2. **Backend:** `pip install` + actualizar `requirements.txt` → Docker lo usa automáticamente
3. **Turborepo:** No necesita cambios, solo ejecuta `pnpm build` cuando quieras construir
4. **Docker:** No necesita cambios manuales, los Dockerfiles ya están configurados correctamente

**La clave:** Los Dockerfiles están diseñados para usar los archivos de dependencias (`pnpm-lock.yaml` y `requirements.txt`) que se actualizan automáticamente cuando agregas paquetes. Solo necesitas reconstruir los contenedores cuando despliegues.
