# 🧪 Testing Local de Resend - Sin Dominio

## 🚀 Configuración Rápida para Testing Local

### 1. Obtener API Key de Resend (GRATIS)

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. En el dashboard, ve a "API Keys"
4. Crea una nueva API key
5. Copia la key (empieza con `re_`)

### 2. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Configuración de Resend
RESEND_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=Revital Ecommerce

# URLs del frontend (para testing local)
FRONTEND_URL=http://localhost:3000
VERIFY_EMAIL_URL=http://localhost:3000/verify-email
RESET_PASSWORD_URL=http://localhost:3000/reset-password
```

> ⚠️ **IMPORTANTE**: Para testing sin dominio propio, usa `onboarding@resend.dev` como email remitente. Este es un dominio especial de Resend para testing.

### 3. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 4. Ejecutar el Servidor

```bash
cd backend
uvicorn app.main:app --reload
```

## 🧪 Probar el Sistema

### Opción 1: Endpoint Sin Autenticación (Más Fácil)

```bash
curl -X POST "http://localhost:8000/api/emails/test-local" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "tu-email@gmail.com",
    "subject": "Prueba de Resend desde Revital",
    "message": "¡Hola! Este es un email de prueba desde el sistema local.",
    "template_test": true
  }'
```

### Opción 2: Con Autenticación (Más Realista)

Primero obtén un token JWT:

```bash
# 1. Registrar/login para obtener token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-usuario@ejemplo.com",
    "password": "tu-contraseña"
  }'

# 2. Usar el token para enviar email
curl -X POST "http://localhost:8000/api/emails/test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token_jwt_aqui" \
  -d '{
    "to": "tu-email@gmail.com",
    "subject": "Prueba Autenticada",
    "message": "Email enviado con autenticación",
    "template_test": true
  }'
```

## 📧 Tipos de Email para Probar

### 1. Email de Bienvenida

```bash
curl -X POST "http://localhost:8000/api/emails/welcome" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "nuevo-usuario@ejemplo.com",
    "user_name": "Juan Pérez",
    "verify_url": "http://localhost:3000/verify?token=abc123"
  }'
```

### 2. Email de Verificación

```bash
curl -X POST "http://localhost:8000/api/emails/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "usuario@ejemplo.com",
    "user_name": "María García",
    "verification_token": "token_verificacion_123",
    "expires_in_hours": 24
  }'
```

### 3. Email Personalizado

```bash
curl -X POST "http://localhost:8000/api/emails/test-local" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinatario@ejemplo.com",
    "subject": "Mi Email Personalizado",
    "message": "Contenido personalizado del email",
    "template_test": false
  }'
```

## 🔍 Verificar que Funciona

### 1. Revisar Logs

En la consola donde ejecutas el servidor deberías ver:

```
INFO: EmailService inicializado correctamente
INFO: 🧪 TESTING LOCAL: Enviando email de prueba a tu-email@gmail.com
INFO: Email enviado exitosamente a tu-email@gmail.com
```

### 2. Revisar tu Email

- Revisa tu bandeja de entrada
- Si no aparece, revisa spam/promociones
- El email debería llegar en menos de 1 minuto

### 3. Verificar en Resend Dashboard

- Ve a tu dashboard de Resend
- En "Logs" verás los emails enviados
- Puedes ver el estado: enviado, entregado, abierto, etc.

## 🚨 Troubleshooting

### Error: "Invalid API Key"

```bash
# Verificar que la API key esté bien configurada
curl -X GET "http://localhost:8000/api/emails/config" \
  -H "Authorization: Bearer tu_token_admin"
```

**Solución:**
- Verifica que `RESEND_KEY` esté en tu `.env`
- Asegúrate de que la key empiece con `re_`
- Reinicia el servidor después de cambiar `.env`

### Error: "From email not verified"

**Solución:**
- Usa `onboarding@resend.dev` para testing
- O verifica tu dominio en Resend dashboard

### Error: "Cannot import name 'require_role'"

**Solución:**
- Ya está arreglado en el código
- Reinicia el servidor

### Emails no llegan

**Posibles causas:**
1. **API Key incorrecta** - Verifica en Resend dashboard
2. **Email en spam** - Revisa carpeta de spam
3. **Rate limit** - Resend free tiene límites
4. **Email inválido** - Verifica que el email destino sea válido

## 📊 Límites de la Cuenta Gratuita

- **100 emails/día** en plan gratuito
- **3,000 emails/mes** en plan gratuito
- Solo desde `onboarding@resend.dev` sin dominio propio

## 🎯 Próximos Pasos

Una vez que confirmes que funciona:

1. **Integrar con autenticación:**
   ```python
   # En tu auth_service.py
   from services.email_service import email_service
   
   await email_service.send_welcome_email(
       user_email=user.email,
       user_name=user.name
   )
   ```

2. **Configurar dominio propio** (para producción)
3. **Implementar más templates** (pedidos, marketing)
4. **Agregar tracking** de emails

## 🔧 Comandos Útiles

```bash
# Verificar configuración
curl -X GET "http://localhost:8000/api/emails/config"

# Validar configuración (requiere admin)
curl -X POST "http://localhost:8000/api/emails/validate-config"

# Ver estadísticas (requiere admin)
curl -X GET "http://localhost:8000/api/emails/stats"

# Probar template específico
curl -X POST "http://localhost:8000/api/emails/test-local" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@ejemplo.com",
    "template_test": true,
    "message": "Probando template HTML"
  }'
```

---

## ✅ Checklist de Testing

- [ ] API key de Resend configurada
- [ ] Variables de entorno en `.env`
- [ ] Servidor ejecutándose sin errores
- [ ] Endpoint `/test-local` responde correctamente
- [ ] Email de prueba recibido
- [ ] Template HTML se ve bien
- [ ] Logs muestran envío exitoso

**¡Una vez que todo funcione, ya tienes Resend listo para tu ecommerce! 🎉** 