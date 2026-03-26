import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCartStore, clearCartStorage } from "@/stores/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import * as cartService from "@/services/cart.service";
import { formatPrice } from "@/utils/format-price";
import { toUserSafeApiDetail } from "@/utils/api-error-message";
import { toast } from "sonner";

/**
 * Mapa del hook `useCart`.
 *
 * Responsabilidad:
 * - Orquestar estado local (Zustand) + estado remoto (React Query) del carrito.
 * - Soportar flujo mixto anónimo/autenticado y migración al hacer login.
 * - Exponer acciones de mutación (agregar, actualizar, eliminar, limpiar, migrar).
 *
 * Fuente de verdad:
 * - Backend vía `cart.service` + caché de React Query.
 * - Estado UI sincronizado en `cart-store`.
 */

// =============================================================================
// TIPOS Y CONSTANTES
// =============================================================================

const CART_KEYS = {
  all: ["cart"] as const,
  cart: (cartUser: cartService.CartUser) => ["cart", "info", cartUser] as const,
  products: (cartUser: cartService.CartUser) =>
    ["cart", "products", cartUser] as const,
  totals: (cartUser: cartService.CartUser, id_canje?: number | null) =>
    ["cart", "totals", cartUser, id_canje ?? null] as const,
};

// =============================================================================
// FUNCIONES HELPER
// =============================================================================

/**
 * Valida si agregar un producto excedería el límite del carrito
 */
function validateCartLimit(
  currentTotal: number,
  productPrice: number,
  quantity: number
): string | null {
  const newTotal = currentTotal + productPrice * quantity;

  if (newTotal > cartService.CART_LIMITS.MAX_TOTAL) {
    return `Límite de carrito alcanzado. El máximo permitido es ${formatPrice(
      cartService.CART_LIMITS.MAX_TOTAL
    )}`;
  }
  return null;
}

/**
 * Valida si el carrito migrado excede el límite y muestra alerta
 */
function validateCartLimitAfterMigration(currentTotal: number): boolean {
  if (currentTotal > cartService.CART_LIMITS.MAX_TOTAL) {
    const limitFormatted = formatPrice(cartService.CART_LIMITS.MAX_TOTAL);
    const currentFormatted = formatPrice(currentTotal);

    toast.error("Límite de carrito excedido", {
      description: `El total de tu carrito (${currentFormatted}) excede el límite máximo permitido (${limitFormatted}). Por favor, elimina algunos productos del carrito para continuar.`,
      duration: 8000,
    });

    return true; // Indica que se excedió el límite
  }

  return false; // No se excedió el límite
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useCart() {
  const queryClient = useQueryClient();
  const { user: authUser, isAuthenticated } = useAuth();

  // Estado del store
  const {
    items,
    totals,
    isLoading: storeLoading,
    error: storeError,
    cartUser,
    id_carrito,
    selectedCanjeId,

    // Acciones del store
    setCartId,
    setItems,
    setTotals,
    setSelectedCanjeId,
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
    findItem,
  } = useCartStore();

  // =============================================================================
  // INICIALIZACIÓN DEL CONTEXTO DE CARRITO (USUARIO O SESIÓN ANÓNIMA)
  // =============================================================================
  // Ref estable para session_id anónimo: evita que cada render genere un ID distinto
  // y que la query del carrito cambie de key constantemente (bloqueando la vista).
  const anonymousSessionIdRef = useRef<string | null>(null);

  const currentCartUser: cartService.CartUser = useMemo(() => {
    if (authUser?.id_usuario) {
      return { id_usuario: authUser.id_usuario };
    }
    const sid =
      cartUser.session_id ??
      (anonymousSessionIdRef.current ??= cartService.generateSessionId());
    return { session_id: sid };
  }, [authUser?.id_usuario, cartUser.session_id]);

  // =============================================================================
  // MUTACIÓN PARA MIGRAR CARRITO (definida antes del useEffect)
  // =============================================================================

  /**
   * Estado para controlar si se está migrando
   */
  const [isMigrating, setIsMigrating] = useState(false);

  /**
   * Estado para controlar errores 400 consecutivos
   */
  const [has400Error, setHas400Error] = useState(false);
  const [cartExceedsLimit, setCartExceedsLimit] = useState(false);

  /**
   * Mutación para migrar carrito anónimo
   */
  const migrateCartMutation = useMutation({
    mutationFn: async (migrateData: cartService.MigrateCartRequest) => {
      // La validación ya se hizo antes de llamar a esta mutación
      return cartService.migrateAnonymousCart(migrateData);
    },
    onSuccess: () => {
      console.log("✅ Migración exitosa - refrescando datos");
      setIsMigrating(false);
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      console.error("❌ Error en migración:", error);
      setIsMigrating(false);
      setError(error.message || "Error al migrar carrito");
    },
  });

  // =============================================================================
  // QUERIES
  // =============================================================================

  /**
   * Query para obtener o crear el carrito del usuario
   */
  const {
    data: cartData,
    isLoading: isLoadingCart,
    error: cartError,
  } = useQuery({
    queryKey: CART_KEYS.cart(currentCartUser),
    queryFn: async () => {
      console.log("🛒 Obteniendo/creando carrito para:", currentCartUser);
      const result = await cartService.getOrCreateCart(currentCartUser);
      console.log("🛒 Carrito obtenido/creado:", result);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  /**
   * Query para obtener los productos del carrito
   */
  const {
    data: cartProducts,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: CART_KEYS.products(currentCartUser),
    queryFn: async () => {
      console.log("🔍 Obteniendo productos del carrito para:", currentCartUser);
      try {
        const result = await cartService.getCartProductsDetail(currentCartUser);
        console.log("📦 Productos obtenidos del servidor:", result);
        return result;
      } catch (error: any) {
        console.error("❌ Error al obtener productos del carrito:", error);
        // Si es un error 400, retornar array vacío en lugar de lanzar error
        if (error?.response?.status === 400) {
          console.log("🛒 Error 400 - retornando carrito vacío");
          return [];
        }
        throw error;
      }
    },
    enabled: !!cartData?.id_carrito && !has400Error,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      // No reintentar si es error 400 (Bad Request)
      if (error?.response?.status === 400) {
        setHas400Error(true);
        return false;
      }
      // Reintentar máximo 1 vez para otros errores
      return failureCount < 1;
    },
  });

  /**
   * Query para obtener los productos del carrito con información básica (marca y color)
   */
  const {
    data: cartProductsWithBasic,
    isLoading: isLoadingProductsWithBasic,
    error: productsWithBasicError,
    refetch: refetchProductsWithBasic,
  } = useQuery({
    queryKey: [...CART_KEYS.products(currentCartUser), "with-basic"],
    queryFn: async () => {
      console.log("🔍 Obteniendo productos del carrito con info básica para:", currentCartUser);
      try {
        const result = await cartService.getCartProductsWithBasicInfo(currentCartUser);
        console.log("📦 Productos con info básica obtenidos del servidor:", result);
        return result;
      } catch (error: any) {
        console.error("❌ Error al obtener productos del carrito con info básica:", error);
        // Si es un error 400, retornar array vacío en lugar de lanzar error
        if (error?.response?.status === 400) {
          console.log("🛒 Error 400 - retornando carrito vacío");
          return [];
        }
        throw error;
      }
    },
    enabled: !!cartData?.id_carrito && !has400Error,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      // No reintentar si es error 400 (Bad Request)
      if (error?.response?.status === 400) {
        setHas400Error(true);
        return false;
      }
      // Reintentar máximo 1 vez para otros errores
      return failureCount < 1;
    },
  });


  // =============================================================================
  // MIGRACIÓN AUTOMÁTICA ANÓNIMO -> AUTENTICADO
  // =============================================================================

  // Sincronizar usuario del carrito con el store y manejar migración
  useEffect(() => {
    console.log("🔄 [MIGRATION] useEffect ejecutándose:", {
      authUser: authUser?.id_usuario,
      isAuthenticated,
      cartUser,
      id_carrito,
      isMigrating,
      isPending: migrateCartMutation.isPending,
    });

    // Resetear estado de error 400 cuando cambia el usuario
    if (has400Error) {
      setHas400Error(false);
    }

    // Evitar ejecutar si ya se está migrando o si la mutación está pendiente
    if (isMigrating || migrateCartMutation.isPending) {
      return;
    }

    if (!authUser?.id_usuario && !cartUser.session_id) {
      // Usuario anónimo sin session_id: usar el mismo ID estable del ref para persistir
      const stableId =
        anonymousSessionIdRef.current ?? cartService.generateSessionId();
      if (!anonymousSessionIdRef.current) {
        anonymousSessionIdRef.current = stableId;
      }
      console.log(
        "🛒 Persistiendo session_id para usuario anónimo:",
        stableId
      );
      setCartUser({ session_id: stableId });
    } else if (
      authUser?.id_usuario &&
      isAuthenticated &&
      cartUser.session_id &&
      !cartUser.id_usuario
    ) {
      // Usuario se acaba de autenticar y tenía carrito anónimo - migrar
      console.log(
        "🔄 Detectado login - migrando carrito anónimo a usuario autenticado"
      );

      if (id_carrito) {
        setIsMigrating(true);
        const migrateData: cartService.MigrateCartRequest = {
          id_carrito: id_carrito,
        };

        migrateCartMutation.mutate(migrateData, {
          onSuccess: () => {
            console.log("✅ Carrito migrado exitosamente");
            // Actualizar el cartUser a usuario autenticado
            setCartUser({ id_usuario: authUser.id_usuario });
            // Refrescar datos del carrito usando queryClient
            queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
            // Resetear el estado de migración
            setIsMigrating(false);

            // Validar límite después de la migración (solo una vez)
            setTimeout(() => {
              const currentTotal = getCartTotal();
              console.log(
                "🔍 [POST-MIGRATION] Validando límite después de migración:",
                {
                  currentTotal,
                  limit: cartService.CART_LIMITS.MAX_TOTAL,
                  exceeds: currentTotal > cartService.CART_LIMITS.MAX_TOTAL,
                }
              );

              if (currentTotal > cartService.CART_LIMITS.MAX_TOTAL) {
                const limitFormatted = formatPrice(
                  cartService.CART_LIMITS.MAX_TOTAL
                );
                const currentFormatted = formatPrice(currentTotal);

                // Mostrar toast de error con información detallada
                toast.error("Límite de carrito excedido", {
                  description: `El total de tu carrito (${currentFormatted}) excede el límite máximo permitido (${limitFormatted}). Por favor, elimina algunos productos del carrito para continuar.`,
                  duration: 8000,
                });

                setCartExceedsLimit(true);
              } else {
                setCartExceedsLimit(false);
              }
            }, 1000); // Esperar un poco para que se actualicen los datos
          },
          onError: (error) => {
            console.error("❌ Error al migrar carrito:", error);
            // Aún así actualizar a usuario autenticado
            setCartUser({ id_usuario: authUser.id_usuario });
            // Resetear el estado de migración para evitar bucle infinito
            setIsMigrating(false);
          },
        });
      } else {
        // No hay carrito para migrar, solo actualizar usuario
        setCartUser({ id_usuario: authUser.id_usuario });
      }
    } else if (
      authUser?.id_usuario &&
      !cartUser.session_id &&
      !cartUser.id_usuario
    ) {
      // Usuario autenticado sin carrito configurado
      setCartUser({ id_usuario: authUser.id_usuario });
    }
  }, [
    authUser?.id_usuario,
    isAuthenticated,
    cartUser.session_id,
    cartUser.id_usuario,
    setCartUser,
    id_carrito,
    isMigrating,
    migrateCartMutation.isPending,
    has400Error,
  ]);

  // =============================================================================
  // VALIDACIÓN DE LÍMITE DEL CARRITO
  // =============================================================================

  // Validar límite del carrito solo para usuarios autenticados
  useEffect(() => {
    // Solo validar si:
    // 1. El usuario está autenticado (no anónimo)
    // 2. Hay productos en el carrito
    // 3. No está en proceso de migración
    // 4. El carrito pertenece al usuario autenticado
    if (
      isAuthenticated &&
      authUser?.id_usuario &&
      items.length > 0 &&
      !isMigrating &&
      cartUser.id_usuario === authUser.id_usuario
    ) {
      const currentTotal = getCartTotal();
      console.log("🔍 [CART LIMIT] Validando límite del carrito:", {
        currentTotal,
        limit: cartService.CART_LIMITS.MAX_TOTAL,
        exceeds: currentTotal > cartService.CART_LIMITS.MAX_TOTAL,
      });

      if (currentTotal > cartService.CART_LIMITS.MAX_TOTAL) {
        setCartExceedsLimit(true);
      } else {
        setCartExceedsLimit(false);
      }
    } else {
      // Si no cumple las condiciones, resetear el estado
      setCartExceedsLimit(false);
    }
  }, [
    items,
    isMigrating,
    isAuthenticated,
    authUser?.id_usuario,
    cartUser.id_usuario,
  ]);

  // =============================================================================
  // EFECTOS PARA SINCRONIZAR ESTADO
  // =============================================================================

  // Efectos para sincronizar el estado
  useEffect(() => {
    if (cartData?.id_carrito && cartData.id_carrito !== id_carrito) {
      setCartId(cartData.id_carrito);
    }
  }, [cartData?.id_carrito, id_carrito, setCartId]);

  // Limpiar estado cuando hay errores 400 persistentes
  useEffect(() => {
    if (has400Error) {
      console.log("🧹 Limpiando estado debido a errores 400 persistentes");
      setItems([]);
      setTotals(null);
      setError(
        "Error de conexión con el servidor. Por favor, recarga la página."
      );
    }
  }, [has400Error, setItems, setTotals, setError]);

  useEffect(() => {
    if (cartProducts && Array.isArray(cartProducts)) {
      // Solo actualizar si realmente cambió la longitud o los IDs
      const currentIds = Array.isArray(items)
        ? items
            .map((item) => item.id_carrito_producto)
            .sort()
            .join(",")
        : "";
      const newIds = cartProducts
        .map((item) => item.id_carrito_producto)
        .sort()
        .join(",");

      if (
        currentIds !== newIds ||
        (Array.isArray(items) ? items.length : 0) !== cartProducts.length
      ) {
        console.log("🛒 Actualizando productos del carrito:", cartProducts);
        setItems(cartProducts);

        // Si no hay productos, limpiar totales
        if (cartProducts.length === 0) {
          setTotals(null);
        }
      }
    } else if (cartProducts === null || cartProducts === undefined) {
      // Si la respuesta es null o undefined, limpiar todo
      console.log("🛒 Limpiando carrito - respuesta vacía");
      if (Array.isArray(items) && items.length > 0) {
        setItems([]);
      }
      if (totals !== null) {
        setTotals(null);
      }
    } else if (
      Array.isArray(cartProducts) &&
      (cartProducts as any[]).length === 0
    ) {
      // Si es un array vacío, también limpiar
      console.log("🛒 Carrito vacío - limpiando estado");
      if (Array.isArray(items) && items.length > 0) {
        setItems([]);
      }
      if (totals !== null) {
        setTotals(null);
      }
    }
  }, [cartProducts, items, totals]);

  /**
   * Query para obtener los totales del carrito
   */
  const {
    data: cartTotals,
    isLoading: isLoadingTotals,
    error: totalsError,
    refetch: refetchTotals,
  } = useQuery({
    queryKey: CART_KEYS.totals(currentCartUser, selectedCanjeId),
    queryFn: async () => {
      console.log("🧮 Calculando totales del carrito para:", currentCartUser, "canje:", selectedCanjeId);
      try {
        const result = await cartService.calculateCartTotal(currentCartUser, selectedCanjeId ?? undefined);
        console.log("🧮 Totales calculados:", result);
        return result;
      } catch (error: any) {
        console.error("❌ Error al calcular totales del carrito:", error);
        // Si es un error 400, retornar null en lugar de lanzar error
        if (error?.response?.status === 400) {
          console.log("🛒 Error 400 en totales - retornando null");
          return null;
        }
        throw error;
      }
    },
    enabled: !!cartData?.id_carrito && hasItems() && !has400Error,
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      // No reintentar si es error 400 (Bad Request)
      if (error?.response?.status === 400) {
        setHas400Error(true);
        return false;
      }
      // Reintentar máximo 1 vez para otros errores
      return failureCount < 1;
    },
  });

  useEffect(() => {
    if (cartTotals && cartTotals.total_final !== totals?.total_final) {
      console.log("🧮 Actualizando totales del carrito:", cartTotals);
      setTotals(cartTotals);
    }
  }, [cartTotals, totals?.total_final]);

  // =============================================================================
  // MUTATIONS
  // =============================================================================

  /**
   * Mutación para agregar producto al carrito
   */
  const addToCartMutation = useMutation({
    mutationFn: async (product: cartService.CartProductCreate) => {
      // Validar límite del carrito
      const currentTotal = getCartTotal();
      const items = useCartStore.getState().items;
      console.log("🔍 [CART LIMIT] Validando límite:", {
        currentTotal,
        itemsCount: items.length,
        items: items.map((item) => ({
          id: item.id_carrito_producto,
          name: item.nombre_producto,
          price: item.precio_unitario,
          quantity: item.cantidad,
          subtotal: item.subtotal,
        })),
        productPrice: product.precio_unitario_carrito,
        quantity: product.cantidad,
        newTotal:
          currentTotal + product.precio_unitario_carrito * product.cantidad,
        limit: cartService.CART_LIMITS.MAX_TOTAL,
        userType: authUser?.id_usuario ? "registered" : "anonymous",
        sessionId: cartUser.session_id,
      });

      const limitError = validateCartLimit(
        currentTotal,
        product.precio_unitario_carrito,
        product.cantidad
      );
      if (limitError) {
        console.log("❌ [CART LIMIT] Límite excedido:", limitError);
        throw new Error(limitError);
      }

      const productWithUser = {
        ...product,
        ...currentCartUser,
      };

      console.log("🛒 Agregando producto al carrito:", productWithUser);

      const result = await cartService.addToCart(productWithUser);
      console.log("✅ Respuesta del servidor al agregar producto:", result);
      return result;
    },
    onMutate: async (product) => {
      // Optimistic update
      setLoading(true);

      // Crear item temporal para el store
      const tempItem: cartService.CartProductDetail = {
        id_carrito_producto: Date.now(), // ID temporal
        id_producto: product.id_producto,
        nombre_producto: "Cargando...", // Se actualizará cuando llegue la respuesta
        precio_unitario: product.precio_unitario_carrito || 0,
        cantidad: product.cantidad,
        subtotal: (product.precio_unitario_carrito || 0) * product.cantidad,
      };

      addItem(tempItem);
    },
    onSuccess: () => {
      console.log("✅ Producto agregado exitosamente");
      // Invalidar todas las queries del carrito para forzar refresco
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      // Refrescar datos del servidor
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const detail = data?.detail;
      const raw =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((e: { msg?: string }) => e?.msg ?? e).join(", ")
            : detail ?? error?.message;
      const message = toUserSafeApiDetail(
        raw,
        "No se pudo agregar el producto al carrito. Inténtalo de nuevo."
      );
      console.error("❌ Error al agregar producto:", raw ?? error, data ?? error);
      setError(message);
      // Invalidar queries y refrescar para revertir optimistic update
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      refetchProducts();
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  /**
   * Mutación para actualizar cantidad de producto
   */
  const updateQuantityMutation = useMutation({
    mutationFn: ({
      id_carrito_producto,
      cantidad,
      stock_disponible,
    }: {
      id_carrito_producto: number;
      cantidad: number;
      stock_disponible?: number;
    }) => {
      // Validar stock en frontend antes de enviar
      if (stock_disponible !== undefined && cantidad > stock_disponible) {
        throw new Error(
          `Stock insuficiente. Disponible: ${stock_disponible}, solicitado: ${cantidad}`
        );
      }

      if (cantidad <= 0) {
        throw new Error("La cantidad debe ser mayor a 0");
      }

      // Validar límite del carrito
      const currentItem = items.find(
        (item) => item.id_carrito_producto === id_carrito_producto
      );
      if (currentItem) {
        const currentTotal = getCartTotal();
        const currentItemTotal =
          currentItem.precio_unitario * currentItem.cantidad;
        const newItemTotal = currentItem.precio_unitario * cantidad;
        const totalWithoutCurrentItem = currentTotal - currentItemTotal;
        const newTotal = totalWithoutCurrentItem + newItemTotal;

        if (newTotal > cartService.CART_LIMITS.MAX_TOTAL) {
          throw new Error(
            `Límite de carrito alcanzado. El máximo permitido es ${formatPrice(
              cartService.CART_LIMITS.MAX_TOTAL
            )}`
          );
        }
      }

      return cartService.updateCartItemQuantity(id_carrito_producto, cantidad);
    },
    onMutate: async ({ id_carrito_producto, cantidad }) => {
      // Optimistic update
      updateItemQuantity(id_carrito_producto, cantidad);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      // Mostrar errores relevantes al usuario (stock, límite y cantidad)
      if (
        error.message?.includes("Stock insuficiente") ||
        error.message?.includes("cantidad debe ser mayor") ||
        error.message?.includes("Límite de carrito alcanzado")
      ) {
        setError(error.message);
      } else {
        setError(null);
      }
      // Invalidar queries y revertir cambios
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      refetchProducts();
    },
  });

  /**
   * Mutación para eliminar producto del carrito
   */
  const removeFromCartMutation = useMutation({
    mutationFn: (id_carrito_producto: number) => {
      return cartService.removeFromCart(
        id_carrito_producto,
        currentCartUser.id_usuario
      );
    },
    onMutate: async (id_carrito_producto) => {
      // Optimistic update
      removeItem(id_carrito_producto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Error al eliminar producto");
      // Invalidar queries y revertir cambios
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      refetchProducts();
    },
  });

  /**
   * Mutación para limpiar carrito
   */
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      // Eliminar todos los productos uno por uno
      const promises = items.map((item) =>
        cartService.removeFromCart(
          item.id_carrito_producto,
          currentCartUser.id_usuario
        )
      );
      await Promise.all(promises);
    },
    onMutate: async () => {
      // Optimistic update
      clearCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      refetchProducts();
      refetchTotals();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Error al limpiar carrito");
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      refetchProducts();
    },
  });

  // migrateCartMutation ya está definido arriba

  // =============================================================================
  // ESTADOS COMBINADOS
  // =============================================================================

  const isLoading =
    storeLoading || isLoadingCart || isLoadingProducts || isLoadingProductsWithBasic || isLoadingTotals;
  const error = storeError || cartError || productsError || productsWithBasicError || totalsError;
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
    cartExceedsLimit,
    selectedCanjeId,
    setSelectedCanjeId,
    
    // === DATOS CON INFORMACIÓN BÁSICA ===
    itemsWithBasic: cartProductsWithBasic || [],
    isLoadingWithBasic: isLoadingProductsWithBasic,

    // === ACCIONES ===
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    migrateCart: migrateCartMutation.mutate,

    // === UTILIDADES ===
    findItem,
    refetchCart: useCallback(() => {
      // Invalidar todas las queries del carrito y refrescar
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      refetchProducts();
      refetchProductsWithBasic();
      refetchTotals();
    }, [queryClient, refetchProducts, refetchProductsWithBasic, refetchTotals]),

    // Función para resetear errores y reintentar
    resetErrors: useCallback(() => {
      setHas400Error(false);
      setError(null);
      // Invalidar queries para reintentar
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    }, [queryClient, setError]),

    // === DEBUG ===
    getCartStatus: useCallback(
      () => ({
        isAuthenticated: !!authUser?.id_usuario,
        currentCartUser,
        cartUser,
        id_carrito,
        hasItems: hasItems(),
        itemCount,
      }),
      [
        authUser?.id_usuario,
        currentCartUser,
        cartUser,
        id_carrito,
        hasItems,
        itemCount,
      ]
    ),

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
