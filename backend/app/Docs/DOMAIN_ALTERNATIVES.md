# Alternativas de Dominio para Resend

## Sin Dominio Propio

### 1. Dominio de Prueba de Resend
- **Email:** `onboarding@resend.dev`
- **Uso:** Testing y desarrollo
- **Limitaciones:** 
  - Solo para pruebas
  - Puede ir a spam
  - Límites de envío más estrictos

### 2. Dominios Gratuitos

#### Freenom (Gratuitos)
- `.tk` - Tokelau
- `.ml` - Mali  
- `.ga` - Gabón
- `.cf` - República Centroafricana
- **Registro:** https://www.freenom.com

#### Subdominios de Servicios
- **Netlify:** `tu-app.netlify.app`
- **Vercel:** `tu-app.vercel.app`
- **GitHub Pages:** `usuario.github.io`
- **Railway:** `tu-app.railway.app`

### 3. Dominios de Bajo Costo
- **Namecheap:** $0.99/año (.com primer año)
- **Porkbun:** $1-3/año (.xyz, .online)
- **Cloudflare:** Precios al costo ($8-10/año .com)

## Configuración con Dominio Gratuito

### Ejemplo con Netlify

1. **Desplegar Frontend en Netlify**
```bash
# En tu proyecto frontend
npm run build
netlify deploy --prod --dir=dist
```

2. **Configurar Subdominios**
- Crear subdominio: `mail.tu-app.netlify.app`
- Configurar DNS records en Netlify

3. **Verificar en Resend**
```bash
# DNS Records necesarios
TXT _dmarc.mail.tu-app.netlify.app "v=DMARC1; p=none;"
TXT mail.tu-app.netlify.app "v=spf1 include:_spf.resend.com ~all"
CNAME resend._domainkey.mail.tu-app.netlify.app "resend._domainkey.resend.com"
```

### Ejemplo con GitHub Pages

1. **Crear Repositorio**
```bash
# Crear repo: tu-usuario.github.io
git clone https://github.com/tu-usuario/tu-usuario.github.io.git
```

2. **Configurar Dominio Personalizado**
- Settings > Pages > Custom domain
- Agregar: `tu-usuario.github.io`

3. **Subdominio para Email**
- Usar: `mail.tu-usuario.github.io`

## Testing Local Sin Dominio

### Variables de Entorno
```env
RESEND_KEY=re_tu_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=Synkro Ecommerce
FRONTEND_URL=http://localhost:3000
```

### Endpoints de Prueba
```bash
# Sin autenticación
POST /api/emails/test-local

# Con autenticación (cuando tengas usuarios)
POST /api/emails/test
```

### Comando PowerShell
```powershell
$body = @{
    to_email = "tu-email@ejemplo.com"
    subject = "Prueba Synkro"
    content = "Email de prueba"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/emails/test-local" `
    -Method POST -Body $body -ContentType "application/json"
```

## Limitaciones Sin Dominio Verificado

### Resend (Cuenta Gratuita)
- **Límite diario:** 100 emails
- **Límite mensual:** 3,000 emails
- **Desde:** Solo `onboarding@resend.dev`
- **Para:** Cualquier email válido

### Deliverability
- **Spam Score:** Más alto sin dominio propio
- **Reputación:** Compartida con otros usuarios
- **SPF/DKIM:** No configurables

## Recomendaciones

### Para Desarrollo
1. Usar `onboarding@resend.dev`
2. Probar con emails personales
3. Verificar que lleguen a bandeja de entrada

### Para Producción
1. **Conseguir dominio:** Aunque sea gratuito
2. **Configurar DNS:** SPF, DKIM, DMARC
3. **Verificar en Resend:** Proceso completo
4. **Monitorear:** Métricas de entrega

### Servicios de Email Alternativos
Si no puedes configurar dominio:
- **SendGrid:** 100 emails/día gratis
- **Mailgun:** 5,000 emails/mes (3 meses)
- **Amazon SES:** $0.10 por 1,000 emails
- **Brevo (Sendinblue):** 300 emails/día gratis

## Próximos Pasos

1. **Testing Inmediato**
   - Configurar API key
   - Probar endpoint `/test-local`
   - Verificar recepción

2. **Dominio Temporal**
   - Registrar dominio gratuito
   - Configurar en hosting gratuito
   - Verificar en Resend

3. **Producción**
   - Dominio profesional
   - Configuración DNS completa
   - Monitoreo de métricas 