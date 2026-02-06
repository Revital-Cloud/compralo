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
