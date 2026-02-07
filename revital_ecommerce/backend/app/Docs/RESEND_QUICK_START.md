# 🚀 Guía Rápida de Resend - Revital Ecommerce

## ✅ ¿Qué hemos implementado?

### 📁 Estructura de Archivos Creados

```
backend/app/
├── services/
│   ├── email_service.py          ✅ Servicio principal de Resend
│   └── email_templates.py        ✅ Generador de templates HTML
├── schemas/
│   └── email_schema.py           ✅ Schemas de validación
├── routers/
│   └── email_router.py           ✅ Endpoints de la API
├── templates/emails/
│   ├── base.html                 ✅ Template base
│   ├── auth/
│   │   ├── welcome.html          ✅ Email de bienvenida
│   │   └── verify_email.html     ✅ Verificación de email
│   └── test_email.html           ✅ Email de prueba
├── core/
│   └── config.py                 ✅ Configuración actualizada
└── Docs/
    ├── RESEND_IMPLEMENTATION.md  ✅ Documentación completa
    └── RESEND_QUICK_START.md     ✅ Esta guía
```

### 🔧 Configuración Necesaria

1. **Variables de entorno** (agregar a tu `.env`):
```env
# Configuración de Resend
RESEND_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tudominio.com
RESEND_FROM_NAME=Revital Ecommerce

# URLs del frontend
FRONTEND_URL=http://localhost:3000
VERIFY_EMAIL_URL=http://localhost:3000/verify-email
RESET_PASSWORD_URL=http://localhost:3000/reset-password
```

2. **Dependencias instaladas**:
   - ✅ `resend==2.6.0` (ya agregado a requirements.txt)
   - ✅ `Jinja2==3.1.6` (ya estaba instalado)

## 🧪 Cómo Probar

### 1. Configurar tu API Key de Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta
2. Obtén tu API key
3. Agrégala a tu archivo `.env`:
   ```env
   RESEND_KEY=re_tu_api_key_aqui
   ```

### 2. Probar el Sistema

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Ejecutar el servidor
uvicorn app.main:app --reload

# 3. Probar endpoint de testing
curl -X POST "http://localhost:8000/api/emails/test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token_jwt" \
  -d '{
    "to": "tu-email@ejemplo.com",
    "subject": "Prueba de Resend",
    "message": "¡Hola desde Revital!",
    "template_test": true
  }'
```

### 3. Endpoints Disponibles

| Endpoint | Método | Descripción | Auth Requerida |
|----------|--------|-------------|----------------|
| `/api/emails/test` | POST | Email de prueba | ✅ Usuario |
| `/api/emails/send` | POST | Email personalizado | ✅ Usuario |
| `/api/emails/welcome` | POST | Email de bienvenida | ❌ Público |
| `/api/emails/verify` | POST | Verificación de email | ❌ Público |
| `/api/emails/password-reset` | POST | Reset de contraseña | ❌ Público |
| `/api/emails/config` | GET | Configuración del servicio | ✅ Admin |

## 🔗 Integración con Autenticación

### En tu `auth_service.py`:

```python
from services.email_service import email_service

async def register_user(db: Session, user_data: UserCreate):
    # ... crear usuario ...
    
    # Enviar email de bienvenida
    await email_service.send_welcome_email(
        user_email=user.email_usuario,
        user_name=user.nom_usuario
    )
    
    # Enviar email de verificación
    verification_token = generate_verification_token(user.id_usuario)
    await email_service.send_verification_email(
        user_email=user.email_usuario,
        user_name=user.nom_usuario,
        verification_token=verification_token
    )
```

## 📧 Tipos de Email Implementados

### ✅ Listos para usar:
- 🎉 **Email de bienvenida** - Con código de descuento
- ✅ **Verificación de email** - Con enlace seguro
- 🧪 **Email de prueba** - Para testing

### 🚧 Próximos a implementar:
- 🔑 Reset de contraseña
- 📦 Confirmación de pedido
- 🚚 Estado de envío
- 📰 Newsletter
- 🛒 Carrito abandonado

## 🎨 Personalización de Templates

Los templates están en `templates/emails/` y usan Jinja2:

```html
<!-- Ejemplo de uso de variables -->
<h1>¡Hola {{ user_name }}!</h1>
<p>Bienvenido a {{ app_name }}</p>
<a href="{{ frontend_url }}/products" class="btn">Ver productos</a>
```

### Variables disponibles en todos los templates:
- `app_name` - Nombre de la aplicación
- `frontend_url` - URL del frontend
- `current_year` - Año actual
- `company_name` - Nombre de la empresa
- `support_email` - Email de soporte

## 🔍 Debugging

### Verificar configuración:
```bash
# Endpoint para admins
curl -X GET "http://localhost:8000/api/emails/config" \
  -H "Authorization: Bearer tu_token_admin"
```

### Logs importantes:
```python
# Los logs aparecen en la consola
# INFO: EmailService inicializado correctamente
# INFO: Email enviado exitosamente a usuario@ejemplo.com
# ERROR: Error al enviar email: Invalid API key
```

## 🚀 Próximos Pasos

1. **Configurar dominio en Resend** para producción
2. **Implementar más templates** (pedidos, marketing)
3. **Agregar tracking** de emails abiertos
4. **Implementar cola de emails** para volúmenes altos
5. **Crear dashboard** de estadísticas

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en la consola
2. Verifica tu API key de Resend
3. Consulta la documentación completa en `RESEND_IMPLEMENTATION.md`
4. Crea un issue en el repositorio

---

**¡Listo para enviar emails! 📧✨** 