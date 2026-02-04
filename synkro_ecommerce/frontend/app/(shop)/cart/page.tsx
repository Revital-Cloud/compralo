"use client";

import React, { useState, useEffect, useMemo } from "react";
import CartItem from "@/components/cart/cart-item";
import { RelatedProducts } from "@/components/product";
import * as productService from "@/services/product.service";
import { getProductImageUrl } from "@/utils/image-helpers";
import {
  X,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Tag,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { formatPrice } from "@/utils/format-price";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import addressService from "@/services/address.service";
import { listPaymentMethods, addPaymentMethod } from "@/services/payment.service";
import { payCartAndCreateOrder } from "@/services/order.service";
import { discountService } from "@/services/discount.service";
import { exchangeService } from "@/services/exchange.service";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth/auth-modal";
import { WompiPaymentModal } from "@/components/payment/wompi-payment-modal";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Alert, AlertDescription, Button, Input, Loading, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, RadioGroup, RadioGroupItem, Select, Badge } from "@/components/ui";

const cartTexts = {
  es: {
    title: "Cesta de la compra",
    subtitle: "Revisa y gestiona los artículos de tu cesta.",
    signInText:
      "¿Ya tienes una cuenta? Inicia sesión para una experiencia más rápida.",
    yourBag: "Tu Cesta",
    bagSubtitle: "Los artículos en tu cesta no están reservados.",
    emptyCartTitle: "Tu cesta está vacía",
    emptyCartSubtitle: "Parece que aún no has añadido nada.",
    youMayAlsoLike: "También te puede gustar",
    orderSummary: "Resumen del Pedido",
    delivery: "Envío",
    salesTax: "Impuestos",
    total: "Total",
    checkout: "Pagar",
    promoCode: "¿Tienes un código promocional?",
    size: "Talla:",
    quantity: "Cantidad:",
    viewSummary: "Ver Resumen",
    loading: "Cargando carrito...",
    errorTitle: "Error al cargar el carrito",
    retry: "Reintentar",
  },
};

const CartPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    codigo: string;
    descuento: any;
    descuento_calculado?: number;
    total_con_descuento?: number;
  } | null>(null);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hook de autenticación
  const { user, isAuthenticated } = useAuth();

  // Hook del carrito con datos reales
  const {
    items,
    itemsWithBasic,
    totals,
    itemCount,
    total,
    hasItems,
    isLoading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
    refetchCart,
    id_carrito,
    cartExceedsLimit,
    selectedCanjeId,
    setSelectedCanjeId,
  } = useCart();

  // Sincronizar ?canje= de la URL con el store
  useEffect(() => {
    const canje = searchParams.get("canje");
    if (canje) {
      const id = parseInt(canje, 10);
      if (!Number.isNaN(id)) setSelectedCanjeId(id);
    }
  }, [searchParams, setSelectedCanjeId]);

  // Categorías únicas de los productos en el carrito (para "También te puede gustar")
  const cartCategoryIds = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const ids = items
      .map((item) => Number((item as { id_categoria_producto?: number }).id_categoria_producto))
      .filter((id) => !Number.isNaN(id) && id > 0);
    return [...new Set(ids)];
  }, [items]);

  // Productos recomendados: mismos categorías que el carrito, excluyendo los que ya están
  const { data: relatedResponse } = useQuery({
    queryKey: ["cartRelatedProducts", cartCategoryIds],
    queryFn: () =>
      productService.filterProducts({
        id_categoria: cartCategoryIds,
        limit: 20,
        offset: 0,
        ordenar_por: "nombre",
        orden: "ASC",
      }),
    enabled: cartCategoryIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const cartProductSlugs = useMemo(() => {
    if (!Array.isArray(items)) return new Set<string>();
    return new Set(
      items
        .filter((item) =>
          [item.id_categoria_producto, item.id_linea_producto, item.id_sublinea_producto, item.id_producto].every(
            (v) => typeof v === "number" && !Number.isNaN(v)
          )
        )
        .map(
          (item) =>
            `${item.id_categoria_producto}-${item.id_linea_producto}-${item.id_sublinea_producto}-${item.id_producto}`
        )
    );
  }, [items]);

  const relatedProducts = useMemo(() => {
    if (!relatedResponse?.products) return [];
    return relatedResponse.products
      .filter(
        (p) =>
          !cartProductSlugs.has(
            `${p.id_categoria}-${p.id_linea}-${p.id_sublinea}-${p.id_producto}`
          )
      )
      .slice(0, 8)
      .map((p) => ({
        id: p.id_producto,
        name: p.nom_producto,
        price:
          typeof p.val_precio === "number"
            ? p.val_precio
            : parseFloat(String(p.val_precio)),
        image: getProductImageUrl(p.img_producto),
        slug: `${p.id_categoria}-${p.id_linea}-${p.id_sublinea}-${p.id_producto}`,
      }));
  }, [relatedResponse, cartProductSlugs]);

  // Canjes disponibles del usuario (para selector)
  const { data: availableCanjes = [] } = useQuery({
    queryKey: ["myAvailableCanjes", user?.id_usuario],
    queryFn: () => exchangeService.getMyAvailableCanjes(),
    enabled: !!user?.id_usuario,
    staleTime: 1000 * 60 * 2,
  });

  // Textos de la interfaz
  const texts = cartTexts.es;

  // Funciones para manejar el carrito
  const handleQuantityChange = async (
    id: string | number,
    cantidad: number,
    stock_disponible?: number
  ) => {
    const id_carrito_producto = typeof id === 'string' ? parseInt(id) : id;
    try {
      updateQuantity({ id_carrito_producto, cantidad, stock_disponible });
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const handleRemoveItem = async (id: string | number) => {
    const id_carrito_producto = typeof id === 'string' ? parseInt(id) : id;
    try {
      removeFromCart(id_carrito_producto);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  const handleToggleFavorite = (id: string) => {
    // Funcionalidad implementada - ver useFavorites hook
    console.log("Toggle favorite:", id);
  };

  // Función para aplicar código de descuento
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Por favor ingresa un código de descuento");
      return;
    }

    if (!user?.id_usuario) {
      toast.error("Debes iniciar sesión para aplicar un código de descuento");
      return;
    }

    setIsApplyingCode(true);
    try {
      // Validar el código en el contexto del carrito actual
      const validation = await discountService.validateDiscountForCart(
        promoCode.trim(),
        id_carrito ? Number(id_carrito) : undefined
      );
      
      if (validation && validation.es_aplicable) {
        setAppliedDiscount({ 
          codigo: promoCode.trim().toUpperCase(), 
          descuento: validation.descuento,
          descuento_calculado: validation.descuento_calculado,
          total_con_descuento: validation.total_con_descuento
        });
        toast.success(`Código "${promoCode.trim().toUpperCase()}" aplicado correctamente`);
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error("Código de descuento no encontrado o no válido");
      } else if (error?.response?.status === 400) {
        toast.error(error?.response?.data?.detail || "El código de descuento no es aplicable a tu carrito actual");
      } else {
        toast.error("Error al validar el código de descuento");
      }
      setAppliedDiscount(null);
    } finally {
      setIsApplyingCode(false);
    }
  };

  // Función para remover código aplicado
  const handleRemovePromoCode = () => {
    setAppliedDiscount(null);
    setPromoCode("");
    toast.success("Código de descuento removido");
  };

  // Cálculos del carrito - usar datos del backend o fallback local
  const subtotal =
    Number(totals?.total_productos) ||
    (Array.isArray(items) && items.length > 0
      ? items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0)
      : 0);
  const shipping =
    Number(totals?.resumen?.costo_envio) ||
    (subtotal > 50 || subtotal === 0 ? 0 : 10);
  const salesTax = Number(totals?.resumen?.impuestos) || 0;
  const finalTotal =
    Number(totals?.total_final) ?? (hasItems() ? Number(total) : 0) ?? 0;
  const totalDescCanjeado = Number(totals?.total_desc_canjeado ?? 0);
  const selectedCanjeNombre = selectedCanjeId != null
    ? availableCanjes.find((c) => c.id_canje === selectedCanjeId)?.nom_descuento
    : null;
  const descuentoCanjeado = totals?.descuento_canjeado as { tipo?: string; valor?: number } | undefined;

  /** Para cada ítem del carrito, calcula precio unitario con descuento por puntos (si aplica) y % para mostrar */
  function getItemPriceWithCanjeDiscount(item: { precio_unitario: number; cantidad: number; subtotal: number }) {
    if (totalDescCanjeado <= 0 || !descuentoCanjeado || subtotal <= 0) {
      return { unitPrice: item.precio_unitario, originalUnitPrice: undefined, discountPercentage: undefined };
    }
    const tipo = descuentoCanjeado.tipo;
    const valor = Number(descuentoCanjeado.valor ?? 0);
    if (tipo === "porcentaje" && valor > 0) {
      const originalUnitPrice = item.precio_unitario;
      const unitPrice = originalUnitPrice * (1 - valor / 100);
      return { unitPrice, originalUnitPrice, discountPercentage: valor };
    }
    if (tipo === "monto_fijo" && totalDescCanjeado > 0) {
      const discountShare = totalDescCanjeado * (item.subtotal / subtotal);
      const discountedSubtotal = item.subtotal - discountShare;
      const unitPrice = item.cantidad > 0 ? discountedSubtotal / item.cantidad : item.precio_unitario;
      const discountPercentage = item.subtotal > 0 ? Math.round((discountShare / item.subtotal) * 100) : 0;
      return { unitPrice, originalUnitPrice: item.precio_unitario, discountPercentage };
    }
    return { unitPrice: item.precio_unitario, originalUnitPrice: undefined, discountPercentage: undefined };
  }

  // Cargar dirección principal del usuario (si existe)
  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressService.getMyAddresses,
    enabled: !!user?.id_usuario,
    retry: false,
    throwOnError: false,
  });

  // Cargar métodos de pago y detectar predeterminado
  const { data: paymentMethods } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: listPaymentMethods,
    enabled: !!user?.id_usuario,
    retry: false,
    throwOnError: false,
  });

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const [selectedAddressId, setSelectedAddressId] = useState<
    string | null
  >(null);

  const defaultAddress = Array.isArray(addresses)
    ? (selectedAddressId 
        ? addresses.find((a) => a.id_direccion.toString() === selectedAddressId)
        : addresses.find((a) => a.ind_principal) || addresses[0])
    : undefined;
  const defaultPaymentMethod = Array.isArray(paymentMethods)
    ? (selectedPaymentMethodId 
        ? paymentMethods.find((m) => m.id_metodo_pago.toString() === selectedPaymentMethodId)
        : paymentMethods.find((m) => m.is_default) || paymentMethods[0])
    : undefined;

  const [isPaying, setIsPaying] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [isPMDialogOpen, setIsPMDialogOpen] = useState(false);
  const [isRetryDialogOpen, setIsRetryDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isRequirementsDialogOpen, setIsRequirementsDialogOpen] = useState(false);
  const [isQuickAddressOpen, setIsQuickAddressOpen] = useState(false);
  const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState(false);
  const [isAddressSelectionOpen, setIsAddressSelectionOpen] = useState(false);
  const [isPaymentSelectionOpen, setIsPaymentSelectionOpen] = useState(false);
  const [isWompiModalOpen, setIsWompiModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Derivados para saber si falta dirección o método de pago (solo para mostrar mensajes informativos)
  const isMissingAddress = isAuthenticated && !defaultAddress;
  const paymentMethodsCount = Array.isArray(paymentMethods) ? paymentMethods.length : 0;
  const isMissingPaymentMethod = isAuthenticated && paymentMethodsCount === 0;
  
  // Determinar si el botón de pagar debe estar deshabilitado
  // Solo deshabilitar si está procesando el pago
  const isPayButtonDisabled = isPaying;
  
  // Mensaje de feedback para el botón deshabilitado
  const getPayButtonMessage = () => {
    if (isPaying) return "Procesando…";
    return texts.checkout;
  };

  const handleOpenPaymentModal = () => {
    if (!hasItems()) {
      toast.error("Tu carrito está vacío");
      return;
    }
    if (!user?.id_usuario) {
      setIsAuthDialogOpen(true);
      return;
    }
    // Abrir modal de selección de método de pago Wompi
    setIsWompiModalOpen(true);
  };

  const handleSelectPaymentMethod = (method: "card" | "pse" | "cash" | "credit") => {
    // Cerrar el modal de Wompi
    setIsWompiModalOpen(false);
    
    // Por ahora solo mostrar un mensaje, luego implementaremos la lógica de pago
    toast.info(`Método de pago seleccionado: ${method}`);
    
    // TODO: Implementar la lógica de pago según el método seleccionado
    // Por ahora, si es tarjeta, usar el flujo existente
    if (method === "card") {
      handleCheckout();
    } else {
      // Para otros métodos, mostrar mensaje de que está en desarrollo
      toast.info("Esta opción de pago estará disponible pronto");
    }
  };

  const handleCheckout = async (pmIdOverride?: number) => {
    if (!hasItems()) {
      toast.error("Tu carrito está vacío");
      return;
    }
    if (!user?.id_usuario) {
      setIsAuthDialogOpen(true);
      return;
    }

    // Redirigir al checkout donde se manejarán dirección y método de pago
    router.push("/checkout");
  };

  // Estado de carga después de declarar todos los hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:h-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {texts.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{texts.subtitle}</p>
          {/* Mensaje contextual según estado de autenticación */}
          {!isAuthenticated ? (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                {texts.signInText}
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 text-sm">
                ¡Hola {user?.nom_usuario || "Usuario"}! Tu carrito se sincroniza
                automáticamente.
              </p>
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
          <div className="lg:col-span-2">
            {/* Tu Cesta */}
            <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <ShoppingBag className="h-6 w-6" />
                  {texts.yourBag}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {texts.bagSubtitle}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mostrar error solo si existe y es relevante para el usuario */}
                {error &&
                  typeof error === "string" &&
                  error.includes("Stock insuficiente") && (
                    <div className="p-6">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex flex-col gap-3">
                            <span>
                              {texts.errorTitle}:{" "}
                              {typeof error === "string"
                                ? error
                                : "Error desconocido"}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={refetchCart}
                              >
                                <Loader2 className="h-4 w-4 mr-2" />
                                {texts.retry}
                              </Button>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                {/* Alerta de límite del carrito excedido */}
                {cartExceedsLimit && (
                  <div className="p-6">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex flex-col gap-3">
                          <span className="font-semibold">
                            Límite de carrito excedido
                          </span>
                          <span>
                            El total de tu carrito ({formatPrice(total)}) excede
                            el límite máximo permitido ({formatPrice(20000000)}
                            ). Por favor, elimina algunos productos del carrito
                            para continuar.
                          </span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {hasItems() && Array.isArray(items) ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => {
                      const slug = [
                        item.id_categoria_producto,
                        item.id_linea_producto,
                        item.id_sublinea_producto,
                        item.id_producto,
                      ].every((v) => typeof v === 'number' && !Number.isNaN(v as number))
                        ? `${item.id_categoria_producto}-${item.id_linea_producto}-${item.id_sublinea_producto}-${item.id_producto}`
                        : undefined;
                      const { unitPrice, originalUnitPrice, discountPercentage } = getItemPriceWithCanjeDiscount({
                        precio_unitario: item.precio_unitario,
                        cantidad: item.cantidad,
                        subtotal: item.subtotal,
                      });
                      return (
                        <CartItem
                          key={item.id_carrito_producto}
                          id={item.id_carrito_producto.toString()}
                          productId={item.id_producto}
                          productSlug={slug}
                          name={item.nombre_producto}
                          brand={item.marca || ""}
                          opciones_elegidas={(item as { opciones_elegidas?: Record<string, string> }).opciones_elegidas}
                          price={unitPrice}
                          originalPrice={originalUnitPrice}
                          discountPercentage={discountPercentage}
                          quantity={item.cantidad}
                          image={item.imagen_url || "/placeholder-product.jpg"}
                          stock_disponible={item.stock_disponible}
                          cartTotal={finalTotal}
                          onQuantityChange={handleQuantityChange}
                          onRemove={handleRemoveItem}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-xl">
                      {texts.emptyCartTitle}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {texts.emptyCartSubtitle}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* También te puede gustar: productos de las categorías del carrito */}
            <div className="mb-8">
              <RelatedProducts
                title={texts.youMayAlsoLike}
                products={relatedProducts}
              />
            </div>
          </div>

          {/* Resumen del Pedido - Desktop */}
          <div className="hidden lg:block lg:w-80 lg:shrink-0">
            <div className="sticky top-8" style={{ alignSelf: "flex-start" }}>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {texts.orderSummary}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Lista detallada de productos */}
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                    {Array.isArray(items) &&
                      items.map((item) => (
                        <div
                          key={item.id_carrito_producto}
                          className="flex justify-between text-sm py-2"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                              {item.nombre_producto}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                              {item.marca && `${item.marca} • `}{texts.size}{" "}
                              {item.sublinea || "Único"} • {texts.quantity}{" "}
                              {item.cantidad}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <span className="font-bold text-gray-900 dark:text-white text-base">
                              {formatPrice(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Subtotal
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {texts.delivery}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {shipping > 0 ? formatPrice(shipping) : "Gratis"}
                      </span>
                    </div>
                    {salesTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {texts.salesTax}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatPrice(salesTax)}
                        </span>
                      </div>
                    )}
                    {Number(totals?.total_desc_automaticos ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Descuentos aplicados</span>
                        <span>-{formatPrice(Number(totals?.total_desc_automaticos ?? 0))}</span>
                      </div>
                    )}
                    {selectedCanjeId != null && (
                      <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                        <span>
                          Descuento por puntos
                          {selectedCanjeNombre ? ` (${selectedCanjeNombre})` : ""}
                        </span>
                        <span>-{formatPrice(totalDescCanjeado)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex justify-between font-bold text-xl">
                      <span className="text-gray-900 dark:text-white">
                        {texts.total}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                    {totals?.puntos_a_ganar && totals.puntos_a_ganar > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        🎉 Ganarás {totals.puntos_a_ganar} puntos con esta
                        compra
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full mt-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-bold py-3 text-lg cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={
                      !hasItems() ||
                      isPayButtonDisabled ||
                      !!pendingOrderId ||
                      cartExceedsLimit
                    }
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsAuthDialogOpen(true);
                        return;
                      }
                      router.push("/checkout");
                    }}
                  >
                    {pendingOrderId ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {`Pago pendiente · Orden #${pendingOrderId}`}
                      </span>
                    ) : (
                      getPayButtonMessage()
                    )}
                  </Button>

                  {/* Descuento por puntos (canjes disponibles) */}
                  {isAuthenticated && availableCanjes.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Descuento por puntos
                      </p>
                      <Select
                        fullWidth
                        value={selectedCanjeId != null ? String(selectedCanjeId) : "none"}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "none") {
                            setSelectedCanjeId(null);
                            router.replace("/cart");
                          } else {
                            const id = parseInt(v, 10);
                            if (!Number.isNaN(id)) {
                              setSelectedCanjeId(id);
                              router.replace(`/cart?canje=${id}`);
                            }
                          }
                        }}
                      >
                        <option value="none">Ninguno</option>
                        {availableCanjes.map((c) => (
                          <option key={c.id_canje} value={String(c.id_canje)}>
                            {c.nom_descuento}
                            {c.puntos_utilizados != null ? ` (${c.puntos_utilizados} pts)` : ""}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {/* Código promocional */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {texts.promoCode}
                    </p>
                    {appliedDiscount ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Código aplicado: {appliedDiscount.codigo}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {appliedDiscount.descuento.nom_descuento}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemovePromoCode}
                            className="text-green-600 hover:text-green-700 dark:text-green-400"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Código promocional"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleApplyPromoCode();
                            }
                          }}
                          className="flex-1 uppercase"
                          disabled={isApplyingCode}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleApplyPromoCode}
                          disabled={isApplyingCode || !promoCode.trim()}
                        >
                          {isApplyingCode ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Aplicando...
                            </>
                          ) : (
                            "Aplicar"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Resumen del Pedido - Mobile (Sidebar) */}
          <div
            className={`lg:hidden fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 z-50 ${
              isSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {texts.orderSummary}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Lista detallada de productos - Mobile */}
                <div className="space-y-4 mb-6">
                  {Array.isArray(items) &&
                    items.map((item) => (
                      <div
                        key={item.id_carrito_producto}
                        className="flex justify-between text-sm py-2"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                            {item.nombre_producto}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {[
                              item.marca,
                              (item as { opciones_elegidas?: Record<string, string> }).opciones_elegidas &&
                                Object.entries((item as { opciones_elegidas?: Record<string, string> }).opciones_elegidas || {})
                                  .filter(([, v]) => v)
                                  .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                                  .join(' • '),
                              `${texts.quantity} ${item.cantidad}`,
                            ].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <span className="font-bold text-gray-900 dark:text-white text-base">
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {texts.delivery}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {shipping > 0 ? formatPrice(shipping) : "Gratis"}
                    </span>
                  </div>
                  {salesTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {texts.salesTax}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatPrice(salesTax)}
                      </span>
                    </div>
                  )}
                    {Number(totals?.total_desc_automaticos ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Descuentos aplicados</span>
                        <span>-{formatPrice(Number(totals?.total_desc_automaticos ?? 0))}</span>
                      </div>
                    )}
                  {selectedCanjeId != null && (
                    <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                      <span>
                        Descuento por puntos
                        {selectedCanjeNombre ? ` (${selectedCanjeNombre})` : ""}
                      </span>
                      <span>-{formatPrice(totalDescCanjeado)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between font-bold text-xl">
                    <span className="text-gray-900 dark:text-white">
                      {texts.total}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                  {totals?.puntos_a_ganar && totals.puntos_a_ganar > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      🎉 Ganarás {totals.puntos_a_ganar} puntos con esta compra
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-bold py-3 text-lg"
                  disabled={!hasItems || cartExceedsLimit}
                  onClick={() => {
                    if (!isAuthenticated) {
                      setIsAuthDialogOpen(true);
                      return;
                    }
                    if (isMissingAddress || isMissingPaymentMethod) {
                      setIsRequirementsDialogOpen(true);
                      return;
                    }
                    const count = Array.isArray(paymentMethods)
                      ? paymentMethods.length
                      : 0;
                    if (count > 1) {
                      setSelectedPaymentMethodId(
                        String(
                          (defaultPaymentMethod as any)?.id_metodo_pago ?? ""
                        )
                      );
                      setIsPMDialogOpen(true);
                    } else {
                      handleCheckout();
                    }
                  }}
                >
                  {texts.checkout}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior móvil */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
              </p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">
                {formatPrice(finalTotal)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              >
                {texts.viewSummary}
              </Button>
              <Button
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!hasItems() || isPayButtonDisabled || cartExceedsLimit}
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsAuthDialogOpen(true);
                    return;
                  }
                  router.push("/checkout");
                }}
              >
                {getPayButtonMessage()}
              </Button>
            </div>
          </div>
        </div>

        {/* Overlay para cerrar sidebar */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Modal de autenticación para botones protegidos */}
      <AuthModal
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        title="Debes iniciar sesión para continuar"
        description="Para agregar dirección, método de pago o finalizar tu compra necesitas iniciar sesión o registrarte."
      />


      {/* Diálogo de requisitos faltantes (dirección y/o método de pago) */}
      <Dialog open={isRequirementsDialogOpen} onOpenChange={setIsRequirementsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No puedes pagar todavía</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            {isMissingAddress && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <p>Debes agregar una dirección de envío.</p>
              </div>
            )}
            {isMissingPaymentMethod && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <p>Debes registrar un método de pago.</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            {isMissingAddress && (
              <Button
                variant="outline"
                className="hover:bg-black/5 dark:hover:bg-white/10 hover:text-inherit"
                onClick={() => {
                  setIsRequirementsDialogOpen(false);
                  setIsQuickAddressOpen(true);
                }}
              >
                Agregar dirección
              </Button>
            )}
            {isMissingPaymentMethod && (
              <Button
                className="bg-red-600 text-white hover:bg-red-600/90"
                onClick={() => {
                  setIsRequirementsDialogOpen(false);
                  setIsQuickPaymentOpen(true);
                }}
              >
                Agregar método de pago
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Modal de selección de dirección */}
       <Dialog open={isAddressSelectionOpen} onOpenChange={setIsAddressSelectionOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Seleccionar Dirección</DialogTitle>
           </DialogHeader>
           <div className="space-y-3 py-2">
             <RadioGroup
               value={selectedAddressId ?? ""}
               onValueChange={setSelectedAddressId}
             >
               {Array.isArray(addresses) &&
                 addresses.map((address: any) => (
                   <label
                     key={address.id_direccion}
                     className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                   >
                     <RadioGroupItem value={String(address.id_direccion)} />
                     <div className="flex-1">
                       <div className="text-sm font-medium">
                         {address.nombre_direccion}
                       </div>
                       <div className="text-xs text-gray-500 mt-1">
                         {address.calle_direccion}, {address.ciudad}
                       </div>
                       <div className="text-xs text-gray-500">
                         {address.departamento} - {address.codigo_postal}
                       </div>
                     </div>
                     {address.es_principal && <Badge>Principal</Badge>}
                   </label>
                 ))}
             </RadioGroup>
           </div>
           <DialogFooter className="flex flex-col sm:flex-row gap-2">
             <Button
               variant="outline"
               onClick={() => {
                 setIsAddressSelectionOpen(false);
                 setIsQuickAddressOpen(true);
               }}
               className="hover:bg-black/5 dark:hover:bg-white/10 hover:text-inherit"
             >
               Agregar Nueva
             </Button>
             <Button
               disabled={!selectedAddressId}
               onClick={() => {
                 if (selectedAddressId) {
                   setIsAddressSelectionOpen(false);
                   queryClient.invalidateQueries({ queryKey: ["addresses"] });
                   toast.success("Dirección actualizada");
                 }
               }}
             >
               Confirmar
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Modal de selección de método de pago */}
       <Dialog open={isPaymentSelectionOpen} onOpenChange={setIsPaymentSelectionOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Seleccionar Método de Pago</DialogTitle>
           </DialogHeader>
           <div className="space-y-3 py-2">
             <RadioGroup
               value={selectedPaymentMethodId ?? ""}
               onValueChange={setSelectedPaymentMethodId}
             >
               {Array.isArray(paymentMethods) &&
                 paymentMethods.map((method: any) => (
                   <label
                     key={method.id_metodo_pago}
                     className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                   >
                     <RadioGroupItem value={String(method.id_metodo_pago)} />
                     <div className="flex-1">
                       <div className="text-sm font-medium">
                         {method.brand?.toUpperCase() || "Tarjeta"} •••• {method.last_four_digits}
                       </div>
                       <div className="text-xs text-gray-500">
                         Titular: {method.card_holder}
                       </div>
                     </div>
                     {method.es_principal && <Badge>Principal</Badge>}
                   </label>
                 ))}
             </RadioGroup>
           </div>
           <DialogFooter className="flex flex-col sm:flex-row gap-2">
             <Button
               variant="outline"
               onClick={() => {
                 setIsPaymentSelectionOpen(false);
                 setIsQuickPaymentOpen(true);
               }}
               className="hover:bg-black/5 dark:hover:bg-white/10 hover:text-inherit"
             >
               Agregar Nuevo
             </Button>
             <Button
               disabled={!selectedPaymentMethodId}
               onClick={() => {
                 if (selectedPaymentMethodId) {
                   setIsPaymentSelectionOpen(false);
                   queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
                   toast.success("Método de pago actualizado");
                 }
               }}
             >
               Confirmar
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Modal rápido para agregar dirección */}
       <Dialog open={isQuickAddressOpen} onOpenChange={setIsQuickAddressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar dirección de envío</DialogTitle>
          </DialogHeader>
          <QuickAddressForm
            onSuccess={async () => {
              setIsQuickAddressOpen(false);
              await queryClient.invalidateQueries({ queryKey: ["addresses"] });
              await queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
              toast.success("Dirección agregada");
              
              // Esperar un poco para que se actualicen los datos
              setTimeout(async () => {
                try {
                  // Obtener datos frescos después de la invalidación
                  const freshAddresses = await queryClient.fetchQuery({ queryKey: ["addresses"] });
                  const freshPaymentMethods = await queryClient.fetchQuery({ queryKey: ["paymentMethods"] });
                  
                  const hasAddress = Array.isArray(freshAddresses) && freshAddresses.length > 0;
                  const hasPaymentMethod = Array.isArray(freshPaymentMethods) && freshPaymentMethods.length > 0;
                  
                  if (!hasPaymentMethod) {
                    setIsQuickPaymentOpen(true);
                  } else if (hasAddress && hasPaymentMethod) {
                    // Si ya no falta nada, intentar pagar
                    handleCheckout();
                  }
                } catch (error) {
                  console.error('Error fetching fresh data:', error);
                  // Si hay error, asumir que no hay datos y abrir formulario de pago
                  setIsQuickPaymentOpen(true);
                }
              }, 1000); // Delay para asegurar que los datos se actualicen
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal rápido para agregar método de pago */}
      <Dialog open={isQuickPaymentOpen} onOpenChange={setIsQuickPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar método de pago</DialogTitle>
          </DialogHeader>
          <QuickPaymentForm
            onSuccess={async () => {
              setIsQuickPaymentOpen(false);
              await queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
              await queryClient.invalidateQueries({ queryKey: ["addresses"] });
              toast.success("Método de pago agregado");
              
              // Cerrar el modal de requisitos si está abierto
              setIsRequirementsDialogOpen(false);
              
              // Esperar un poco para que se actualicen los datos
              setTimeout(async () => {
                try {
                  // Obtener datos frescos después de la invalidación
                  const freshAddresses = await queryClient.fetchQuery({ queryKey: ["addresses"] });
                  const freshPaymentMethods = await queryClient.fetchQuery({ queryKey: ["paymentMethods"] });
                  
                  const hasAddress = Array.isArray(freshAddresses) && freshAddresses.length > 0;
                  const hasPaymentMethod = Array.isArray(freshPaymentMethods) && freshPaymentMethods.length > 0;
                  
                  if (!hasAddress) {
                    setIsQuickAddressOpen(true);
                  } else if (hasAddress && hasPaymentMethod) {
                    // Si ya no falta nada, intentar pagar
                    handleCheckout();
                  }
                } catch (error) {
                  console.error('Error fetching fresh data:', error);
                  // Si hay error, asumir que no hay datos y abrir formulario de dirección
                  setIsQuickAddressOpen(true);
                }
              }, 1000); // Delay para asegurar que los datos se actualicen
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogo de selección de método de pago */}
      <Dialog open={isPMDialogOpen} onOpenChange={setIsPMDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecciona un método de pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <RadioGroup
              value={selectedPaymentMethodId ?? ""}
              onValueChange={setSelectedPaymentMethodId}
            >
              {Array.isArray(paymentMethods) &&
                paymentMethods.map((pm: any) => (
                  <label
                    key={pm.id_metodo_pago}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <RadioGroupItem value={String(pm.id_metodo_pago)} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {pm.brand?.toUpperCase() || "Tarjeta"} ••••{" "}
                        {pm.last_four_digits}
                      </div>
                      <div className="text-xs text-gray-500">
                        Titular: {pm.card_holder} · Expira{" "}
                        {pm.exp_month || pm.expiration_month}/
                        {pm.exp_year || pm.expiration_year}
                      </div>
                    </div>
                    {pm.is_default && <Badge>Principal</Badge>}
                  </label>
                ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!selectedPaymentMethodId || isPaying}
              onClick={() => handleCheckout(Number(selectedPaymentMethodId))}
            >
              {isPaying ? "Procesando…" : "Pagar con este método"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de reintento cuando el pago es declinado */}
      <AlertDialog open={isRetryDialogOpen} onOpenChange={setIsRetryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pago declinado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Quieres reintentar el pago seleccionando un método distinto?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer hover:bg-transparent hover:text-inherit hover:opacity-100 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => setIsRetryDialogOpen(false)}
            >
              No
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => {
                setIsRetryDialogOpen(false);
                const count = Array.isArray(paymentMethods)
                  ? paymentMethods.length
                  : 0;
                if (count > 1) {
                  setSelectedPaymentMethodId(
                    String((defaultPaymentMethod as any)?.id_metodo_pago ?? "")
                  );
                  setIsPMDialogOpen(true);
                } else {
                  // Si solo hay una tarjeta, reintenta directo
                  handleCheckout();
                }
              }}
            >
              Sí, reintentar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de selección de método de pago Wompi */}
      <WompiPaymentModal
        isOpen={isWompiModalOpen}
        onClose={() => setIsWompiModalOpen(false)}
        total={finalTotal}
        onSelectPaymentMethod={handleSelectPaymentMethod}
      />
    </div>
  );
};

export default CartPage;

// Formulario rápido de dirección (inline)
const addressSchema = z.object({
  nombre_direccion: z.string().min(1, "Nombre requerido"),
  calle_direccion: z.string().min(1, "Dirección requerida"),
  ciudad: z.string().min(1, "Ciudad requerida"),
  departamento: z.string().min(1, "Departamento requerido"),
  codigo_postal: z.string().min(1, "Código postal requerido"),
  barrio: z.string().min(1, "Barrio requerido"),
  referencias: z.string().optional(),
  complemento: z.string().optional(),
});

type QuickAddressFormValues = z.infer<typeof addressSchema>;

function QuickAddressForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const form = useForm<QuickAddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      nombre_direccion: "",
      calle_direccion: "",
      ciudad: "",
      departamento: "",
      codigo_postal: "",
      barrio: "",
      referencias: "",
      complemento: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAddress = async (data: QuickAddressFormValues) => {
    if (!user?.id_usuario) return;
    setIsSubmitting(true);
    try {
      await addressService.createAddress({
        id_usuario: Number(user.id_usuario),
        nombre_direccion: data.nombre_direccion,
        calle_direccion: data.calle_direccion,
        ciudad: data.ciudad,
        departamento: data.departamento,
        codigo_postal: data.codigo_postal,
        barrio: data.barrio,
        referencias: data.referencias || null,
        complemento: data.complemento || null,
        ind_principal: false,
        ind_activa: true,
      });
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo guardar la dirección");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmitAddress)}
      className="grid grid-cols-1 gap-3"
    >
      <Input placeholder="Nombre de la dirección" {...form.register("nombre_direccion")} />
      <Input placeholder="Calle y número" {...form.register("calle_direccion")} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Ciudad" {...form.register("ciudad")} />
        <Input placeholder="Departamento" {...form.register("departamento")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Código postal" {...form.register("codigo_postal")} />
        <Input placeholder="Barrio" {...form.register("barrio")} />
      </div>
      <Input placeholder="Referencias (opcional)" {...form.register("referencias")} />
      <Input placeholder="Complemento (opcional)" {...form.register("complemento")} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar dirección"}
      </Button>
    </form>
  );
}

// Formulario rápido de método de pago (inline)
const paymentSchema = z.object({
  card_holder: z.string().min(1, "Nombre requerido"),
  number: z.string().min(13).max(19),
  exp_month: z.string().length(2),
  exp_year: z.string().length(2),
  cvc: z.string().min(3).max(4),
});

type QuickPaymentValues = z.infer<typeof paymentSchema>;

function QuickPaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<QuickPaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      card_holder: "",
      number: "",
      exp_month: "",
      exp_year: "",
      cvc: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmitPayment = async (data: QuickPaymentValues) => {
    setIsSubmitting(true);
    try {
      const result = await addPaymentMethod(data as any);
      if (result.success) {
        // Invalidar la query para actualizar los métodos de pago
        await queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
        onSuccess();
      } else {
        toast.error(result.error || "No se pudo agregar el método de pago");
      }
    } catch (e: any) {
      toast.error(e?.message || "No se pudo agregar el método de pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmitPayment)}
      className="grid grid-cols-1 gap-3"
    >
      <Input placeholder="Nombre en la tarjeta" {...form.register("card_holder")} />
      <Input placeholder="Número de tarjeta" type="number" inputMode="numeric" {...form.register("number")} />
      <div className="grid grid-cols-3 gap-3">
        <Input placeholder="MM" type="number" inputMode="numeric" {...form.register("exp_month")} />
        <Input placeholder="YY" type="number" inputMode="numeric" {...form.register("exp_year")} />
        <Input placeholder="CVC" type="number" inputMode="numeric" {...form.register("cvc")} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar método"}
      </Button>
    </form>
  );
}
