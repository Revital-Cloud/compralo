"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  informationSchema,
  shippingSchema,
  paymentSchema,
  type InformationFormData,
  type ShippingFormData,
  type PaymentFormData,
} from "@/schemas/shop/checkout.schema";
import { addressSchema } from "@/schemas/shop/address.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import * as cartService from "@/services/cart.service";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/utils/format-price";
import { ChevronLeft, Truck, Package, CreditCard, ShieldCheck, Plus, X } from "lucide-react";
import WompiModal from "@/components/payment/wompi-modal";
import type { CheckoutData } from "@/services/wompi-widget.service";
import { PaymentMethodsRow } from "@/components/payment/payment-card-brands";
import { toast } from "sonner";
import addressService from "@/services/address.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Loading from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveDiscounts } from "@/hooks/use-discounts";
import { discountService } from "@/services/discount.service";
import {
  getApplicableDiscount, 
  calculateDiscountedPrice, 
  calculateDiscountPercentage 
} from "@/utils/discount-utils";

/**
 * Mapa de la página `checkout`.
 *
 * Flujo de alto nivel:
 * 1) Verifica sesión activa; si no, redirige a login con retorno.
 * 2) Captura/selecciona información de dirección de envío.
 * 3) Calcula resumen final (subtotal, envío, descuentos por puntos/código).
 * 4) Crea datos de checkout para Wompi sin crear orden todavía.
 * 5) Orden se materializa después de confirmación de pago aprobado.
 */

const CheckoutPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, isLoadingUser } = useAuth();
  const { items, totals, total, hasItems, isLoading: cartLoading, id_carrito, selectedCanjeId, cartUser, isMigratingCart } = useCart();
  const queryClient = useQueryClient();

  // Checkout es ruta protegida: fuerza login y conserva retorno a `/checkout`.
  useEffect(() => {
    if (!isHydrated || isLoadingUser) return;
    if (!isAuthenticated) {
      const redirect = encodeURIComponent("/checkout");
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [isHydrated, isLoadingUser, isAuthenticated, router]);
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>("");
  const [isWompiModalOpen, setIsWompiModalOpen] = useState(false);
  /** Datos para crear sesión de checkout (no se crea orden hasta que el pago sea aprobado). */
  const [checkoutDataForModal, setCheckoutDataForModal] = useState<CheckoutData | null>(null);
  
  // Cargar direcciones del usuario
  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressService.getMyAddresses,
    enabled: !!user?.id_usuario,
    retry: false,
    throwOnError: false,
  });

  // Formularios
  const informationForm = useForm<InformationFormData>({
    resolver: zodResolver(informationSchema),
    defaultValues: {
      deliveryMethod: undefined,
      nombre: "",
      apellidos: "",
      direccion: "",
      complemento: "",
      pais: "Colombia",
      departamento: "",
      ciudad: "",
      codigo_postal: "",
      barrio: "",
      referencias: "",
      celular: "",
    },
  });

  const shippingForm = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      shippingMethod: "",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "wompi",
      useShippingAddress: true,
      tipoIdentificacion: "",
      numeroIdentificacion: "",
      notas: "",
    },
  });

  // Métodos de envío simulados (luego se conectarán con el backend)
  const shippingMethods = [
    { id: "coordinadora", name: "Coordinadora", price: 12860, estimatedDays: "3-5" },
    { id: "servientrega", name: "Servientrega", price: 15000, estimatedDays: "2-4" },
    { id: "tcc", name: "TCC", price: 12000, estimatedDays: "4-6" },
  ];

  const subtotal = Number(totals?.total_productos) || Number(total) || 0;
  const shipping = selectedShippingMethod
    ? shippingMethods.find((m) => m.id === selectedShippingMethod)?.price || 0
    : 0;
  const totalConDescuentos = Number(totals?.total_final) ?? subtotal;
  const totalDescCanjeado = Number(totals?.total_desc_canjeado ?? 0);

  // Valida cupón guardado desde carrito para mantener continuidad entre pantallas.
  const codigoDescuentoStored =
    typeof window !== "undefined" ? sessionStorage.getItem("checkout_codigo_descuento") : null;
  const { data: appliedCodeValidation } = useQuery({
    queryKey: ["discount-validate-checkout", id_carrito, codigoDescuentoStored],
    queryFn: () =>
      discountService.validateDiscountForCart(
        codigoDescuentoStored!.trim(),
        id_carrito ?? undefined
      ),
    enabled:
      !!id_carrito &&
      !!codigoDescuentoStored?.trim() &&
      !!user?.id_usuario,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  // Total con descuento de código: partir del total del carrito (ya con 50% Celulares, etc.) y restar el cupón
  const descuentoCodigoAmount =
    appliedCodeValidation?.es_aplicable && appliedCodeValidation?.descuento_calculado != null
      ? Number(appliedCodeValidation.descuento_calculado)
      : 0;
  const finalTotal = totalConDescuentos - descuentoCodigoAmount + shipping;

  // Handlers
  const handleInformationSubmit = (data: InformationFormData) => {
    // Saltar el paso de envío y ir directamente a pago
    setCurrentStep(3);
  };

  const handleShippingSubmit = (data: ShippingFormData) => {
    setSelectedShippingMethod(data.shippingMethod);
    setCurrentStep(3);
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    // Evitar crear referencia de checkout con carrito anónimo (puede ser borrado al migrar y romper confirm-checkout)
    if (isMigratingCart) {
      toast.info("Estamos sincronizando tu carrito. Espera un momento e intenta de nuevo.");
      return;
    }
    if (!user?.id_usuario) {
      toast.error("No se pudo identificar tu usuario. Recarga la página e intenta de nuevo.");
      return;
    }

    // Obtener dirección seleccionada
  const activeAddresses = Array.isArray(addresses)
    ? addresses.filter((addr) => addr.ind_activa !== false)
    : [];

  const selectedAddress = activeAddresses.find(
      (addr) => addr.id_direccion?.toString() === informationForm.getValues().direccion
    ) || activeAddresses[0];

    if (!selectedAddress?.id_direccion) {
      toast.error('Debes seleccionar una dirección de envío.');
      return;
    }

    // Rehidrata `id_carrito` desde servidor para evitar usar ids obsoletos.
    // IMPORTANTE: usar id_usuario (no session_id) para evitar referencias a carritos anónimos.
    let cartId: number;
    try {
      const cartRes = await cartService.getOrCreateCart({ id_usuario: user.id_usuario });
      cartId = cartRes.id_carrito;
    } catch (e) {
      console.error('Error al obtener el carrito:', e);
      toast.error('No se pudo cargar el carrito. Por favor, vuelve al carrito e intenta de nuevo.');
      return;
    }

    if (!cartId) {
      toast.error('No se pudo obtener el carrito. Por favor, recarga la página.');
      return;
    }

    // Incluir id_canje cuando haya descuento por puntos para que la referencia y la orden lo apliquen
    const idCanje =
      totals?.id_canje_aplicado != null
        ? Number(totals.id_canje_aplicado)
        : selectedCanjeId != null
          ? Number(selectedCanjeId)
          : undefined;
    const codigoDescuento =
      typeof window !== "undefined"
        ? sessionStorage.getItem("checkout_codigo_descuento")
        : null;
    const checkoutData: CheckoutData = {
      cart_id: cartId,
      id_direccion: Number(selectedAddress.id_direccion),
      id_canje: idCanje,
      ...(codigoDescuento ? { codigo_descuento: codigoDescuento } : {}),
    };
    setCheckoutDataForModal(checkoutData);
    setIsWompiModalOpen(true);
  };

  const handlePaymentResult = (result: any) => {
    console.log("Resultado del pago:", result);

    if (result?.transaction) {
      const transaction = result.transaction;
      console.log("Transacción completada:", transaction);

      // Pago aprobado: el backend ya limpió el carrito (trigger). Actualizar la UI
      // para que muestre "carrito vacío" sin necesidad de refrescar.
      if (transaction?.status === "APPROVED") {
        setCheckoutDataForModal(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("checkout_codigo_descuento");
        }
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    }
  };

  if (cartLoading || (isHydrated && !isLoadingUser && !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // No mostrar "carrito vacío" si el modal de pago está abierto (checkout en curso)
  if (!hasItems() && !isWompiModalOpen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Tu carrito está vacío
          </p>
          <Button onClick={() => router.push("/cart")}>
            Volver al carrito
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className={currentStep >= 1 ? "text-gray-900 dark:text-white font-medium" : ""}>
              Carrito
            </span>
            <span>/</span>
            <span className={currentStep >= 1 ? "text-gray-900 dark:text-white font-medium" : ""}>
              Información
            </span>
            <span>/</span>
            <span className="opacity-50">
              Envío
            </span>
            <span>/</span>
            <span className={currentStep >= 3 ? "text-gray-900 dark:text-white font-medium" : ""}>
              Pago
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Formulario */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <InformationStep
                form={informationForm}
                onSubmit={handleInformationSubmit}
                addresses={addresses}
                queryClient={queryClient}
                user={user}
              />
            )}

            {/* Paso 2: Envío - Deshabilitado por ahora */}
            {false && currentStep === 2 && (
              <ShippingStep
                form={shippingForm}
                onSubmit={handleShippingSubmit}
                shippingMethods={shippingMethods}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && (
              <PaymentStep
                form={paymentForm}
                onSubmit={handlePaymentSubmit}
                informationData={informationForm.getValues()}
                shippingMethod={selectedShippingMethod}
                shippingMethods={shippingMethods}
                onBack={() => setCurrentStep(1)}
              />
            )}
          </div>

          {/* Columna derecha - Resumen */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              total={finalTotal}
              discountCanjeAmount={totalDescCanjeado}
              discountCodeAmount={descuentoCodigoAmount}
              discountCodeLabel={
                appliedCodeValidation?.descuento?.nom_descuento ||
                (codigoDescuentoStored ? `Código ${codigoDescuentoStored}` : undefined)
              }
              descuentosAutomaticos={totals?.descuentos_automaticos}
            />
          </div>
        </div>
      </div>

      {/* Modal Wompi: el backend confirma y crea orden solo al aprobar transacción. */}
      <WompiModal
        isOpen={isWompiModalOpen}
        onClose={() => {
          setIsWompiModalOpen(false);
          setCheckoutDataForModal(null);
        }}
        amount={finalTotal * 100}
        checkoutData={checkoutDataForModal}
        customerData={{
          email: user?.email_usuario,
          fullName: `${informationForm.getValues().nombre} ${informationForm.getValues().apellidos}`,
          phoneNumber: informationForm.getValues().celular,
          phoneNumberPrefix: "+57",
          legalId: paymentForm.getValues().numeroIdentificacion || undefined,
          legalIdType: paymentForm.getValues().tipoIdentificacion || undefined
        }}
        shippingAddress={(() => {
          // Wompi exige que TODOS los campos de envío existan y tengan longitud mínima (ej. 4 caracteres).
          // "Apartamento/Interior/Oficina" (addressLine2) no puede ir vacío ni con < 4 caracteres.
          const complemento = (informationForm.getValues().complemento ?? "").trim();
          const addressLine2 = complemento.length >= 4 ? complemento : "N/A ";
          const v = (x: string | undefined) => (x ?? "").trim() || "N/A ";
          return {
            addressLine1: v(informationForm.getValues().direccion),
            addressLine2,
            city: v(informationForm.getValues().ciudad),
            region: v(informationForm.getValues().departamento),
            country: "CO",
            name: `${v(informationForm.getValues().nombre)} ${v(informationForm.getValues().apellidos)}`.trim() || "N/A ",
            phoneNumber: v(informationForm.getValues().celular) || "3000000000"
          };
        })()}
        onPaymentResult={handlePaymentResult}
      />
    </div>
  );
};

// Componente Paso 1: Información
function InformationStep({
  form,
  onSubmit,
  addresses,
  queryClient,
  user,
}: {
  form: any;
  onSubmit: (data: InformationFormData) => void;
  addresses?: any[];
  queryClient: any;
  user: any;
}) {
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isCreatingNewAddress, setIsCreatingNewAddress] = useState(false);
  
  // Dirección seleccionada
  const activeAddresses = Array.isArray(addresses)
    ? addresses.filter((addr) => addr.ind_activa !== false)
    : [];

  const selectedAddress = activeAddresses.find(
    (addr) => addr.id_direccion?.toString() === selectedAddressId
  );

  // Llenar campos del perfil automáticamente cuando el usuario esté disponible
  React.useEffect(() => {
    if (user) {
      form.setValue("nombre", user.nom_usuario || "");
      form.setValue("apellidos", user.ape_usuario || "");
      form.setValue("celular", user.cel_usuario || "");
    }
  }, [user, form]);

  // Llenar formulario cuando se selecciona una dirección
  React.useEffect(() => {
    if (selectedAddress) {
      // Llenar campos de dirección (no sobrescribir nombre, apellidos y celular del perfil)
      form.setValue("direccion", selectedAddress.calle_direccion || "");
      form.setValue("complemento", selectedAddress.complemento || "");
      form.setValue("pais", "Colombia");
      form.setValue("departamento", selectedAddress.departamento || "");
      form.setValue("ciudad", selectedAddress.ciudad || "");
      form.setValue("codigo_postal", selectedAddress.codigo_postal || "");
      form.setValue("barrio", selectedAddress.barrio || "");
      form.setValue("referencias", selectedAddress.referencias || "");
    }
  }, [selectedAddress, form]);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6">Información</h2>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Método de entrega - Deshabilitado por ahora */}
          <div className="opacity-50 pointer-events-none">
            <Label className="mb-3 block">Método de entrega</Label>
            <RadioGroup
              value={form.watch("deliveryMethod")}
              onValueChange={(value) => form.setValue("deliveryMethod", value as "ship" | "pickup")}
              disabled
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ship" id="ship" disabled />
                <Label htmlFor="ship" className="flex items-center gap-2 cursor-not-allowed">
                  <Truck className="h-4 w-4" />
                  Envíar pedido
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" disabled />
                <Label htmlFor="pickup" className="flex items-center gap-2 cursor-not-allowed">
                  <Package className="h-4 w-4" />
                  Recoger pedido
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dirección de envío */}
          {true && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold">Dirección de envío</h3>

              {/* Selector de dirección */}
              <div>
                <Label htmlFor="direccion-select">
                  Dirección <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2 mt-1">
                  <Select value={selectedAddressId || "__none__"} onValueChange={(v) => setSelectedAddressId(v === "__none__" ? "" : v)}>
                    <SelectTrigger id="direccion-select" className="flex-1">
                      <SelectValue placeholder="Selecciona una dirección" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Selecciona una dirección</SelectItem>
                      {Array.isArray(activeAddresses) &&
                        activeAddresses.map((addr) => (
                          <SelectItem key={addr.id_direccion} value={String(addr.id_direccion)}>
                            {addr.nombre_direccion} - {addr.calle_direccion}, {addr.ciudad}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreatingNewAddress(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva
                  </Button>
                </div>
                {!selectedAddressId && !isCreatingNewAddress && form.formState.errors.direccion && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.direccion.message}
                  </p>
                )}
              </div>

              {/* Formulario solo visible al crear nueva dirección (inline) o al tener una dirección seleccionada */}
              {isCreatingNewAddress ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 space-y-4">
                  <h4 className="font-medium">Nueva dirección de envío</h4>
                  <CreateAddressForm
                    onSuccess={async (newAddress) => {
                      setIsCreatingNewAddress(false);
                      queryClient.invalidateQueries({ queryKey: ["addresses"] });
                      const id = newAddress?.id_direccion ?? newAddress?.id;
                      if (id != null) {
                        setSelectedAddressId(String(id));
                      } else {
                        const list = await queryClient.fetchQuery({ queryKey: ["addresses"] }) as any[];
                        if (Array.isArray(list) && list.length > 0) {
                          const last = list[list.length - 1];
                          setSelectedAddressId(String(last?.id_direccion ?? last?.id ?? ""));
                        }
                      }
                      toast.success("Dirección creada. Selecciónala en el desplegable si no se eligió automáticamente.");
                    }}
                    onCancel={() => setIsCreatingNewAddress(false)}
                    user={user}
                    showCancel
                    nested
                  />
                </div>
              ) : selectedAddress ? (
              <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input id="nombre" {...form.register("nombre")} className="mt-1" />
                  {form.formState.errors.nombre && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="apellidos">
                    Apellidos <span className="text-red-500">*</span>
                  </Label>
                  <Input id="apellidos" {...form.register("apellidos")} className="mt-1" />
                  {form.formState.errors.apellidos && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.apellidos.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="direccion">
                  Dirección <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="direccion"
                  {...form.register("direccion")}
                  className="mt-1"
                  value={form.watch("direccion") || ""}
                  disabled={!!selectedAddress}
                />
                {form.formState.errors.direccion && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.direccion.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="complemento">Complemento de dirección (opcional)</Label>
                <Input
                  id="complemento"
                  {...form.register("complemento")}
                  className="mt-1"
                  value={form.watch("complemento") || ""}
                  disabled={!!selectedAddress}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pais">
                    País/Región <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.watch("pais") || "Colombia"}
                    onValueChange={(v) => form.setValue("pais", v)}
                    disabled={!!selectedAddress}
                  >
                    <SelectTrigger id="pais" className="mt-1">
                      <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="departamento">
                    Departamento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="departamento"
                    {...form.register("departamento")}
                    className="mt-1"
                    placeholder="Ej: Santander, Cundinamarca, Antioquia..."
                    disabled={!!selectedAddress}
                  />
                  {form.formState.errors.departamento && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.departamento.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="ciudad">
                    Localidad / Ciudad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ciudad"
                    {...form.register("ciudad")}
                    className="mt-1"
                    placeholder="Ej: Bogotá, Medellín, Bucaramanga..."
                    disabled={!!selectedAddress}
                  />
                  {form.formState.errors.ciudad && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.ciudad.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedAddress ? (
                  <>
                    {selectedAddress.codigo_postal && (
                      <div>
                        <Label htmlFor="codigo_postal">Código postal</Label>
                        <Input
                          id="codigo_postal"
                          {...form.register("codigo_postal")}
                          className="mt-1"
                          value={form.watch("codigo_postal") || ""}
                          disabled
                        />
                      </div>
                    )}
                    {selectedAddress.barrio && (
                      <div>
                        <Label htmlFor="barrio">Barrio</Label>
                        <Input
                          id="barrio"
                          {...form.register("barrio")}
                          className="mt-1"
                          value={form.watch("barrio") || ""}
                          disabled
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="codigo_postal">Código postal (opcional)</Label>
                      <Input
                        id="codigo_postal"
                        {...form.register("codigo_postal")}
                        className="mt-1"
                        value={form.watch("codigo_postal") || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="barrio">Barrio (opcional)</Label>
                      <Input
                        id="barrio"
                        {...form.register("barrio")}
                        className="mt-1"
                        value={form.watch("barrio") || ""}
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="referencias">Referencias (opcional)</Label>
                <Textarea
                  id="referencias"
                  {...form.register("referencias")}
                  className="mt-1"
                  rows={2}
                  value={form.watch("referencias") || ""}
                  disabled={!!selectedAddress}
                  placeholder="Indicaciones adicionales para la entrega..."
                />
              </div>

              <div>
                <Label htmlFor="celular">
                  Celular <span className="text-red-500">*</span>
                </Label>
                <Input id="celular" {...form.register("celular")} className="mt-1" />
                {form.formState.errors.celular && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.celular.message}
                  </p>
                )}
              </div>
            </>
              ) : null}
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver al carrito
            </Button>
            <Button type="submit">Continuar con el envío</Button>
          </div>
        </form>

      </CardContent>
    </Card>
  );
}

// Componente para crear dirección (inline en checkout o en modal)
// nested=true: renderiza div en lugar de form para evitar form dentro de form (checkout)
function CreateAddressForm({
  onSuccess,
  onCancel,
  user,
  showCancel = false,
  nested = false,
}: {
  onSuccess: (address: any) => void;
  onCancel?: () => void;
  user: any;
  showCancel?: boolean;
  nested?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addressForm = useForm({
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

  const handleSubmit = async (data: any) => {
    if (!user?.id_usuario) return;
    setIsSubmitting(true);
    try {
      const newAddress = await addressService.createAddress({
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
      onSuccess(newAddress);
      addressForm.reset();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Error al crear la dirección");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Wrapper = nested ? "div" : "form";
  const wrapperProps = nested
    ? { className: "space-y-4" }
    : { onSubmit: addressForm.handleSubmit(handleSubmit), className: "space-y-4" };

  return (
    <Wrapper {...wrapperProps}>
      <div>
        <Label htmlFor="modal-nombre_direccion">
          Nombre de la dirección <span className="text-red-500">*</span>
        </Label>
        <Input
          id="modal-nombre_direccion"
          {...addressForm.register("nombre_direccion")}
          className="mt-1"
          placeholder="Ej: Casa, Oficina, etc."
        />
        {addressForm.formState.errors.nombre_direccion && (
          <p className="text-red-500 text-sm mt-1">
            {addressForm.formState.errors.nombre_direccion.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="modal-calle_direccion">
          Dirección <span className="text-red-500">*</span>
        </Label>
        <Input
          id="modal-calle_direccion"
          {...addressForm.register("calle_direccion")}
          className="mt-1"
        />
        {addressForm.formState.errors.calle_direccion && (
          <p className="text-red-500 text-sm mt-1">
            {addressForm.formState.errors.calle_direccion.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="modal-complemento">Complemento de dirección (opcional)</Label>
        <Input
          id="modal-complemento"
          {...addressForm.register("complemento")}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="modal-departamento">
            Departamento <span className="text-red-500">*</span>
          </Label>
          <Input
            id="modal-departamento"
            {...addressForm.register("departamento")}
            className="mt-1"
            placeholder="Ej: Santander, Cundinamarca, Antioquia..."
          />
          {addressForm.formState.errors.departamento && (
            <p className="text-red-500 text-sm mt-1">
              {addressForm.formState.errors.departamento.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="modal-ciudad">
            Ciudad <span className="text-red-500">*</span>
          </Label>
          <Input
            id="modal-ciudad"
            {...addressForm.register("ciudad")}
            className="mt-1"
            placeholder="Ej: Bogotá, Medellín, Bucaramanga..."
          />
          {addressForm.formState.errors.ciudad && (
            <p className="text-red-500 text-sm mt-1">
              {addressForm.formState.errors.ciudad.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="modal-codigo_postal">
            Código postal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="modal-codigo_postal"
            {...addressForm.register("codigo_postal")}
            className="mt-1"
          />
          {addressForm.formState.errors.codigo_postal && (
            <p className="text-red-500 text-sm mt-1">
              {addressForm.formState.errors.codigo_postal.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="modal-barrio">
          Barrio <span className="text-red-500">*</span>
        </Label>
        <Input id="modal-barrio" {...addressForm.register("barrio")} className="mt-1" />
        {addressForm.formState.errors.barrio && (
          <p className="text-red-500 text-sm mt-1">
            {addressForm.formState.errors.barrio.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="modal-referencias">Referencias (opcional)</Label>
        <Textarea
          id="modal-referencias"
          {...addressForm.register("referencias")}
          className="mt-1"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {showCancel && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => addressForm.reset()}
        >
          Limpiar
        </Button>
        <Button
          type={nested ? "button" : "submit"}
          disabled={isSubmitting}
          {...(nested ? { onClick: () => addressForm.handleSubmit(handleSubmit)() } : {})}
        >
          {isSubmitting ? "Guardando..." : "Guardar dirección"}
        </Button>
      </div>
    </Wrapper>
  );
}

// Componente Paso 2: Envío
function ShippingStep({
  form,
  onSubmit,
  shippingMethods,
  onBack,
}: {
  form: any;
  onSubmit: (data: ShippingFormData) => void;
  shippingMethods: any[];
  onBack: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6">Envío</h2>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label className="mb-3 block">Método de envío</Label>
            <RadioGroup
              value={form.watch("shippingMethod")}
              onValueChange={(value) => form.setValue("shippingMethod", value)}
            >
              {shippingMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg mb-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="cursor-pointer">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-500">
                        {method.estimatedDays} días hábiles
                      </div>
                    </Label>
                  </div>
                  <div className="font-semibold">{formatPrice(method.price)}</div>
                </div>
              ))}
            </RadioGroup>
            {form.formState.errors.shippingMethod && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.shippingMethod.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <Button type="button" variant="ghost" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver a la información
            </Button>
            <Button type="submit">Continuar con el pago</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Componente Paso 3: Pago
function PaymentStep({
  form,
  onSubmit,
  informationData,
  shippingMethod,
  shippingMethods,
  onBack,
}: {
  form: any;
  onSubmit: (data: PaymentFormData) => void;
  informationData: any;
  shippingMethod: string;
  shippingMethods: any[];
  onBack: () => void;
}) {
  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethod);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6">Pago</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Todas las transacciones son seguras y están cifradas.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dirección de envío */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Dirección de envío</span>
              <Button type="button" variant="ghost" size="sm">
                Cambiar
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {informationData.nombre} {informationData.apellidos}, {informationData.direccion},{" "}
              {informationData.ciudad} ({informationData.departamento})
            </p>
          </div>

          {/* Método de envío */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Método de envío</span>
              <Button type="button" variant="ghost" size="sm">
                Cambiar
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedShipping?.name} - {formatPrice(selectedShipping?.price || 0)}
            </p>
          </div>

          {/* Métodos de pago */}
          <div>
            <Label className="mb-3 block text-base font-medium">Método de pago</Label>
            <RadioGroup
              value={form.watch("paymentMethod")}
              onValueChange={(value) => form.setValue("paymentMethod", value)}
            >
              <div className="space-y-3">
                <label
                  htmlFor="wompi"
                  className={[
                    "flex cursor-pointer rounded-xl border-2 transition-colors",
                    form.watch("paymentMethod") === "wompi"
                      ? "border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800/60"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-4 p-5 w-full">
                    <RadioGroupItem value="wompi" id="wompi" className="mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600/50">
                            <CreditCard className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Pago en línea
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Pago seguro
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                        Paga con Wompi: PSE, tarjeta de crédito/débito, Nequi o corresponsal Bancolombia.
                      </p>
                      <div className="rounded-lg bg-white dark:bg-gray-800/50 px-4 py-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Métodos aceptados
                        </p>
                        <PaymentMethodsRow />
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Dirección de facturación */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Dirección de facturación</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Seleccione la dirección que coincida con su tarjeta o método de pago.
            </p>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="useShippingAddress"
                checked={form.watch("useShippingAddress")}
                onCheckedChange={(checked) =>
                  form.setValue("useShippingAddress", checked as boolean)
                }
              />
              <Label htmlFor="useShippingAddress" className="cursor-pointer">
                Utilizar la dirección de envío
              </Label>
            </div>

            {!form.watch("useShippingAddress") && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoIdentificacion">
                      Tipo de Identificación <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.watch("tipoIdentificacion") || "__none__"}
                      onValueChange={(v) => form.setValue("tipoIdentificacion", v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger id="tipoIdentificacion" className="mt-1">
                        <SelectValue placeholder="Elige una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Elige una opción</SelectItem>
                        <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                        <SelectItem value="NIT">NIT</SelectItem>
                        <SelectItem value="PP">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="numeroIdentificacion">
                      Número de Identificación <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="numeroIdentificacion"
                      {...form.register("numeroIdentificacion")}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Label htmlFor="notas">Notas sobre su pedido o indicaciones especiales para la entrega.</Label>
              <Textarea
                id="notas"
                {...form.register("notas")}
                className="mt-1"
                rows={3}
                placeholder="Notas opcionales..."
              />
            </div>
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button type="button" variant="ghost" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver a la información
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              Continuar con el pago
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Componente Resumen del pedido (descuentos automáticos + código aplicado en el carrito)
function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
  discountCanjeAmount = 0,
  discountCodeAmount = 0,
  discountCodeLabel,
  descuentosAutomaticos,
}: {
  items: any[];
  subtotal: number;
  shipping: number;
  total: number;
  discountCanjeAmount?: number;
  discountCodeAmount?: number;
  discountCodeLabel?: string;
  descuentosAutomaticos?: Array<{ nombre?: string; descuento_aplicado?: number }>;
}) {
  const { data: discounts } = useActiveDiscounts()
  return (
    <Card className="sticky top-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>

        <div className="space-y-4 mb-6">
          {Array.isArray(items) &&
            items.map((item) => (
              <div key={item.id_carrito_producto} className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden shrink-0">
                  {item.imagen_url ? (
                    <img
                      src={item.imagen_url}
                      alt={item.nombre_producto}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-400">IMG</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.nombre_producto}</p>
                  <p className="text-xs text-gray-500">
                    {item.marca && `${item.marca} / `}
                    {item.categoria && `${item.categoria} / `}
                    Tipo: {item.sublinea || "Único"}
                  </p>
                  {(() => {
                    const productForDiscount = {
                      id_producto: item.id_producto,
                      id_categoria: item.id_categoria_producto ?? item.category_id,
                      category_id: item.category_id ?? item.id_categoria_producto,
                      id_marca: item.id_marca ?? (item as any).marca_id,
                    }
                    const applicableDiscount = discounts ? getApplicableDiscount(productForDiscount as any, discounts) : null
                    const originalUnitPrice = item.precio_unitario
                    const discountedUnitPrice = applicableDiscount 
                      ? calculateDiscountedPrice(originalUnitPrice, applicableDiscount)
                      : originalUnitPrice
                    const hasDiscount = applicableDiscount && discountedUnitPrice < originalUnitPrice
                    const discountPercentage = hasDiscount 
                      ? calculateDiscountPercentage(originalUnitPrice, discountedUnitPrice)
                      : undefined
                    const originalSubtotal = item.subtotal
                    const discountedSubtotal = hasDiscount ? discountedUnitPrice * item.cantidad : originalSubtotal
                    
                    return (
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <p className="text-sm font-semibold">{formatPrice(discountedSubtotal)}</p>
                        {hasDiscount && originalSubtotal > discountedSubtotal && (
                          <>
                            <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                              {formatPrice(originalSubtotal)}
                            </span>
                            {discountPercentage != null && discountPercentage > 0 && (
                              <Badge variant="destructive" className="text-xs shrink-0">
                                -{discountPercentage}% OFF
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {Array.isArray(descuentosAutomaticos) && descuentosAutomaticos.length > 0 &&
            descuentosAutomaticos.map((d: { nombre?: string; descuento_aplicado?: number }, i: number) => (
              <div key={i} className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>{d.nombre ?? "Descuento"}</span>
                <span>-{formatPrice(Number(d.descuento_aplicado ?? 0))}</span>
              </div>
            ))}
          {discountCanjeAmount > 0 && (
            <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
              <span>Descuento por puntos</span>
              <span>-{formatPrice(discountCanjeAmount)}</span>
            </div>
          )}
          {discountCodeAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>{discountCodeLabel || "Descuento (código)"}</span>
              <span>-{formatPrice(discountCodeAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Envío</span>
            <span>{shipping > 0 ? formatPrice(shipping) : "Gratis"}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CheckoutPage;

