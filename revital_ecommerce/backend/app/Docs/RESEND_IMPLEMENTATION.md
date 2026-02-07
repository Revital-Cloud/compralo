# Implementación de Resend para Revital Ecommerce

## 📧 Documentación Completa del Sistema de Emails

### Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Servicios Implementados](#servicios-implementados)
4. [Templates de Email](#templates-de-email)
5. [Endpoints Disponibles](#endpoints-disponibles)
6. [Guía de Uso](#guía-de-uso)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Configuración Inicial

### Variables de Entorno Requeridas

```env
# Configuración de Resend
RESEND_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tudominio.com
RESEND_FROM_NAME=Revital Ecommerce

# URLs del Frontend (para links en emails)
FRONTEND_URL=http://localhost:3000
VERIFY_EMAIL_URL=http://localhost:3000/verify-email
RESET_PASSWORD_URL=http://localhost:3000/reset-password
```

### Instalación

```bash
pip install resend==2.6.0
```

---

## Arquitectura del Sistema

### Estructura de Archivos

```
backend/app/
├── services/
│   ├── email_service.py          # Servicio principal de Resend
│   ├── email_templates.py        # Generador de templates HTML
│   └── email_scheduler.py        # Emails programados (futuro)
├── templates/
│   └── emails/
│       ├── base.html            # Template base
│       ├── auth/                # Templates de autenticación
│       ├── orders/              # Templates de pedidos
│       ├── marketing/           # Templates de marketing
│       └── admin/               # Templates administrativos
├── schemas/
│   └── email_schema.py          # Schemas para validación
├── routers/
│   └── email_router.py          # Endpoints para testing
└── static/
    └── email_assets/            # Assets para emails
```

### Componentes Principales

1. **EmailService**: Servicio principal que maneja el envío de emails
2. **EmailTemplates**: Generador de templates HTML dinámicos
3. **EmailSchemas**: Validación de datos para emails
4. **EmailRouter**: Endpoints para testing y administración

---

## Servicios Implementados

### EmailService (`services/email_service.py`)

Servicio principal que encapsula toda la funcionalidad de Resend:

```python
class EmailService:
    def __init__(self):
        self.client = resend.Resend(api_key=settings.RESEND_KEY)
    
    async def send_email(self, email_data: EmailSend) -> bool
    async def send_welcome_email(self, user_email: str, user_name: str) -> bool
    async def send_verification_email(self, user_email: str, token: str) -> bool
    async def send_password_reset_email(self, user_email: str, token: str) -> bool
    # ... más métodos
```

### EmailTemplates (`services/email_templates.py`)

Generador de templates HTML con Jinja2:

```python
class EmailTemplates:
    def __init__(self):
        self.env = Environment(loader=FileSystemLoader("templates/emails"))
    
    def render_template(self, template_name: str, **context) -> str
    def get_welcome_template(self, user_name: str) -> str
    def get_verification_template(self, user_name: str, verify_url: str) -> str
    # ... más métodos
```

---

## Templates de Email

### Template Base (`templates/emails/base.html`)

Template principal que incluye:
- Header con logo de Revital
- Estilos CSS inline para compatibilidad
- Footer con información de contacto
- Diseño responsive

### Templates Específicos

#### Autenticación
- `auth/welcome.html` - Email de bienvenida
- `auth/verify_email.html` - Verificación de email
- `auth/reset_password.html` - Reset de contraseña
- `auth/password_changed.html` - Confirmación de cambio

#### Pedidos
- `orders/order_confirmation.html` - Confirmación de pedido
- `orders/order_shipped.html` - Pedido enviado
- `orders/order_delivered.html` - Pedido entregado
- `orders/order_cancelled.html` - Pedido cancelado

#### Marketing
- `marketing/newsletter.html` - Newsletter
- `marketing/abandoned_cart.html` - Carrito abandonado
- `marketing/product_recommendations.html` - Recomendaciones

#### Administrativos
- `admin/new_order.html` - Nuevo pedido (para admin)
- `admin/low_stock.html` - Stock bajo
- `admin/new_user.html` - Nuevo usuario registrado

---

## Endpoints Disponibles

### Router de Email (`/api/emails`)

```python
# Testing y Administración
POST /api/emails/test                    # Enviar email de prueba
POST /api/emails/send                    # Enviar email personalizado

# Autenticación
POST /api/emails/welcome                 # Email de bienvenida
POST /api/emails/verify                  # Verificación de email
POST /api/emails/password-reset          # Reset de contraseña

# Pedidos
POST /api/emails/order-confirmation      # Confirmación de pedido
POST /api/emails/order-status           # Cambio de estado

# Marketing
POST /api/emails/newsletter             # Enviar newsletter
POST /api/emails/abandoned-cart         # Carrito abandonado
```

---

## Guía de Uso

### 1. Envío Básico de Email

```python
from services.email_service import email_service

# Enviar email de bienvenida
await email_service.send_welcome_email(
    user_email="usuario@ejemplo.com",
    user_name="Juan Pérez"
)
```

### 2. Integración con Autenticación

```python
# En auth_service.py
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
        token=verification_token
    )
```

### 3. Integración con Pedidos

```python
# En order_service.py (futuro)
from services.email_service import email_service

async def create_order(db: Session, order_data: OrderCreate):
    # ... crear pedido ...
    
    # Enviar confirmación al cliente
    await email_service.send_order_confirmation_email(
        user_email=order.user_email,
        order_data=order
    )
    
    # Notificar a administradores
    await email_service.send_new_order_notification(
        order_data=order
    )
```

---

## Testing

### 1. Testing Manual

```bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu RESEND_KEY

# Ejecutar servidor
uvicorn app.main:app --reload

# Probar endpoint de testing
curl -X POST "http://localhost:8000/api/emails/test" \
  -H "Content-Type: application/json" \
  -d '{"to": "tu-email@ejemplo.com", "subject": "Test", "message": "Hola mundo"}'
```

### 2. Testing Automatizado

```python
# tests/test_email_service.py
import pytest
from services.email_service import email_service

@pytest.mark.asyncio
async def test_send_welcome_email():
    result = await email_service.send_welcome_email(
        user_email="test@ejemplo.com",
        user_name="Test User"
    )
    assert result is True

@pytest.mark.asyncio
async def test_send_verification_email():
    result = await email_service.send_verification_email(
        user_email="test@ejemplo.com",
        token="test-token-123"
    )
    assert result is True
```

---

## Troubleshooting

### Problemas Comunes

#### 1. Error: "Invalid API Key"
```
Solución: Verificar que RESEND_KEY esté correctamente configurado en .env
```

#### 2. Error: "Template not found"
```
Solución: Verificar que los archivos de template existan en templates/emails/
```

#### 3. Error: "From email not verified"
```
Solución: Verificar el dominio en el dashboard de Resend
```

#### 4. Emails no llegan
```
Posibles causas:
- Email en spam
- Dominio no verificado
- Rate limit excedido
- Email inválido
```

### Logs y Monitoreo

```python
# Los logs se registran automáticamente
import logging

logger = logging.getLogger(__name__)

# Ejemplos de logs:
# INFO: Email enviado exitosamente a usuario@ejemplo.com
# ERROR: Error al enviar email: Invalid API key
# WARNING: Rate limit alcanzado, reintentando en 60 segundos
```

---

## Configuración de Producción

### 1. Variables de Entorno

```env
# Producción
RESEND_KEY=re_prod_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tudominio.com
RESEND_FROM_NAME=Revital Ecommerce

# URLs de producción
FRONTEND_URL=https://tudominio.com
VERIFY_EMAIL_URL=https://tudominio.com/verify-email
RESET_PASSWORD_URL=https://tudominio.com/reset-password
```

### 2. Verificación de Dominio

1. Agregar dominio en Resend Dashboard
2. Configurar registros DNS
3. Verificar dominio
4. Configurar DKIM (opcional pero recomendado)

### 3. Rate Limits

- Resend Free: 100 emails/día
- Resend Pro: 50,000 emails/mes
- Implementar cola de emails para volúmenes altos

---

## Roadmap Futuro

### Fase 2: Funcionalidades Avanzadas
- [ ] Cola de emails con Celery/Redis
- [ ] Templates dinámicos desde base de datos
- [ ] A/B testing de emails
- [ ] Segmentación de usuarios

### Fase 3: Analytics
- [ ] Tracking de apertura
- [ ] Click tracking
- [ ] Métricas de conversión
- [ ] Dashboard de analytics

### Fase 4: Automatización
- [ ] Secuencias de email marketing
- [ ] Triggers basados en comportamiento
- [ ] Personalización avanzada
- [ ] Machine learning para optimización

---

## Contacto y Soporte

Para dudas o problemas con la implementación:
- Documentación oficial: https://resend.com/docs
- GitHub Issues: Crear issue en el repositorio
- Email: soporte@revital.com

---

**Última actualización:** Enero 2025
**Versión:** 1.0.0
**Autor:** Equipo Revital 