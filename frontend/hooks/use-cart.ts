import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import * as cartService from '@/services/cart.service';
import { formatPrice } from '@/utils/format-price';

// =============================================================================
// TIPOS Y CONSTANTES
// =============================================================================

const CART_KEYS = {
  all: ['cart'] as const,
  cart: (cartUser: cartService.CartUser) => ['cart', 'info', cartUser] as const,
  products: (cartUser: cartService.CartUser) => ['cart', 'products', cartUser] as const,
  totals: (cartUser: cartService.CartUser) => ['cart', 'totals', cartUser] as const,
};

// =============================================================================
// FUNCIONES HELPER
// =============================================================================

/**
 * Valida si agregar un producto excedería el límite del carrito
 */
function validateCartLimit(currentTotal: number, productPrice: number, quantity: number): string | null {
  const newTotal = currentTotal + (productPrice * quantity);
  if (newTotal > cartService.CART_LIMITS.MAX_TOTAL) {
    return `Límite de carrito alcanzado. El máximo permitido es ${formatPrice(cartService.CART_LIMITS.MAX_TOTAL)}`;
  }
  return null;
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useCart() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  // Estado del store
  const {
    items,
    totals,
    isLoading: storeLoading,
    error: storeError,
    cartUser,
    id_carrito,
    
    // Acciones del store
    setCartId,
    setItems,
    setTotals,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    setLoading,
    setError,
    setCartUser,
    
    // Utilidades
    getItemCount,
    getCartTotal,
    hasItems,
    findItem
  } = useCartStore();

  // =============================================================================
  // INICIALIZACIÓN DEL USUARIO DEL CARRITO
  // =============================================================================

  const currentCartUser: cartService.CartUser = authUser?.id_usuario 
    ? { id_usuario: authUser.id_usuario }
    : { session_id: cartUser.session_id || cartService.generateSessionId() };

  // Sincronizar usuario del carrito con el store
  useEffect(() => {
    if (!authUser?.id_usuario && !cartUser.session_id) {
      const newSessionId = cartService.generateSessionId();
      setCartUser({ session_id: newSessionId });
    } else if (authUser?.id_usuario && !cartUser.id_usuario) {
      setCartUser({ id_usuario: authUser.id_usuario });
    }
  }, [authUser?.id_usuario, cartUser, setCartUser]);

  // =============================================================================
  // QUERIES
  // =============================================================================

  /**
   * Query para obtener o crear el carrito del usuario
   */
  const {
    data: cartData,
    isLoading: isLoadingCart,
    error: cartError
  } = useQuery({
    queryKey: CART_KEYS.cart(currentCartUser),
    queryFn: () => cartService.getOrCreateCart(currentCartUser),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  /**
   * Query para obtener los productos del carrito
   */
  const {
    data: cartProducts,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts
  } = useQuery({
    queryKey: CART_KEYS.products(currentCartUser),
    queryFn: () => cartService.getCartProductsDetail(currentCartUser),
    enabled: !!cartData?.id_carrito,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });

  // Efectos para sincronizar el estado
  useEffect(() => {
    if (cartData?.id_carrito && cartData.id_carrito !== id_carrito) {
      setCartId(cartData.id_carrito);
    }
  }, [cartData?.id_carrito, id_carrito, setCartId]);

  useEffect(() => {
    if (cartProducts && Array.isArray(cartProducts)) {
      // Solo actualizar si realmente cambió la longitud o los IDs
      const currentIds = Array.isArray(items) ? items.map(item => item.id_carrito_producto).sort().join(',') : '';
      const newIds = cartProducts.map(item => item.id_carrito_producto).sort().join(',');
      
      if (currentIds !== newIds || (Array.isArray(items) ? items.length : 0) !== cartProducts.length) {
        console.log('🛒 Actualizando productos del carrito:', cartProducts);
        setItems(cartProducts);
        
        // Si no hay productos, limpiar totales
        if (cartProducts.length === 0) {
          setTotals(null);
        }
      }
    } else if (!cartProducts) {
      // Si la respuesta es null o array vacío, limpiar todo
      if (Array.isArray(items) && items.length > 0) {
        setItems([]);
      }
      if (totals !== null) {
        setTotals(null);
      }
    }
  }, [cartProducts, items, setItems, totals, setTotals]);

  /**
   * Query para obtener los totales del carrito
   */
  const {
    data: cartTotals,
    isLoading: isLoadingTotals,
    error: totalsError,
    refetch: refetchTotals
  } = useQuery({
    queryKey: CART_KEYS.totals(currentCartUser),
    queryFn: () => cartService.calculateCartTotal(currentCartUser),
    enabled: !!cartData?.id_carrito && hasItems(),
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (cartTotals && cartTotals.total_final !== totals?.total_final) {
      console.log('🧮 Actualizando totales del carrito:', cartTotals);
      setTotals(cartTotals);
    }
  }, [cartTotals, totals?.total_final, setTotals]);

  // =============================================================================
  // MUTATIONS
  // =============================================================================

  /**
   * Mutación para agregar producto al carrito
   */
  const addToCartMutation = useMutation({
    mutationFn: (product: cartService.CartProductCreate) => {
      // Validar límite del carrito
      const currentTotal = getCartTotal();
      const limitError = validateCartLimit(currentTotal, product.precio_unitario_carrito, product.cantidad);
      if (limitError) {
        throw new Error(limitError);
      }
      
      const productWithUser = {
        ...product,
        ...currentCartUser
      };
      return cartService.addToCart(productWithUser);
    },
    onMutate: async (product) => {
      // Optimistic update
      setLoading(true);
      
      // Crear item temporal para el store
      const tempItem: cartService.CartProductDetail = {
        id_carrito_producto: Date.now(), // ID temporal
        id_producto: product.id_producto,
        nombre_producto: 'Cargando...', // Se actualizará cuando llegue la respuesta
        precio_unitario: product.precio_unitario_carrito || 0,
        cantidad: product.cantidad,
        subtotal: (product.precio_unitario_carrito || 0) * product.cantidad,
      };
      
      addItem(tempItem);
    },
    onSuccess: () => {
      // Refrescar datos del servidor
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      console.error('Error al agregar producto:', error);
      // Mostrar errores relevantes al usuario (stock y límite)
      if (error.message?.includes('Stock insuficiente') || error.message?.includes('Límite de carrito alcanzado')) {
        setError(error.message);
      } else {
        setError(null); // No mostrar otros errores técnicos
      }
      // Revertir optimistic update
      refetchProducts();
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  /**
   * Mutación para actualizar cantidad de producto
   */
  const updateQuantityMutation = useMutation({
    mutationFn: ({ id_carrito_producto, cantidad, stock_disponible }: { 
      id_carrito_producto: number, 
      cantidad: number,
      stock_disponible?: number
    }) => {
      // Validar stock en frontend antes de enviar
      if (stock_disponible !== undefined && cantidad > stock_disponible) {
        throw new Error(`Stock insuficiente. Disponible: ${stock_disponible}, solicitado: ${cantidad}`);
      }
      
      if (cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }
      
      // Validar límite del carrito
      const currentItem = items.find(item => item.id_carrito_producto === id_carrito_producto);
      if (currentItem) {
        const currentTotal = getCartTotal();
        const currentItemTotal = currentItem.precio_unitario * currentItem.cantidad;
        const newItemTotal = currentItem.precio_unitario * cantidad;
        const totalWithoutCurrentItem = currentTotal - currentItemTotal;
        const newTotal = totalWithoutCurrentItem + newItemTotal;
        
        if (newTotal > cartService.CART_LIMITS.MAX_TOTAL) {
          throw new Error(`Límite de carrito alcanzado. El máximo permitido es ${formatPrice(cartService.CART_LIMITS.MAX_TOTAL)}`);
        }
      }
      
      return cartService.updateCartItemQuantity(id_carrito_producto, cantidad);
    },
    onMutate: async ({ id_carrito_producto, cantidad }) => {
      // Optimistic update
      updateItemQuantity(id_carrito_producto, cantidad);
    },
    onSuccess: () => {
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      console.error('Error al actualizar cantidad:', error);
      // Mostrar errores relevantes al usuario (stock, límite y cantidad)
      if (error.message?.includes('Stock insuficiente') || 
          error.message?.includes('cantidad debe ser mayor') || 
          error.message?.includes('Límite de carrito alcanzado')) {
        setError(error.message);
      } else {
        setError(null);
      }
      // Revertir cambios
      refetchProducts();
    }
  });

  /**
   * Mutación para eliminar producto del carrito
   */
  const removeFromCartMutation = useMutation({
    mutationFn: (id_carrito_producto: number) => {
      return cartService.removeFromCart(id_carrito_producto, currentCartUser.id_usuario);
    },
    onMutate: async (id_carrito_producto) => {
      // Optimistic update
      removeItem(id_carrito_producto);
    },
    onSuccess: () => {
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || 'Error al eliminar producto');
      // Revertir cambios
      refetchProducts();
    }
  });

  /**
   * Mutación para limpiar carrito
   */
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      // Eliminar todos los productos uno por uno
      const promises = items.map(item => 
        cartService.removeFromCart(item.id_carrito_producto, currentCartUser.id_usuario)
      );
      await Promise.all(promises);
    },
    onMutate: async () => {
      // Optimistic update
      clearCart();
    },
    onSuccess: () => {
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || 'Error al limpiar carrito');
      refetchProducts();
    }
  });

  /**
   * Mutación para migrar carrito anónimo
   */
  const migrateCartMutation = useMutation({
    mutationFn: (migrateData: cartService.MigrateCartRequest) => {
      return cartService.migrateAnonymousCart(migrateData);
    },
    onSuccess: () => {
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || 'Error al migrar carrito');
    }
  });

  // =============================================================================
  // ESTADOS COMBINADOS
  // =============================================================================
  
  const isLoading = storeLoading || isLoadingCart || isLoadingProducts || isLoadingTotals;
  const error = storeError || cartError || productsError || totalsError;
  const total = getCartTotal();
  const itemCount = getItemCount();

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // === DATOS ===
    items,
    totals,
    itemCount,
    total,
    hasItems,
    isLoading,
    error,
    cartUser: currentCartUser,
    id_carrito,

    // === ACCIONES ===
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    migrateCart: migrateCartMutation.mutate,

    // === UTILIDADES ===
    findItem,
    refetchCart: () => {
      refetchProducts();
      refetchTotals();
    },

    // === ESTADOS DE LAS MUTACIONES ===
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
    isMigratingCart: migrateCartMutation.isPending,
  };
}

// =============================================================================
// HOOKS DE CONVENIENCIA
// =============================================================================

/**
 * Hook para obtener solo información básica del carrito
 */
export function useCartInfo() {
  const { itemCount, total, isLoading } = useCart();
  return { itemCount, total, isLoading };
}

/**
 * Hook para verificar si un producto está en el carrito
 */
export function useIsInCart(productId: number) {
  const { findItem } = useCart();
  return !!findItem(productId);
}

/**
 * Hook para obtener la cantidad de un producto en el carrito
 */
export function useProductQuantityInCart(productId: number) {
  const { findItem } = useCart();
  const item = findItem(productId);
  return item?.cantidad || 0;
}