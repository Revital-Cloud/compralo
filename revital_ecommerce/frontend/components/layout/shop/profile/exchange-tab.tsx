"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePointsPerUser } from "@/hooks/use-points";
import { exchangeService } from "@/services/exchange.service";
import type { DiscountExchangeable, CanjeDisponible } from "@/types/discount";
import { Button } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui";
import { Gift, Coins, Loader2, ShoppingCart, Tag } from "lucide-react";
import { toast } from "sonner";

/**
 * Pestaña de canje por puntos.
 *
 * Muestra:
 * - saldo de puntos
 * - canjes ya disponibles para usar en carrito
 * - descuentos canjeables y acción de canje
 */

function formatExpiration(fec: string | null): string {
  if (!fec) return "Sin vencimiento";
  try {
    const d = new Date(fec);
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function ExchangeTab() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id_usuario ?? 0;

  const { data: pointsData, isLoading: isLoadingPoints } = usePointsPerUser();
  const puntosDisponibles = pointsData?.puntos_disponibles != null
    ? Number(pointsData.puntos_disponibles)
    : 0;

  const { data: availableCanjes = [], isLoading: isLoadingCanjes } = useQuery<CanjeDisponible[]>({
    queryKey: ["myAvailableCanjes", userId],
    queryFn: () => exchangeService.getMyAvailableCanjes(),
    enabled: userId > 0,
    staleTime: 1000 * 60 * 2,
  });

  const { data: exchangeableDiscounts = [], isLoading: isLoadingDiscounts } = useQuery<
    DiscountExchangeable[]
  >({
    queryKey: ["exchangeableDiscounts", userId],
    queryFn: () => exchangeService.getExchangeableDiscounts(userId),
    enabled: userId > 0,
    staleTime: 1000 * 60 * 2,
  });

  const redeemMutation = useMutation({
    mutationFn: (id_descuento: number) =>
      exchangeService.redeemPointsForDiscount({ id_usuario: userId, id_descuento }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["points", "user"] });
      queryClient.invalidateQueries({ queryKey: ["exchangeableDiscounts", userId] });
      queryClient.invalidateQueries({ queryKey: ["myAvailableCanjes", userId] });
      toast.success(data.message ?? "Canje realizado correctamente.");
    },
    onError: (err: { response?: { data?: { detail?: string } }; message?: string }) => {
      const msg =
        err?.response?.data?.detail ?? err?.message ?? "No se pudo realizar el canje.";
      toast.error(msg);
    },
  });

  const handleUseInCart = (id_canje: number) => {
    router.push(`/cart?canje=${id_canje}`);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Saldo de puntos */}
      <Card className="border border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-gray-900 dark:to-gray-900 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Coins className="h-5 w-5 text-amber-500 dark:text-amber-300" />
            Puntos de fidelidad
          </CardTitle>
          <CardDescription className="text-amber-900/80 dark:text-muted-foreground">
            Canjea tus puntos por descuentos exclusivos para ti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPoints ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <p className="text-3xl font-semibold text-amber-700 dark:text-amber-300">
              {puntosDisponibles.toLocaleString()} puntos disponibles
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mis canjes disponibles */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Mis canjes disponibles
        </h3>
        {isLoadingCanjes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card
                key={i}
                className="bg-card border border-border dark:bg-gray-900/80 dark:border-white/10 p-6"
              >
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-9 w-24" />
              </Card>
            ))}
          </div>
        ) : availableCanjes.length === 0 ? (
          <Card className="bg-muted border border-dashed border-border dark:bg-gray-900/80 dark:border-white/10 p-8 text-center">
            <p className="text-muted-foreground">
              No tienes canjes disponibles. Canjea puntos por un descuento más abajo.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCanjes.map((c) => (
              <Card
                key={c.id_canje}
                className="bg-card border border-border hover:border-violet-500/50 transition-colors dark:bg-gray-900/80 dark:border-white/10"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{c.nom_descuento}</CardTitle>
                  <CardDescription>
                    {c.puntos_utilizados != null
                      ? `${c.puntos_utilizados} puntos canjeados`
                      : "Canje por puntos"}
                    {" · "}
                    Vence: {formatExpiration(c.fec_expiracion_canje)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    onClick={() => handleUseInCart(c.id_canje)}
                    className="w-full sm:w-auto"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Usar en carrito
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Descuentos canjeables */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Descuentos que puedes canjear
        </h3>

        {isLoadingDiscounts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="bg-card border border-border dark:bg-gray-900/80 dark:border-white/10 p-6"
              >
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-9 w-24" />
              </Card>
            ))}
          </div>
        ) : exchangeableDiscounts.length === 0 ? (
          <Card className="bg-muted border border-dashed border-border dark:bg-gray-900/80 dark:border-white/10 p-8 text-center">
            <p className="text-muted-foreground">
              No hay descuentos canjeables por puntos en este momento.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exchangeableDiscounts.map((d) => (
              <Card
                key={d.id_descuento}
                className="bg-card border border-border hover:border-violet-500/50 transition-colors dark:bg-gray-900/80 dark:border-white/10"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{d.nom_descuento}</CardTitle>
                  {d.des_descuento && (
                    <CardDescription className="line-clamp-2">
                      {d.des_descuento}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-amber-400 font-medium">
                      {d.costo_puntos_canje?.toLocaleString() ?? 0} puntos
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-green-400">{d.valor_descuento}</span>
                    <span className="text-muted-foreground">({d.tipo_calculo_texto})</span>
                  </div>
                  <Button
                    size="sm"
                    disabled={
                      !d.puede_canjear || redeemMutation.isPending
                    }
                    onClick={() => redeemMutation.mutate(d.id_descuento)}
                    className="w-full sm:w-auto"
                  >
                    {redeemMutation.isPending && redeemMutation.variables === d.id_descuento ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Canjeando...
                      </>
                    ) : d.puede_canjear ? (
                      "Canjear"
                    ) : (
                      "Puntos insuficientes"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
