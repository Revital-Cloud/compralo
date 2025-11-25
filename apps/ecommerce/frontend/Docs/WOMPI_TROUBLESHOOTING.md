# 🔧 Guía de Solución de Problemas - Wompi Widget

## 🚨 Error: "Error al cargar el script del widget de Wompi"

### Causas Comunes y Soluciones

#### 1. **Variables de Entorno No Configuradas**

**Síntoma**: Error de configuración al inicializar el pago

**Solución**: Verificar que las variables estén configuradas en `.env.local`:

```bash
# Requeridas para Wompi
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET=test_integrity_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Verificación**:
```bash
# En la consola del navegador
debugWompi()
```

#### 2. **Problemas de Conectividad**

**Síntoma**: Timeout al cargar el script

**Causas**:
- Conexión a internet lenta o inestable
- Firewall corporativo bloqueando Wompi
- DNS no resuelve checkout.wompi.co

**Soluciones**:
1. Verificar conexión a internet
2. Probar en otra red (datos móviles)
3. Contactar administrador de red si estás en red corporativa

#### 3. **Bloqueadores de Contenido**

**Síntoma**: Script no carga o se bloquea

**Causas**:
- AdBlocker activo
- Extensiones de privacidad
- Política de seguridad del navegador

**Soluciones**:
1. **Desactivar AdBlocker** temporalmente para el sitio
2. **Agregar excepción** para `checkout.wompi.co`
3. **Probar en modo incógnito** del navegador
4. **Usar otro navegador** para descartar problemas específicos

#### 4. **Problemas de HTTPS**

**Síntoma**: Error de protocolo o seguridad

**Causa**: Wompi requiere HTTPS en producción

**Solución**:
- En desarrollo: Usar `localhost` (permitido en HTTP)
- En producción: Asegurar que el sitio use HTTPS

#### 5. **Content Security Policy (CSP)**

**Síntoma**: Script bloqueado por política de seguridad

**Solución**: Agregar a la CSP del sitio:
```
script-src 'self' https://checkout.wompi.co;
connect-src 'self' https://checkout.wompi.co;
```

## 🔍 Herramientas de Diagnóstico

### Función de Debugging

En la consola del navegador, ejecuta:

```javascript
debugWompi()
```

Esta función te mostrará:
- ✅/❌ Estado de variables de entorno
- ✅/❌ Conectividad a Wompi
- ✅/❌ Estado del widget
- 💻 Información del sistema

### Logs Detallados

El servicio ahora incluye logs detallados con emojis para fácil identificación:

- 🚀 Inicio de procesos
- ✅ Operaciones exitosas
- ❌ Errores críticos
- ⚠️ Advertencias
- 🔄 Reintentos
- 🔍 Información de debugging

## 🔄 Sistema de Respaldo Automático

### Web Checkout como Fallback

La implementación ahora incluye un **sistema de respaldo automático**:

1. **Intento principal**: Widget oficial de Wompi
2. **Si falla**: Detección automática del tipo de error
3. **Respaldo**: Web Checkout en nueva pestaña
4. **Notificación**: Mensaje específico según el problema

### Detección Automática de Problemas

El sistema detecta automáticamente:
- ✅ **AdBlockers activos**
- ✅ **Firewalls corporativos** 
- ✅ **Políticas CSP restrictivas**
- ✅ **Problemas de conectividad**
- ✅ **Timeouts de red**

## 🛠️ Soluciones Paso a Paso

### Problema: Widget no se abre

1. **El sistema intentará automáticamente** usar Web Checkout
2. **Si quieres diagnosticar manualmente**:
   - Abrir DevTools (F12)
   - Ir a Console
   - Ejecutar: `debugWompi()`
3. **Revisar los resultados**:

#### Si las variables de entorno fallan:
```bash
# Verificar archivo .env.local
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=tu_llave_aqui
NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET=tu_secreto_aqui
```

#### Si la conectividad falla:
1. Verificar conexión a internet
2. Probar: `ping checkout.wompi.co`
3. Verificar firewall/proxy

#### Si el script no carga:
1. Desactivar AdBlocker
2. Probar en modo incógnito
3. Verificar CSP del sitio

### Problema: Widget se abre pero no muestra métodos de pago

1. **Verificar llave pública** es válida
2. **Verificar cuenta Wompi** está activa
3. **Verificar configuración** de métodos de pago en dashboard Wompi

## 🚀 Mejoras Implementadas

### Sistema de Reintentos
- **3 intentos automáticos** con backoff exponencial
- **Timeouts inteligentes**: 15 segundos por intento
- **Limpieza automática** de scripts fallidos

### Sistema de Respaldo Inteligente
- **Web Checkout automático** cuando el widget falla
- **Detección de causa** del error
- **Mensajes específicos** según el problema
- **Redirección transparente** al método alternativo

### Detección Avanzada de Problemas
- **Test de AdBlocker** con elemento señuelo
- **Verificación de CSP** con script inline
- **Test de conectividad** a servidores Wompi
- **Análisis del entorno** del navegador

### Diagnóstico Completo
- **Función debugWompi()** mejorada
- **Recomendaciones automáticas** basadas en diagnóstico
- **Información detallada** del sistema
- **Logs con emojis** para fácil identificación

### Mensajes de Error Contextuales
- **Errores específicos** según la causa detectada
- **Instrucciones paso a paso** para cada problema
- **Alternativas automáticas** cuando es posible
- **Duración inteligente** de notificaciones

## 📞 Contacto y Soporte

### Si el problema persiste:

1. **Ejecutar diagnóstico completo**:
   ```javascript
   debugWompi()
   ```

2. **Capturar información**:
   - Screenshot del error
   - Logs de la consola
   - Resultado del diagnóstico

3. **Contactar soporte**:
   - Email: soporte@wompi.co
   - Incluir toda la información capturada

### Información útil para soporte:
- Navegador y versión
- Sistema operativo
- Tipo de conexión (WiFi/móvil/corporativa)
- Hora exacta del error
- Pasos para reproducir

## 🔄 Casos de Uso Comunes

### Desarrollo Local
```bash
# Variables para sandbox
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_...
NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET=test_integrity_...
```

### Producción
```bash
# Variables para producción
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_prod_...
NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET=prod_integrity_...
```

### Testing
```bash
# Usar datos de prueba de Wompi
# Tarjeta: 4242424242424242
# CVC: cualquier 3 dígitos
# Fecha: cualquier fecha futura
```

## ⚡ Tips de Performance

1. **Pre-cargar script**: El widget se carga automáticamente al abrir el modal
2. **Cache del navegador**: El script se cachea después del primer uso
3. **Conexión persistente**: Reutiliza la conexión para múltiples pagos
4. **Cleanup automático**: Limpia recursos al cerrar para evitar memory leaks

## 🔐 Consideraciones de Seguridad

- ✅ **Firmas de integridad** validadas automáticamente
- ✅ **HTTPS requerido** en producción
- ✅ **Timeouts configurados** para evitar ataques
- ✅ **Validación de origen** para scripts
- ✅ **Limpieza de datos** sensibles en logs
