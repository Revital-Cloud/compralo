# Plan de Implementación del Frontend

Este documento detalla las funcionalidades del backend que están listas para ser integradas en el frontend. El objetivo es proporcionar una hoja de ruta clara para los desarrolladores de frontend.

## 1. Gestión del Carrito de Compras (`cart_product_router.py`)

El backend ya proporciona un conjunto completo de endpoints para gestionar el ciclo de vida del carrito de compras.

-   **Obtener/Crear Carrito:**
    -   **Endpoint:** `POST /api/carrito-usuario`
    -   **Funcionalidad:** Solicita el carrito de un usuario (registrado o anónimo). Si no existe, el backend lo crea automáticamente. Es el primer paso para cualquier operación del carrito.

-   **Añadir y Eliminar Productos:**
    -   **Endpoint Añadir:** `POST /api/carrito-productos`
    -   **Endpoint Eliminar:** `DELETE /api/carrito-productos/{ids...}`
    -   **Funcionalidad:** Permite implementar la lógica para que los usuarios añadan o quiten productos de su carrito.

-   **Ver Contenido Detallado del Carrito:**
    -   **Endpoint:** `POST /api/carrito-productos-detalle`
    -   **Funcionalidad:** Devuelve una lista completa de los productos en el carrito con todos sus detalles (nombre, imagen, precio, cantidad, etc.).

-   **Cálculo Dinámico de Totales:**
    -   **Endpoint:** `POST /api/calcular-total`
    -   **Funcionalidad:** Calcula el desglose completo del costo del carrito, incluyendo:
        -   Subtotal de productos.
        -   Total de descuentos (automáticos y por cupones/puntos).
        -   Costo de envío.
        -   Impuestos.
        -   Total final a pagar.
        -   Puntos de lealtad que se ganarán con la compra.
        -   Mensajes informativos sobre las ofertas aplicadas.

-   **Migración de Carrito Anónimo:**
    -   **Endpoint:** `POST /api/migrar`
    -   **Funcionalidad:** Cuando un usuario anónimo inicia sesión o se registra, este endpoint transfiere los productos de su carrito temporal a su cuenta de usuario permanente.

## 2. Gestión de Métodos de Pago (`payment_router.py`)

Se ha implementado una integración segura con Wompi para la tokenización y gestión de tarjetas.

-   **Guardar Tarjetas:**
    -   **Endpoint:** `POST /api/payment-methods`
    -   **Funcionalidad:** Permite a los usuarios agregar y guardar de forma segura sus tarjetas de crédito/débito. El frontend solo necesita recolectar los datos y enviarlos a Wompi para obtener un token, que luego se envía al backend.

-   **Listar Tarjetas Guardadas:**
    -   **Endpoint:** `GET /api/payment-methods`
    -   **Funcionalidad:** Obtiene la lista de tarjetas que un usuario ha guardado previamente. Ideal para mostrar en el perfil del usuario o en la página de checkout.

-   **Eliminar Tarjetas:**
    -   **Endpoint:** `DELETE /api/payment-methods/{payment_method_id}`
    -   **Funcionalidad:** Permite a los usuarios eliminar tarjetas que ya no deseen usar.

-   **Establecer Tarjeta Predeterminada:**
    -   **Endpoint:** `PUT /api/payment-methods/{payment_method_id}/default`
    -   **Funcionalidad:** Permite al usuario marcar una tarjeta como la opción por defecto para agilizar pagos futuros.

## 3. Flujo de Pago (`order_router.py` y `payment_router.py`)

El backend orquesta el proceso final de conversión de un carrito a una venta.

-   **Creación de Órdenes:**
    -   **Endpoint:** `POST /api/orders` (Asumiendo por el `order_router.py`)
    -   **Funcionalidad:** Convierte el carrito de compras actual en una orden de pedido formal en la base de datos. Este es el paso **indispensable** antes de intentar realizar un pago. El endpoint devuelve el `id_orden` de la nueva orden.

-   **Iniciar el Pago de una Orden:**
    -   **Endpoint:** `POST /api/orders/{id_orden}/pay`
    -   **Funcionalidad:** Es la llamada final. Recibe el `id_orden` y el `id_metodo_pago_usuario` (la tarjeta seleccionada por el usuario). El backend se encarga de comunicarse con Wompi para procesar el cobro. La confirmación del pago llega a través de un webhook. 