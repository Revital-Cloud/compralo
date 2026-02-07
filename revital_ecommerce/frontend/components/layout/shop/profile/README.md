# Profile Components - Componentes Atomizados 👤

**Componentes modulares para la gestión de perfiles de usuario**

Los componentes de perfil han sido atomizados para mejorar la modularidad, mantenibilidad y organización del código. Cada componente es independiente y reutilizable.

## Estructura

```
profile/
├── components/
│   ├── profile-header.tsx       # Header con información del usuario
│   ├── profile-tab.tsx          # Tab de información personal
│   ├── orders-tab.tsx           # Tab de historial de órdenes
│   ├── addresses-tab.tsx        # Tab de direcciones
│   ├── payment-tab.tsx          # Tab de métodos de pago
│   ├── wishlist-tab.tsx         # Tab de lista de deseos
│   ├── settings-tab.tsx         # Tab de configuraciones
│   └── index.ts                # Exportaciones centralizadas
└── README.md                   # Esta documentación
```

## Componentes

### ProfileHeader
- Header principal con avatar, información y botón de edición
- Maneja estados de edición
- Avatar con iniciales automáticas

### ProfileTab
- Formulario de información personal
- Estadísticas de cuenta
- Validación con react-hook-form y Zod
- Estados de solo lectura y edición

### OrdersTab
- Historial de compras del usuario
- Estado vacío con placeholder
- Listo para integrar con API de órdenes

### AddressesTab
- Gestión de direcciones de envío
- Botón para agregar nuevas direcciones
- Estado vacío con placeholder

### PaymentTab
- Gestión de métodos de pago
- Botón para agregar nuevas tarjetas
- Estado vacío con placeholder

### WishlistTab
- Lista de productos favoritos
- Estado vacío con placeholder
- Listo para integrar con sistema de favoritos

### SettingsTab
- Configuraciones de notificaciones
- Opciones de privacidad y seguridad
- Zona de peligro para eliminar cuenta

## Beneficios de la Atomización

1. **Modularidad**: Cada tab es independiente y reutilizable
2. **Mantenimiento**: Cambios aislados por componente
3. **Testing**: Testing unitario más fácil
4. **Code Splitting**: Carga optimizada de componentes
5. **Desarrollo en Paralelo**: Equipos pueden trabajar en tabs diferentes
6. **Reutilización**: Componentes pueden usarse en otras partes

## Props Interfaces

### ProfileHeaderProps
```typescript
interface ProfileHeaderProps {
  user: User;
  isEditing: boolean;
  onEditToggle: () => void;
}
```

### ProfileTabProps
```typescript
interface ProfileTabProps {
  user: User;
  form: UseFormReturn<z.infer<typeof profileSchema>>;
  isEditing: boolean;
  onSubmit: (values: z.infer<typeof profileSchema>) => void;
}
```

## Uso

```tsx
import {
  ProfileHeader,
  ProfileTab,
  OrdersTab,
  AddressesTab,
  PaymentTab,
  WishlistTab,
  SettingsTab
} from '@/components/layout/shop/profile'

// En la página principal
<ProfileHeader 
  user={user} 
  isEditing={isEditing} 
  onEditToggle={handleEditToggle} 
/>

<Tabs defaultValue="profile">
  <TabsContent value="profile">
    <ProfileTab 
      user={user}
      form={form}
      isEditing={isEditing}
      onSubmit={onSubmit}
    />
  </TabsContent>
  
  <TabsContent value="orders">
    <OrdersTab />
  </TabsContent>
  
  // ... otros tabs
</Tabs>
```

## Dark Mode

Todos los componentes soportan dark mode usando las clases de Tailwind:
- `bg-card` para fondos de tarjetas
- `text-foreground` para textos principales
- `text-muted-foreground` para textos secundarios
- Variables CSS automáticas para temas

## 🚀 Próximas Mejoras

- [ ] Integración con APIs reales
- [ ] Estados de carga mejorados
- [ ] Validación mejorada con Zod
- [ ] Animaciones de transición con Framer Motion
- [ ] Componentes más granulares
- [ ] Tests unitarios con Vitest
- [ ] Storybook documentation
- [ ] Internacionalización (i18n)

## 📚 Documentación Relacionada

- [Frontend E-commerce README](../../../../README.md)
- [Componentes de Layout](../README.md)
- [Sistema de Autenticación](../../../../Docs/AUTH_GUIDE.md)

---

**Profile Components** - Componentes modulares para gestión de perfiles 👤 