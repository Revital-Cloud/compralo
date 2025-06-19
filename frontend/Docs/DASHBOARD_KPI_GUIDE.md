# 📊 Guía Completa del Dashboard Synkro

Esta guía documenta todos los indicadores clave de rendimiento (KPIs), gráficos y funcionalidades implementadas en el dashboard administrativo de Synkro.

## 🏠 Dashboard Principal (`/admin`)

### 📈 Tarjetas de KPI Principales
1. **Total Orders** - Órdenes totales con crecimiento porcentual
2. **Active Orders** - Órdenes activas en proceso
3. **Shipped Orders** - Órdenes enviadas

### 📊 Gráficos Principales
1. **Sales Graph** - Gráfico de barras interactivo de ventas mensuales
2. **Best Sellers** - Lista de productos más vendidos con métricas
3. **Recent Orders** - Tabla de órdenes recientes con estados

## 📈 Analytics Avanzados (`/admin/analytics`)

### 🎯 Métricas de Conversión
- **Tasa de Conversión** - Porcentaje de visitantes que compran
- **Valor Promedio de Orden (AOV)** - Ticket promedio por compra
- **Abandono de Carrito** - Porcentaje de carritos abandonados
- **Valor de Vida del Cliente (CLV)** - Valor total por cliente

### 🚀 Fuentes de Tráfico
Análisis detallado de canales de adquisición:
- Direct
- Google Organic
- Social Media
- Email Marketing
- Paid Ads
- Referral

### 👥 Demografía de Clientes
Distribución por grupos de edad con métricas de ingresos:
- 18-24 años
- 25-34 años
- 35-44 años
- 45-54 años
- 55+ años

### 🏷️ Performance por Categoría
Análisis de ventas y crecimiento por categoría:
- Calzado Deportivo
- Ropa Casual
- Accesorios
- Equipamiento

### 🗺️ Datos Geográficos
Distribución de ventas por regiones:
- Buenos Aires
- Córdoba
- Santa Fe
- Mendoza
- Tucumán

### ⏰ Tráfico por Horas
Gráfico de visitantes por hora del día (24 horas) con:
- Identificación de picos de tráfico
- Horarios valle
- Promedio por hora

## 📦 Gestión de Productos (`/admin/products`)

### 🏪 Lista de Productos
- **Vista en Grid** - Tarjetas de productos con información clave
- **Métricas por Producto**:
  - Nombre y categoría
  - Precio actual
  - Ventas totales con indicador de tendencia
  - Stock restante con código de colores
  - Resumen descriptivo

### ➕ Creación/Edición de Productos (`/admin/products/create`)
- **Información Básica**:
  - Nombre del producto
  - Descripción completa
  - Categoría y marca
  - SKU único
  - Cantidad en stock

- **Gestión de Precios**:
  - Precio regular
  - Precio de oferta
  - Cálculo automático de descuentos

- **Sistema de Tags**:
  - Tags editables
  - Eliminación individual
  - Categorización automática

- **Galería de Imágenes**:
  - Imagen principal del producto
  - Galería secundaria
  - Drag & drop para subir imágenes
  - Formatos soportados: JPEG, PNG
  - Estado de carga por imagen
  - Eliminación individual de imágenes

### 🔧 Funcionalidades de Productos
- **Paginación completa** con navegación numérica
- **Botón de agregar producto** prominente
- **Acciones por producto** (ver, editar, eliminar)
- **Formulario responsivo** para crear/editar
- **Validación de campos** en tiempo real

## 🛍️ Gestión de Órdenes (`/admin/orders`)

### 📊 Estadísticas de Órdenes
Tarjetas de métricas con código de colores:
- **Total** - Todas las órdenes (gris)
- **Pendientes** - Awaiting processing (amarillo)
- **Procesando** - Being prepared (azul)
- **Enviadas** - In transit (púrpura)
- **Entregadas** - Successfully delivered (verde)
- **Canceladas** - Canceled orders (rojo)

### 🔍 Sistema de Búsqueda y Filtros
- **Búsqueda global** por:
  - ID de orden
  - Nombre del cliente
  - Producto
  - Email del cliente
- **Filtros avanzados** por estado, fecha, monto

### 📋 Tabla de Órdenes Completa
Columnas detalladas:
- **Orden ID** - Identificador único
- **Cliente** - Avatar, nombre y email
- **Producto** - Nombre del producto principal
- **Fecha** - Fecha de creación
- **Estado** - Badge con color e icono
- **Monto** - Valor total formateado
- **Acciones** - Ver detalles y descargar

### 🎨 Estados Visuales de Órdenes
- **Delivered** - Verde con ✓
- **Canceled** - Rojo con ✗
- **Pending** - Amarillo con 📦
- **Processing** - Azul con 📦
- **Shipped** - Púrpura con 🚚

### 💫 Funcionalidades de Órdenes
- **Exportación de datos** a Excel/PDF
- **Paginación inteligente** con conteo
- **Acciones masivas** (próximamente)
- **Vista detallada** por orden
- **Historial de cambios** de estado

## 📋 Detalles de Orden (`/admin/orders/[id]`)

### 🏷️ Información de Cabecera
- **Order ID** con badge de estado
- **Rango de fechas** de la orden
- **Selector de estado** para cambios rápidos
- **Botones de acción** (refresh, save)

### 👤 Información del Cliente
Tarjeta completa con:
- **Nombre completo** del cliente
- **Email** de contacto
- **Teléfono** de contacto
- **Botón de perfil** para vista detallada

### 📦 Información de la Orden
Detalles logísticos:
- **Método de envío** seleccionado
- **Método de pago** utilizado
- **Estado actual** de la orden
- **Botón de descarga** de información

### 🚚 Información de Entrega
Dirección completa:
- **Dirección principal** de entrega
- **Detalles adicionales** de ubicación
- **Número de bloques** o referencias
- **Botón de perfil** de dirección

### 💳 Información de Pago
Detalles financieros:
- **Tarjeta de crédito** con enmascaramiento
- **Nombre del negocio** asociado
- **Teléfono** de contacto de pago
- **Icono visual** del tipo de tarjeta

### 📝 Sistema de Notas
- **Área de texto** para notas administrativas
- **Placeholder** con guía de uso
- **Autoguardado** de notas (futuro)

### 🛍️ Lista de Productos Detallada
Tabla completa con:
- **Checkboxes** para selección múltiple
- **Imágenes** de productos (placeholder)
- **Nombres** de productos
- **Order IDs** individuales
- **Cantidades** por producto
- **Totales** por línea de producto

### 💰 Resumen Financiero
Cálculos detallados:
- **Subtotal** antes de impuestos
- **Impuestos** (20%) calculados
- **Descuentos** aplicados
- **Total final** destacado y formateado

### 🔧 Funcionalidades de Order Details
- **Cambio de estado** en tiempo real
- **Navegación breadcrumb** completa
- **Layout responsivo** para móviles
- **Acciones por producto** individuales
- **Cálculos automáticos** de totales
- **Validación de campos** en tiempo real

## 🎨 Características Técnicas

### 📱 Responsividad
- Grid adaptativo para desktop y móvil
- Componentes optimizados para diferentes tamaños de pantalla
- Navegación colapsible en móvil
- Tablas scrollables en pantallas pequeñas

### 🎭 Componentes Reutilizables
- `KPICard` - Tarjetas de métricas con iconos y crecimiento
- `SalesChart` - Gráfico de barras personalizable
- `ProductCard` - Tarjetas de productos con acciones
- `OrderRow` - Filas de órdenes con estados
- `ConversionMetrics` - Grid de métricas de conversión
- `TrafficSources` - Lista de fuentes con barras de progreso
- `CustomerDemographics` - Demografía con iconos
- `ProductPerformance` - Performance con badges de crecimiento
- `GeographicData` - Datos geográficos con iconos de ubicación
- `HourlyTrafficChart` - Gráfico de tráfico por horas

### 🎨 Sistema de Iconos
Utilizamos iconos de **@tabler/icons-react**:
- `IconTrendingUp/Down` - Indicadores de crecimiento
- `IconShoppingCart` - Órdenes y carritos
- `IconUsers` - Clientes y demografía
- `IconCash` - Métricas financieras
- `IconTarget` - Conversión
- `IconHeart` - CLV y favoritos
- `IconEye` - Vistas y tráfico
- `IconMapPin` - Ubicaciones geográficas
- `IconPackage` - Productos e inventario
- `IconTruck` - Envíos y logística
- `IconPlus` - Agregar elementos
- `IconFilter` - Filtrar datos
- `IconDownload` - Exportar información
- `IconCamera` - Imágenes y media
- `IconUpload` - Subir archivos
- `IconCheck/IconX` - Estados de confirmación

### 🌈 Sistema de Colores
- **Verde** - Indicadores positivos, crecimiento, entregado
- **Rojo** - Indicadores negativos, cancelaciones, errores
- **Azul** - Gráficos principales, procesando, acciones primarias
- **Amarillo** - Pendientes, advertencias, stock bajo
- **Púrpura** - Enviados, premium features
- **Gris** - Texto secundario, placeholders, neutrales

## 📊 Métricas de Negocio Clave

### 💰 Métricas Financieras
- Ingresos totales por período
- Valor promedio de orden (AOV)
- Margen de ganancia por producto
- Crecimiento mensual/anual
- Ingresos por categoría
- Comparación período anterior

### 🛒 Métricas de E-commerce
- Tasa de conversión global
- Abandono de carrito detallado
- Productos por orden promedio
- Tiempo promedio en sitio
- Páginas vistas por sesión
- Bounce rate por página

### 👥 Métricas de Clientes
- Nuevos clientes por período
- Clientes recurrentes vs nuevos
- Valor de vida del cliente (CLV)
- Satisfacción del cliente (NPS)
- Retención por cohortes
- Segmentación demográfica

### 📦 Métricas Operacionales
- Tiempo promedio de envío
- Productos sin stock crítico
- Devoluciones y razones
- Eficiencia de cumplimiento
- Costos logísticos
- Performance de proveedores

### 🚀 Métricas de Marketing
- ROI por canal de marketing
- Costo de adquisición de cliente (CAC)
- Lifetime Value / CAC ratio
- Engagement en redes sociales
- Efectividad de email marketing
- Performance de campañas pagadas

## 🚀 Funcionalidades Avanzadas

### 📈 Filtros de Tiempo
- Weekly, Monthly, Yearly
- Rangos personalizados
- Comparación período anterior
- Filtros de fechas específicas
- Análisis estacional

### 💾 Exportación de Datos
- Exportar a Excel/CSV con formatos personalizados
- Reportes en PDF con branding
- Dashboards imprimibles
- Datos en tiempo real
- Programación de reportes automáticos

### 🔔 Alertas y Notificaciones
- Stock bajo automático
- Nuevas órdenes en tiempo real
- Métricas fuera de rango definido
- Objetivos alcanzados/perdidos
- Anomalías en el comportamiento

### 🎯 Comparaciones
- Mes vs mes anterior detallado
- Año vs año anterior
- Benchmarks de industria
- Objetivos vs realidad
- Performance por segmentos

## 📱 Navegación del Dashboard

### 🧭 Sidebar Principal
- **Dashboard** - Vista general con KPIs principales
- **Analytics** - Métricas avanzadas con tabs organizados
- **Productos** - Gestión completa de inventario
- **Órdenes** - Administración de pedidos y estados
- **Usuarios** - Gestión de clientes y administradores
- **Envíos** - Logística y tracking

### ⚙️ Sidebar Secundario
- **Configuración** - Settings generales del sistema
- **Email Marketing** - Campañas y automatizaciones
- **Favoritos** - Productos y clientes favoritos
- **Pagos** - Integración con Mercado Pago
- **SEO & Marketing** - Optimización y promociones
- **Ayuda** - Documentación y soporte
- **Búsqueda** - Search global en el sistema

## 🎉 Próximas Funcionalidades

### 📊 Gráficos Adicionales Planificados
1. **Funnel de Conversión** - Embudo de ventas completo con etapas
2. **Cohort Analysis** - Análisis de cohortes de clientes por período
3. **Heatmaps** - Mapas de calor de comportamiento en productos
4. **Forecast** - Predicciones de ventas basadas en ML
5. **A/B Testing Results** - Resultados de pruebas A/B en tiempo real

### 🚀 Integraciones Futuras
1. **Google Analytics** - Datos en tiempo real de GA4
2. **Mercado Pago Analytics** - Métricas detalladas de pagos
3. **Email Platform Stats** - Estadísticas de Resend/SendGrid
4. **Social Media Metrics** - Instagram, Facebook, TikTok APIs
5. **Inventory Management** - Gestión avanzada con Odoo/SAP

### 🛠️ Mejoras Técnicas Planificadas
1. **Real-time Updates** - WebSockets para datos en vivo
2. **Advanced Filtering** - Filtros multidimensionales
3. **Custom Dashboards** - Dashboards personalizables por usuario
4. **Mobile App** - App nativa para administradores
5. **API Integrations** - Conexión con ERPs externos

### 🔐 Funcionalidades de Seguridad
1. **Audit Logs** - Registro de todas las acciones
2. **Role-based Access** - Permisos granulares por rol
3. **Two-factor Authentication** - 2FA obligatorio para admins
4. **Data Encryption** - Encriptación de datos sensibles
5. **Backup Automation** - Respaldos automáticos programados

---

**Nota**: Todos los datos mostrados son de ejemplo (mock data). En producción, estos se conectarán con las APIs del backend para mostrar datos reales de la instancia del cliente específico.

**Actualizado**: Incluye implementaciones completas de Products Management y Orders Management con todas sus funcionalidades. 