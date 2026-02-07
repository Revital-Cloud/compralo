# Crear usuario admin Synkro (manual)

## Opción 1: Script CLI (recomendado)

Desde la raíz del backend, con venv activado y `.env` con `DATABASE_URL`:

```bash
cd synkro_panel/backend
source venv/bin/activate   # o en Windows: venv\Scripts\activate
PYTHONPATH=app python scripts/create_admin.py --email admin@tudominio.com --password "TuPasswordSeguro"
```

Opcionales: `--nombre`, `--apellido`, `--rol` (admin_synkro, soporte, ventas).

---

## Opción 2: Solo consola (SQL + hash desde Python)

La contraseña se guarda como **hash Argon2**. No puedes poner la contraseña en texto plano en SQL.

### Paso 1: Generar el hash en Python

Con el venv del backend activado:

```bash
cd synkro_panel/backend
source venv/bin/activate
PYTHONPATH=app python -c "
from core.jwt_utils import get_password_hash
h = get_password_hash('TU_PASSWORD_AQUI')
print(h)
"
```

Copia la salida (el hash largo que empieza con `$argon2...`).

### Paso 2: Llamar a la función en PostgreSQL

Conecta a tu base (psql o DBeaver, etc.) y ejecuta:

```sql
SELECT fun_insert_usuario_synkro(
    'Nombre',           -- p_nom_usuario
    'Apellido',         -- p_ape_usuario
    'admin@tudominio.com',  -- p_email_usuario
    '$argon2id$v=19$m=65536,t=3,p=4$...',  -- p_password_usuario (el hash del paso 1)
    'admin_synkro'::enum_rol_synkro,        -- p_rol_synkro: admin_synkro | soporte | ventas
    'system',           -- p_usr_insert (quien crea; para el primero usa 'system')
    true                -- p_ind_activo
);
```

La función devuelve un JSON, por ejemplo:

```json
{"success": true, "message": "Usuario administrador de Synkro insertado correctamente", "id_usuario": 1, "email_usuario": "admin@tudominio.com"}
```

### Referencia de la función

- **Archivo**: `synkro_panel/db/Functions/tab_usuarios_synkro/fun_insert_usuario_synkro.sql`
- **Parámetros**:
  - `p_nom_usuario`, `p_ape_usuario`: nombre y apellido.
  - `p_email_usuario`: email único.
  - `p_password_usuario`: hash Argon2 (obligatorio).
  - `p_rol_synkro`: `'admin_synkro'`, `'soporte'` o `'ventas'`.
  - `p_usr_insert`: email de quien crea (para el primer admin usar `'system'`).
  - `p_ind_activo`: `true` para activo.

Roles válidos: `admin_synkro`, `soporte`, `ventas`.
