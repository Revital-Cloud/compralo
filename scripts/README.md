# Scripts

## Backup de bases de datos

`backup-databases.sh` genera dumps PostgreSQL (formato custom `-Fc`) de **synkro_ecommerce** y **synkro_panel**.

**Requisito:** `pg_dump` instalado (paquete `postgresql-client` o similar).

**Uso desde la raíz del repo:**

```bash
./scripts/backup-databases.sh
```

Los archivos se guardan en `backups/YYYY-MM-DD_HH-MM-SS/` (por ejemplo `synkro_ecommerce.dump`, `synkro_panel.dump`). La carpeta `backups/` está en `.gitignore`.

- **synkro_ecommerce:** usa `DATABASE_URL` de `synkro_ecommerce/backend/.env`.
- **synkro_panel:** usa `DATABASE_URL` de `synkro_panel/backend/.env`. Si no existe ese `.env`, puedes pasar la URL por variable de entorno:

```bash
DATABASE_URL_PANEL='postgresql://user:pass@host:5432/synkro_panel' ./scripts/backup-databases.sh
```

Para restaurar un dump:

```bash
pg_restore -d "postgresql://user:pass@host:5432/nombre_bd" -Fc backups/YYYY-MM-DD_HH-MM-SS/synkro_ecommerce.dump
```

### PostgreSQL recién instalado (sin usuario creado)

1. **Pon contraseña al usuario `postgres`** (en tu terminal, te pedirá tu contraseña de sudo):

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'tu_password';"
```

2. **Restaura las bases** (usa la misma contraseña que pusiste):

```bash
DATABASE_URL_ECOM='postgresql://postgres:tu_password@localhost/synkro_ecommerce' \
DATABASE_URL_PANEL='postgresql://postgres:tu_password@localhost/synkro_panel' \
./scripts/restore-databases.sh backups/YYYY-MM-DD_HH-MM-SS
```

3. **Opcional:** actualiza los `.env` de cada backend con esa URL para que las apps conecten a la base local.
