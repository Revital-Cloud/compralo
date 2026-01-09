# Configuración de Credenciales de Git por Usuario

Este documento explica cómo configurar las credenciales de Git para que cada usuario use sus propias credenciales al hacer commits.

## Problema

Cuando múltiples usuarios trabajan en el mismo servidor y repositorio, los commits pueden aparecer con las credenciales incorrectas si no están configurados correctamente.

## Solución: Variables de Entorno

Cada usuario debe configurar variables de entorno en su archivo `.bashrc` que Git usará automáticamente.

### Para Alejandro (ya configurado)

Las variables ya están configuradas en `/home/alejandro/.bashrc`.

### Para Kevin

Ejecuta estos comandos en tu terminal:

```bash
# Agregar configuración de Git al .bashrc
cat >> ~/.bashrc << 'EOF'

# Configuración de Git - Credenciales personales de Kevin
# Estas variables tienen prioridad sobre la configuración de Git
export GIT_AUTHOR_NAME="KevinBermudezC"
export GIT_AUTHOR_EMAIL="kevinbermudezc@gmail.com"
export GIT_COMMITTER_NAME="KevinBermudezC"
export GIT_COMMITTER_EMAIL="kevinbermudezc@gmail.com"
EOF

# Recargar la configuración
source ~/.bashrc

# Verificar que funcionó
echo "GIT_AUTHOR_NAME: $GIT_AUTHOR_NAME"
echo "GIT_AUTHOR_EMAIL: $GIT_AUTHOR_EMAIL"
```

## Verificación

Después de configurar, verifica que funciona:

```bash
cd /srv/synkro/code

# Verificar variables de entorno
echo "Autor: $GIT_AUTHOR_NAME <$GIT_AUTHOR_EMAIL>"

# Hacer un commit de prueba
echo "# Test" > test-commit.txt
git add test-commit.txt
git commit -m "test: verificar credenciales"
git log -1 --format="%an <%ae> - %s"

# Limpiar
git reset HEAD~1
rm test-commit.txt
```

El commit debería mostrar tus propias credenciales.

## Uso desde Cursor/VS Code

**Importante:** Después de configurar las variables de entorno:

1. **Cierra y reinicia Cursor completamente** para que cargue las nuevas variables de entorno.
2. O abre una nueva terminal integrada en Cursor (Ctrl+`) y verifica que las variables estén cargadas:
   ```bash
   echo $GIT_AUTHOR_NAME
   echo $GIT_AUTHOR_EMAIL
   ```

Si las variables no aparecen en Cursor, puedes:
- Reiniciar Cursor completamente
- O usar la terminal integrada para hacer commits con las variables explícitas:
  ```bash
  GIT_AUTHOR_NAME="TuNombre" GIT_AUTHOR_EMAIL="tu@email.com" git commit -m "mensaje"
  ```

## Configuración Local de Git (Respaldo)

Además de las variables de entorno, cada usuario debe tener su configuración local:

```bash
# Para Alejandro
git config user.name "Alejandro03GG"
git config user.email "ahernandezlara03@gmail.com"

# Para Kevin
git config user.name "KevinBermudezC"
git config user.email "kevinbermudezc@gmail.com"
```

Las variables de entorno tienen **prioridad** sobre la configuración local, así que si están configuradas, se usarán automáticamente.

## Orden de Prioridad de Git

Git usa las credenciales en este orden (de mayor a menor prioridad):

1. **Variables de entorno** (`GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`) - **MÁXIMA PRIORIDAD**
2. Configuración local del repositorio (`git config user.name`)
3. Configuración global (`git config --global user.name`)
4. Configuración del sistema (`git config --system user.name`)

Por eso las variables de entorno son la mejor solución para este caso.

