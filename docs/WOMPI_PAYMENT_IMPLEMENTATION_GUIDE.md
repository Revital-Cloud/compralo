# 💳 Guía Completa de Implementación de Wompi para Pagos

## 📋 Resumen

Esta guía te explica cómo implementar y usar Wompi para el sistema de pagos del carrito en Synkro. Ya tienes la infraestructura backend implementada, ahora te explico cómo usarla y completar la integración.

## 🏗️ Arquitectura Actual

```
Frontend (Next.js)          Backend (FastAPI)           Wompi API
┌─────────────────┐        ┌─────────────────┐        ┌─────────────┐
│ payment.service  │◄──────►│ payment_router  │◄──────►│ /tokens     │
│ - Tokenización   │        │ - Métodos pago  │        │ /sources    │
│ - UI componentes │        │ - Webhooks      │        │ /transactions│
└─────────────────┘        └─────────────────┘        └─────────────┘
```

## 🔐 Configuración de Variables de Entorno

### Frontend (.env.local)
```env
# Wompi - Llave pública para tokenización en el cliente
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Backend (.env)
```env
# Wompi - Configuración del servidor
WOMPI_ENVIRONMENT=sandbox  # o 'production' para producción
WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOMPI_EVENTS_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🧪 Tarjetas de Prueba de Wompi

### Tarjetas Válidas (Sandbox)
```javascript
// Tarjeta de crédito válida
{
  "number": "4242424242424242",
  "cvc": "123",
  "exp_month": "12",
  "exp_year": "2025",
  "card_holder": "Juan Pérez"
}

// Tarjeta de débito válida
{
  "number": "4111111111111111", 
  "cvc": "123",
  "exp_month": "12",
  "exp_year": "2025",
  "card_holder": "María García"
}
```

### Tarjetas para Simular Errores
```javascript
// Tarjeta declinada
"number": "4000000000000002"

// Tarjeta con fondos insuficientes  
"number": "4000000000009995"

// Tarjeta expirada
"number": "4000000000000069"
```

## 🔄 Flujo Completo de Implementación

### 1. Tokenización de Tarjeta (Frontend)

```typescript
// frontend/services/payment.service.ts
import axios from 'axios';

const WOMPI_API_BASE_URL = 'https://sandbox.wompi.co/v1';

export const addPaymentMethod = async (cardData: {
    number: string;
    cvc: string;
    exp_month: string;
    exp_year: string;
    card_holder: string;
}) => {
    try {
        // 1. Tokenizar con Wompi (usando llave pública)
        const wompiResponse = await axios.post(
            `${WOMPI_API_BASE_URL}/tokens/cards`,
            {
                number: cardData.number.replace(/\s/g, ''),
                cvc: cardData.cvc,
                exp_month: cardData.exp_month,
                exp_year: cardData.exp_year,
                card_holder: cardData.card_holder,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY}`,
                },
            }
        );

        if (wompiResponse.data.error) {
            throw new Error(wompiResponse.data.error.reason);
        }

        const tokenData = wompiResponse.data.data;

        // 2. Enviar token a nuestro backend
        const backendResponse = await api.post('/payment/add-method', {
            card_token: tokenData.id,
            brand: tokenData.brand,
        });

        return { success: true, data: backendResponse };

    } catch (error) {
        console.error('Error adding payment method:', error);
        return { success: false, error: error.message };
    }
};
```

### 2. Guardar Método de Pago (Backend)

El backend ya está implementado en `backend/app/routers/payment_router.py`:

```python
@router.post("/add-method", summary="Agregar un nuevo método de pago")
async def add_payment_method(
    payment_data: AddPaymentMethodRequest,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    # El backend:
    # 1. Crea una fuente de pago en Wompi con el token
    # 2. Guarda los metadatos en la base de datos
    # 3. Retorna el método de pago creado
```

### 3. Listar Métodos de Pago

```typescript
// frontend/services/payment.service.ts
export const listPaymentMethods = async () => {
    try {
        const paymentMethods = await api.get('/payment/list-methods');
        return paymentMethods;
    } catch (error) {
        console.error('Error listing payment methods:', error);
        return [];
    }
};
```

### 4. Pagar una Orden

```typescript
// frontend/services/order.service.ts
export const payOrder = async (orderId: number, paymentMethodId: number) => {
    try {
        const response = await api.post(`/orders/${orderId}/pay`, {
            payment_method_id: paymentMethodId
        });
        return response;
    } catch (error) {
        console.error('Error paying order:', error);
        throw error;
    }
};
```

## 🎨 Componentes de UI Necesarios

### 1. Formulario para Agregar Tarjeta

```typescript
// components/payment/AddCardForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const cardSchema = z.object({
  number: z.string().min(16, 'Número de tarjeta inválido'),
  cvc: z.string().min(3, 'CVC inválido'),
  exp_month: z.string().min(2, 'Mes inválido'),
  exp_year: z.string().min(4, 'Año inválido'),
  card_holder: z.string().min(2, 'Nombre del titular requerido'),
});

export const AddCardForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(cardSchema)
  });

  const onSubmit = async (data) => {
    const result = await addPaymentMethod(data);
    if (result.success) {
      toast.success('Tarjeta agregada exitosamente');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('number')} placeholder="Número de tarjeta" />
      {errors.number && <span>{errors.number.message}</span>}
      
      <input {...register('cvc')} placeholder="CVC" />
      {errors.cvc && <span>{errors.cvc.message}</span>}
      
      <input {...register('exp_month')} placeholder="MM" />
      <input {...register('exp_year')} placeholder="YYYY" />
      
      <input {...register('card_holder')} placeholder="Nombre del titular" />
      {errors.card_holder && <span>{errors.card_holder.message}</span>}
      
      <button type="submit">Agregar Tarjeta</button>
    </form>
  );
};
```

### 2. Lista de Métodos de Pago

```typescript
// components/payment/PaymentMethodsList.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const PaymentMethodsList = () => {
  const queryClient = useQueryClient();
  
  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: listPaymentMethods,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods']);
      toast.success('Método de pago eliminado');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods']);
      toast.success('Método de pago establecido como predeterminado');
    },
  });

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      {paymentMethods?.map((method) => (
        <div key={method.id_metodo_pago} className="payment-method-card">
          <div>
            <span>{method.marca_tarjeta}</span>
            <span>**** {method.ultimos_cuatro_digitos}</span>
            <span>{method.es_predeterminado && '⭐ Predeterminada'}</span>
          </div>
          <div>
            <button onClick={() => setDefaultMutation.mutate(method.id_metodo_pago)}>
              Establecer como predeterminada
            </button>
            <button onClick={() => deleteMutation.mutate(method.id_metodo_pago)}>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🛒 Integración con el Carrito

### 1. Página de Checkout

```typescript
// app/(shop)/checkout/page.tsx
import { useCartStore } from '@/stores/cart-store';
import { PaymentMethodsList } from '@/components/payment/PaymentMethodsList';

export default function CheckoutPage() {
  const { items, totals } = useCartStore();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Selecciona un método de pago');
      return;
    }

    try {
      // 1. Crear orden desde el carrito
      const orderResponse = await createOrder({
        items: items,
        total: totals?.total_final,
        // ... otros datos de la orden
      });

      // 2. Pagar la orden
      const paymentResponse = await payOrder(orderResponse.id_orden, selectedPaymentMethod);
      
      if (paymentResponse.status === 'APPROVED') {
        toast.success('Pago exitoso');
        // Redirigir a página de confirmación
        router.push('/checkout/success');
      } else {
        toast.error('El pago fue declinado');
      }
    } catch (error) {
      toast.error('Error procesando el pago');
    }
  };

  return (
    <div className="checkout-page">
      <h1>Finalizar Compra</h1>
      
      {/* Resumen del carrito */}
      <div className="cart-summary">
        {items.map(item => (
          <div key={item.id_carrito_producto}>
            {item.nom_producto} - ${item.precio_unitario} x {item.cantidad}
          </div>
        ))}
        <div>Total: ${totals?.total_final}</div>
      </div>

      {/* Selección de método de pago */}
      <div className="payment-section">
        <h2>Método de Pago</h2>
        <PaymentMethodsList />
        <AddCardForm />
      </div>

      <button onClick={handlePayment} disabled={!selectedPaymentMethod}>
        Pagar Ahora
      </button>
    </div>
  );
}
```

## 🔧 Endpoints del Backend Disponibles

### Métodos de Pago
- `POST /payment/add-method` - Agregar método de pago
- `GET /payment/list-methods` - Listar métodos de pago
- `DELETE /payment/delete-method/{id}` - Eliminar método de pago
- `PUT /payment/set-default-method/{id}` - Establecer método predeterminado

### Órdenes y Pagos
- `POST /orders` - Crear orden desde carrito
- `POST /orders/{order_id}/pay` - Pagar orden con método guardado
- `POST /payment/webhook` - Webhook de Wompi (ya implementado)

## 🚨 Manejo de Errores

### Errores de Tokenización
```typescript
// En el frontend
if (wompiResponse.data.error) {
  const errorMessage = wompiResponse.data.error.messages?.card_holder?.[0] 
    || wompiResponse.data.error.reason 
    || "Error de validación de Wompi.";
  return { success: false, error: errorMessage };
}
```

### Errores de Pago
```typescript
// Estados de transacción de Wompi
const transactionStatus = {
  'APPROVED': 'Pago aprobado',
  'DECLINED': 'Pago declinado',
  'VOIDED': 'Pago anulado',
  'ERROR': 'Error en el pago'
};
```

## 📱 Estados de Pago

### Estados Inmediatos (Respuesta de Wompi)
- `APPROVED` - Pago exitoso
- `DECLINED` - Pago rechazado
- `VOIDED` - Pago anulado
- `ERROR` - Error en el procesamiento

### Estados Asíncronos (Webhooks)
- `PENDING` - Pago pendiente (ej. PSE)
- `APPROVED` - Pago confirmado
- `DECLINED` - Pago rechazado definitivamente

## 🧪 Testing con Tarjetas de Prueba

### Configuración de Testing
1. Asegúrate de tener `WOMPI_ENVIRONMENT=sandbox` en tu `.env`
2. Usa las tarjetas de prueba proporcionadas
3. Verifica que los webhooks estén configurados en el dashboard de Wompi

### Casos de Prueba
```javascript
// Casos de prueba recomendados
const testCases = [
  {
    name: 'Pago exitoso',
    card: '4242424242424242',
    expected: 'APPROVED'
  },
  {
    name: 'Pago declinado',
    card: '4000000000000002',
    expected: 'DECLINED'
  },
  {
    name: 'Fondos insuficientes',
    card: '4000000000009995',
    expected: 'DECLINED'
  }
];
```

## 🚀 Próximos Pasos

1. **Implementar UI de checkout** - Crear la página de checkout completa
2. **Integrar con carrito** - Conectar el flujo de pago con el carrito existente
3. **Testing exhaustivo** - Probar todos los casos de pago
4. **Configurar webhooks** - Asegurar que los webhooks estén funcionando
5. **Preparar para producción** - Cambiar a `WOMPI_ENVIRONMENT=production`

## 📞 Soporte

Si tienes problemas con la implementación:
1. Revisa los logs del backend para errores de Wompi
2. Verifica que las variables de entorno estén correctas
3. Usa las tarjetas de prueba para validar el flujo
4. Consulta la documentación oficial de Wompi

---

**¡Tu sistema de pagos con Wompi está listo para usar!** 🎉
