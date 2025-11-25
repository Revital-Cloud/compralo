# 🔒 Configuración de CSP para Wompi

## 🚨 Problema Identificado

El **Content Security Policy (CSP)** está bloqueando el acceso a Wompi:

```
Refused to load https://checkout.wompi.co/widget.js because it does not appear in the script-src directive of the Content Security Policy.

Refused to load https://checkout.wompi.co/p/ because it does not appear in the form-action directive of the Content Security Policy.
```

## ✅ Solución: Configurar CSP Correctamente

### 1. **CSP Mínimo Requerido para Wompi**

```http
Content-Security-Policy: 
  script-src 'self' https://checkout.wompi.co;
  form-action 'self' https://checkout.wompi.co;
  connect-src 'self' https://checkout.wompi.co;
  frame-src 'self' https://checkout.wompi.co;
```

### 2. **CSP Completo Recomendado**

```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://checkout.wompi.co;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://checkout.wompi.co https://api.wompi.co;
  form-action 'self' https://checkout.wompi.co;
  frame-src 'self' https://checkout.wompi.co;
  object-src 'none';
  base-uri 'self';
```

## 🛠️ Implementación según Framework

### **Next.js (next.config.js)**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://checkout.wompi.co",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://checkout.wompi.co https://api.wompi.co",
              "form-action 'self' https://checkout.wompi.co",
              "frame-src 'self' https://checkout.wompi.co",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

### **Nginx**

```nginx
server {
    # ... otras configuraciones
    
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://checkout.wompi.co;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self' data:;
        connect-src 'self' https://checkout.wompi.co https://api.wompi.co;
        form-action 'self' https://checkout.wompi.co;
        frame-src 'self' https://checkout.wompi.co;
        object-src 'none';
        base-uri 'self';
    " always;
}
```

### **Apache (.htaccess)**

```apache
<IfModule mod_headers.c>
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.wompi.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://checkout.wompi.co https://api.wompi.co; form-action 'self' https://checkout.wompi.co; frame-src 'self' https://checkout.wompi.co; object-src 'none'; base-uri 'self';"
</IfModule>
```

### **Express.js (Node.js)**

```javascript
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.wompi.co"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'", "data:"],
    connectSrc: ["'self'", "https://checkout.wompi.co", "https://api.wompi.co"],
    formAction: ["'self'", "https://checkout.wompi.co"],
    frameSrc: ["'self'", "https://checkout.wompi.co"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"]
  }
}));
```

## 🔍 Verificar Configuración

### 1. **Herramientas de Diagnóstico**

En la consola del navegador:
```javascript
debugWompi()
```

Esto mostrará:
- ✅/❌ CSP restrictivo detectado
- 📜 script-src bloqueado
- 📋 form-action bloqueado
- 💡 CSP recomendado

### 2. **Verificar CSP Actual**

En DevTools → Console:
```javascript
// Ver CSP actual
console.log(document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content);

// O verificar headers de respuesta
fetch(window.location.href).then(r => console.log(r.headers.get('content-security-policy')));
```

### 3. **Test Manual**

```javascript
// Test script-src
const script = document.createElement('script');
script.src = 'https://checkout.wompi.co/widget.js';
script.onload = () => console.log('✅ script-src OK');
script.onerror = () => console.log('❌ script-src bloqueado');
document.head.appendChild(script);

// Test form-action
const form = document.createElement('form');
form.action = 'https://checkout.wompi.co/p/';
form.method = 'GET';
try {
  document.body.appendChild(form);
  console.log('✅ form-action OK');
  document.body.removeChild(form);
} catch (e) {
  console.log('❌ form-action bloqueado');
}
```

## 🚀 Solución Temporal (Sin Cambiar CSP)

Si no puedes modificar el CSP inmediatamente, el sistema tiene un **respaldo automático**:

### **Redirección Directa**
```javascript
// El sistema detecta CSP y usa redirección directa
window.location.href = 'https://checkout.wompi.co/p/?public-key=...&amount-in-cents=...';
```

### **Ventajas del Respaldo**:
- ✅ **Funciona sin CSP** - No requiere script-src ni form-action
- ✅ **Misma seguridad** - Usa las mismas firmas de integridad
- ✅ **Automático** - Se activa cuando detecta bloqueo CSP
- ✅ **Transparente** - Usuario ve mensaje informativo

## 📋 Checklist de Implementación

### **Paso 1: Identificar el Problema**
- [ ] Ejecutar `debugWompi()` en consola
- [ ] Verificar logs de CSP en DevTools
- [ ] Confirmar que es un problema de CSP

### **Paso 2: Configurar CSP**
- [ ] Agregar `https://checkout.wompi.co` a `script-src`
- [ ] Agregar `https://checkout.wompi.co` a `form-action`
- [ ] Agregar `https://checkout.wompi.co` a `connect-src`
- [ ] Agregar `https://checkout.wompi.co` a `frame-src`

### **Paso 3: Verificar**
- [ ] Recargar página
- [ ] Ejecutar `debugWompi()` nuevamente
- [ ] Probar el widget de Wompi
- [ ] Confirmar que no hay errores de CSP

### **Paso 4: Monitoreo**
- [ ] Verificar logs de producción
- [ ] Monitorear errores de CSP
- [ ] Confirmar que pagos funcionan correctamente

## ⚠️ Consideraciones de Seguridad

### **CSP Recomendado vs Mínimo**

**Mínimo** (solo para Wompi):
```
script-src 'self' https://checkout.wompi.co;
form-action 'self' https://checkout.wompi.co;
```

**Recomendado** (seguridad completa):
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://checkout.wompi.co;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://checkout.wompi.co;
form-action 'self' https://checkout.wompi.co;
frame-src 'self' https://checkout.wompi.co;
object-src 'none';
```

### **Evitar Directivas Inseguras**

❌ **No usar**:
```
script-src 'unsafe-eval';  // Permite eval()
default-src *;             // Permite cualquier origen
```

✅ **Usar**:
```
script-src 'self' https://checkout.wompi.co;  // Solo orígenes específicos
```

## 🆘 Soporte

### **Si el problema persiste**:

1. **Ejecutar diagnóstico**:
   ```javascript
   debugWompi()
   ```

2. **Capturar información**:
   - Screenshot de errores CSP
   - Configuración CSP actual
   - Logs de la consola

3. **Contactar soporte**:
   - Incluir configuración CSP
   - Mencionar que es problema de CSP
   - Adjuntar logs del diagnóstico

### **Recursos Adicionales**:
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Wompi Documentation](https://docs.wompi.co/)
