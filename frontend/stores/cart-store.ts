import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartProductDetail, CartTotalResponse, CartUser } from '@/services/cart.service';

// =============================================================================
// TIPOS
// =============================================================================

// Alias para mayor claridad
export type CartItem = CartProductDetail;

export interface CartState {
  // === DATOS DEL CARRITO ===
  items: CartItem[];
  totals: CartTotalResponse | null;
  id_carrito?: number;
  
  // === ESTADOS DE LA UI ===
  isLoading: boolean;
  error: string | null;
  isOpen: boolean; // Para sidebar del carrito
  
  // === INFORMACIÓN DEL USUARIO ===
  cartUser: CartUser;
  
  // === ACCIONES ===
  // Operaciones básicas
  setCartId: (id_carrito: number | undefined) => void;
  setItems: (items: CartItem[]) => void;
  setTotals: (totals: CartTotalResponse | null) => void;
  
  // Operaciones de productos
  addItem: (item: CartItem) => void;
  removeItem: (id_carrito_producto: number) => void;
  updateItemQuantity: (id_carrito_producto: number, cantidad: number) => void;
  clearCart: () => void;
  
  // Estados de la UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Usuario
  setCartUser: (user: CartUser) => void;
  
  // Utilidades
  getItemCount: () => number;
  getCartTotal: () => number;
  hasItems: () => boolean;
  findItem: (id_producto: number) => CartItem | undefined;
}

// =============================================================================
// STORE PRINCIPAL
// =============================================================================

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // === ESTADO INICIAL ===
      items: [],
      totals: null,
      id_carrito: undefined,
      isLoading: false,
      error: null,
      isOpen: false,
      cartUser: {
        id_usuario: undefined,
        session_id: undefined
      },
      
      // === ACCIONES BÁSICAS ===
      setCartId: (id_carrito) => set({ id_carrito }),
      
      setItems: (items) => set({ items }),
      
      setTotals: (totals) => set({ totals }),
      
      // === OPERACIONES DE PRODUCTOS ===
      addItem: (item) => set((state) => {
        if (!Array.isArray(state.items)) {
          return { items: [item] };
        }
        
        const existingIndex = state.items.findIndex(
          existing => existing.id_carrito_producto === item.id_carrito_producto
        );
        
        if (existingIndex >= 0) {
          // Actualizar item existente
          const newItems = [...state.items];
          newItems[existingIndex] = { 
            ...newItems[existingIndex], 
            cantidad: newItems[existingIndex].cantidad + item.cantidad,
            subtotal: (newItems[existingIndex].cantidad + item.cantidad) * newItems[existingIndex].precio_unitario
          };
          return { items: newItems };
        } else {
          // Agregar nuevo item
          return { items: [...state.items, item] };
        }
      }),
      
      removeItem: (id_carrito_producto) => set((state) => {
        if (!Array.isArray(state.items)) return state;
        return {
          items: state.items.filter(item => item.id_carrito_producto !== id_carrito_producto)
        };
      }),
      
      updateItemQuantity: (id_carrito_producto, cantidad) => set((state) => {
        if (!Array.isArray(state.items)) return state;
        
        const newItems = state.items.map(item =>
          item.id_carrito_producto === id_carrito_producto
            ? { 
                ...item, 
                cantidad,
                subtotal: cantidad * item.precio_unitario
              }
            : item
        );
        
        return { items: newItems };
      }),
      
      clearCart: () => set({ 
        items: [], 
        totals: null 
      }),
      
      // === ESTADOS DE LA UI ===
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      
      openCart: () => set({ isOpen: true }),
      
      closeCart: () => set({ isOpen: false }),
      
      // === USUARIO ===
      setCartUser: (cartUser) => set({ cartUser }),
      
      // === UTILIDADES ===
      getItemCount: () => {
        const state = get();
        if (!Array.isArray(state.items)) return 0;
        return state.items.reduce((total, item) => total + item.cantidad, 0);
      },
      
      getCartTotal: () => {
        const state = get();
        if (!Array.isArray(state.items)) return 0;
        return state.items.reduce((total, item) => total + item.subtotal, 0);
      },
      
      hasItems: () => {
        const state = get();
        return Array.isArray(state.items) && state.items.length > 0;
      },
      
      findItem: (id_producto) => {
        const state = get();
        if (!Array.isArray(state.items)) return undefined;
        return state.items.find(item => item.id_producto === id_producto);
      }
    }),
    {
      name: 'synkro-cart-storage', // Nombre único para el localStorage
      storage: createJSONStorage(() => localStorage),
      // Solo persistir datos importantes, no estados de UI
      partialize: (state) => ({
        items: state.items,
        totals: state.totals,
        id_carrito: state.id_carrito,
        cartUser: state.cartUser,
      }),
    }
  )
);

// =============================================================================
// SELECTORES
// =============================================================================

// Selectores para optimizar re-renders
const cartSelectors = {
  items: (state: CartState) => state.items,
  totals: (state: CartState) => state.totals,
  itemCount: (state: CartState) => state.getItemCount(),
  cartTotal: (state: CartState) => state.getCartTotal(),
  hasItems: (state: CartState) => state.hasItems(),
  isLoading: (state: CartState) => state.isLoading,
  error: (state: CartState) => state.error,
  isOpen: (state: CartState) => state.isOpen,
  cartUser: (state: CartState) => state.cartUser,
  cartInfo: (state: CartState) => ({
    itemCount: state.getItemCount(),
    total: state.getCartTotal(),
    hasItems: state.hasItems(),
    isLoading: state.isLoading,
  }),
  uiState: (state: CartState) => ({
    isOpen: state.isOpen,
    isLoading: state.isLoading,
    error: state.error,
  }),
};

// =============================================================================
// HOOKS DE CONVENIENCIA
// =============================================================================

/**
 * Hook para obtener información completa del carrito
 */
export const useCartInfo = () => useCartStore(cartSelectors.cartInfo);

/**
 * Hook para obtener solo los items del carrito
 */
export const useCartItems = () => useCartStore(cartSelectors.items);

/**
 * Hook para obtener solo el estado de la UI
 */
export const useCartUI = () => useCartStore(cartSelectors.uiState);

/**
 * Hook para obtener solo los totales
 */
export const useCartTotals = () => useCartStore(cartSelectors.totals);