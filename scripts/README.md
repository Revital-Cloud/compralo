# Scripts

## Backup de bases de datos

`backup-databases.sh` genera dumps PostgreSQL (formato custom `-Fc`) de **revital_ecommerce** y **revital_panel**.

**Requisito:** `pg_dump` instalado (paquete `postgresql-client` o similar).

**Uso desde la raíz del repo:**

```bash
./scripts/backup-databases.sh
```

Los archivos se guardan en `backups/YYYY-MM-DD_HH-MM-SS/` (por ejemplo `revital_ecommerce.dump`, `revital_panel.dump`). La carpeta `backups/` está en `.gitignore`.

- **revital_ecommerce:** usa `DATABASE_URL` de `revital_ecommerce/backend/.env` (o `DATABASE_URL_ECOM` por entorno).
- **revital_panel:** usa `DATABASE_URL` de `revital_panel/backend/.env` (o `DATABASE_URL_PANEL` por entorno). Si no existe ese `.env`, puedes pasar la URL por variable de entorno:

```bash
DATABASE_URL_PANEL='postgresql://user:pass@host:5432/revital_saas' ./scripts/backup-databases.sh
```

Para restaurar un dump:

```bash
pg_restore -d "postgresql://user:pass@host:5432/nombre_bd" -Fc backups/YYYY-MM-DD_HH-MM-SS/revital_ecommerce.dump
```

### PostgreSQL recién instalado (sin usuario creado)

1. **Pon contraseña al usuario `postgres`** (en tu terminal, te pedirá tu contraseña de sudo):

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'tu_password';"
```

2. **Restaura las bases** (usa la misma contraseña que pusiste):

```bash
DATABASE_URL_ECOM='postgresql://postgres:tu_password@localhost/revital_ecommerce' \
DATABASE_URL_PANEL='postgresql://postgres:tu_password@localhost/revital_saas' \
./scripts/restore-databases.sh backups/YYYY-MM-DD_HH-MM-SS
```

3. **Opcional:** actualiza los `.env` de cada backend con esa URL para que las apps conecten a la base local.
