'use client';

import { Suspense, useState } from 'react';
import {
  CreditCard,
  Check,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';

import { useActiveSubscriptionsSuspense, useChangeSubscriptionPlan, useCreateSubscription } from '@/hooks/use-subscriptions';
import { usePlansSuspense, usePlan } from '@/hooks/use-planes';
import { usePlanHistory } from '@/hooks/use-plan-history';
import { useAuth } from '@/hooks/use-auth';
import { StatusBadge } from '@/components/dashboard/status-badge';
import type { SubscriptionPublic, PlanPublic, PlanHistoryPublic } from '@/types';

// Format price with locale
const formatPrice = (price: number | string, currency: string = 'USD', locale: string = 'en') => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(numPrice);
};

// Format date with locale
const formatDate = (dateString: string | null | undefined, locale: string = 'en') => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Humanize feature key for display (e.g. "support" → "Support", "max_products" → "Max products")
const formatFeatureLabel = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Format feature value for display: hide redundant "true", humanize strings
const formatFeatureValue = (value: unknown): string | null => {
  if (value === true) return null; // boolean true = just show label with check, no text
  if (value === false) return null;
  if (value === undefined || value === null) return null;
  const s = String(value).trim().toLowerCase();
  if (s === 'true' || s === 'yes') return null;
  if (s === 'false' || s === 'no') return null;
  const trimmed = String(value).trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// Current Subscription Card
function CurrentSubscriptionCard({ 
  subscription, 
  plan,
  loading 
}: { 
  subscription?: SubscriptionPublic | null;
  plan?: PlanPublic | null;
  loading?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !plan) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('subscription.currentPlan.noSubscription.title')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('subscription.currentPlan.noSubscription.description')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-linear-to-br from-synkro-green/5 to-synkro-green/10 border-synkro-green/20">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg">{t('subscription.currentPlan.title')}</CardTitle>
          <CardDescription>{t('subscription.currentPlan.description')}</CardDescription>
        </div>
        <StatusBadge status={subscription.estado_suscripcion} size="lg" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-synkro-green">{plan.nom_plan}</h2>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {formatPrice(subscription.precio_actual, 'USD', locale)}
            <span className="text-sm sm:text-base font-normal text-muted-foreground">
              /{subscription.tipo_facturacion === 'anual' ? t('subscription.availablePlans.perYear').replace('/', '') : t('subscription.availablePlans.perMonth').replace('/', '')}
            </span>
          </p>
          {plan.desc_plan && (
            <p className="text-sm text-muted-foreground mt-2">{plan.desc_plan}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t('subscription.currentPlan.started')}</p>
              <p className="text-sm font-medium wrap-break-word">{formatDate(subscription.fecha_inicio, locale)}</p>
            </div>
          </div>
          {subscription.fecha_proximo_pago && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t('subscription.currentPlan.nextPayment')}</p>
                <p className="text-sm font-medium wrap-break-word">{formatDate(subscription.fecha_proximo_pago, locale)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Plan Features */}
        {plan.features_json && Object.keys(plan.features_json).length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-3">{t('subscription.currentPlan.planFeatures')}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(plan.features_json).slice(0, 8).map(([key, value]) => {
                const label = formatFeatureLabel(key);
                const displayValue = formatFeatureValue(value);
                const isIncluded = value === true || String(value).toLowerCase() === 'true' || (value !== false && value !== undefined && value !== null && String(value).toLowerCase() !== 'false');
                if (!isIncluded && (value === false || String(value).toLowerCase() === 'false')) return null;
                return (
                  <div
                    key={key}
                    className="inline-flex items-center gap-2 rounded-md bg-muted/60 dark:bg-muted/40 px-3 py-1.5 text-sm"
                  >
                    <Check className="h-4 w-4 text-synkro-green shrink-0" />
                    <span className="font-medium text-foreground">{label}</span>
                    {displayValue && (
                      <span className="text-muted-foreground before:content-['·'] before:mr-2">
                        {displayValue}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Plan Limits */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">{t('subscription.currentPlan.planLimits')}:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-bold">{plan.max_productos || '∞'}</p>
              <p className="text-xs text-muted-foreground">{t('subscription.currentPlan.products')}</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{plan.max_usuarios || '∞'}</p>
              <p className="text-xs text-muted-foreground">{t('subscription.currentPlan.users')}</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{plan.max_almacenamiento_gb || '∞'}</p>
              <p className="text-xs text-muted-foreground">{t('subscription.currentPlan.storage')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Plan Card Component
function PlanCard({ 
  plan, 
  isCurrentPlan,
  currentPlanPrice,
  onSelect,
}: { 
  plan: PlanPublic;
  isCurrentPlan: boolean;
  currentPlanPrice?: number;
  onSelect: (plan: PlanPublic) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const planPrice = typeof plan.precio_mensual === 'string' 
    ? parseFloat(plan.precio_mensual) 
    : plan.precio_mensual;
  
  const isUpgrade = currentPlanPrice !== undefined && planPrice > currentPlanPrice;
  const isDowngrade = currentPlanPrice !== undefined && planPrice < currentPlanPrice;

  return (
    <Card className={`relative transition-all hover:shadow-lg ${isCurrentPlan ? 'ring-2 ring-synkro-green' : ''}`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-synkro-green text-synkro-black text-xs sm:text-sm">
            {t('subscription.availablePlans.currentPlanBadge')}
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pt-6 sm:pt-8">
        <CardTitle className="text-lg sm:text-xl">{plan.nom_plan}</CardTitle>
        <div className="mt-4">
          <span className="text-3xl sm:text-4xl font-bold">{formatPrice(plan.precio_mensual, 'USD', locale)}</span>
          <span className="text-sm sm:text-base text-muted-foreground">{t('subscription.availablePlans.perMonth')}</span>
        </div>
        {plan.precio_anual && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 px-2">
            {t('subscription.availablePlans.or')} {formatPrice(plan.precio_anual, 'USD', locale)}{t('subscription.availablePlans.perYear')} {t('subscription.availablePlans.save20')}
          </p>
        )}
        {plan.desc_plan && (
          <CardDescription className="mt-2 text-sm">{plan.desc_plan}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Limits */}
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-synkro-green" />
            <span>
              {plan.max_productos 
                ? t('subscription.availablePlans.upTo', { count: plan.max_productos })
                : t('subscription.availablePlans.unlimitedProducts')}
            </span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-synkro-green" />
            <span>
              {plan.max_usuarios 
                ? t('subscription.availablePlans.upToUsers', { count: plan.max_usuarios })
                : t('subscription.availablePlans.unlimitedUsers')}
            </span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-synkro-green" />
            <span>{plan.max_almacenamiento_gb || t('subscription.availablePlans.unlimited')} {t('subscription.currentPlan.storage')}</span>
          </li>
        </ul>

        <Button 
          className="w-full"
          variant={isCurrentPlan ? 'outline' : 'default'}
          disabled={isCurrentPlan}
          onClick={() => onSelect(plan)}
        >
          {isCurrentPlan ? (
            t('subscription.availablePlans.currentPlanBadge')
          ) : isUpgrade ? (
            <>
              <ArrowUp className="h-4 w-4 mr-2" />
              {t('subscription.availablePlans.upgrade')}
            </>
          ) : isDowngrade ? (
            <>
              <ArrowDown className="h-4 w-4 mr-2" />
              {t('subscription.availablePlans.downgrade')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {t('subscription.availablePlans.selectPlan')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Plan History Timeline
function PlanHistoryTimeline({ 
  history, 
  loading 
}: { 
  history: PlanHistoryPublic[];
  loading: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const getChangeIcon = (tipo: string) => {
    switch (tipo) {
      case 'upgrade':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'downgrade':
        return <ArrowDown className="h-4 w-4 text-amber-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2" />
        <p>{t('subscription.planHistory.noHistory')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((record) => (
        <div 
          key={record.id_historial} 
          className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-4 rounded-lg bg-muted/50"
        >
          <div className="mt-1 shrink-0">{getChangeIcon(record.tipo_cambio)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="font-medium capitalize">{record.tipo_cambio}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(record.fecha_cambio, locale)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground wrap-break-word">
              {t('subscription.planHistory.priceChanged', {
                oldPrice: formatPrice(record.precio_anterior || 0, 'USD', locale),
                newPrice: formatPrice(record.precio_nuevo, 'USD', locale)
              })}
            </p>
            {record.motivo_cambio && (
              <p className="text-sm text-muted-foreground mt-1 wrap-break-word">
                {t('subscription.planHistory.reason', { reason: record.motivo_cambio })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton shown while subscription data loads (Suspense fallback)
function SubscriptionPageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-48" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

// Content that suspends until active subscriptions and plans are loaded
function SubscriptionPageContent() {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanPublic | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  const { data: subscriptions } = useActiveSubscriptionsSuspense();
  const { data: plans } = usePlansSuspense(true);
  
  const activeSubscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
  
  const { data: currentPlan, isLoading: loadingCurrentPlan } = usePlan(
    activeSubscription?.id_plan || ''
  );
  
  const { data: planHistory, isLoading: loadingHistory } = usePlanHistory(
    activeSubscription?.id_suscripcion
  );

  const changePlanMutation = useChangeSubscriptionPlan();
  const createSubscriptionMutation = useCreateSubscription();

  const currentPlanPrice = currentPlan 
    ? (typeof currentPlan.precio_mensual === 'string' 
        ? parseFloat(currentPlan.precio_mensual) 
        : currentPlan.precio_mensual)
    : undefined;

  const handlePlanSelect = (plan: PlanPublic) => {
    setSelectedPlan(plan);
    setChangeReason('');
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = () => {
    if (!selectedPlan) {
      return;
    }

    // Si no hay suscripción activa, crear una nueva
    if (!activeSubscription) {
      if (!user?.identificacion_fiscal) {
        toast.error(t('subscription.create.errors.userInfoNotAvailable'));
        return;
      }

      const selectedPrice =
        typeof selectedPlan.precio_mensual === 'string'
          ? parseFloat(selectedPlan.precio_mensual)
          : selectedPlan.precio_mensual;

      // Calcular fechas: inicio ahora, próximo pago en 1 mes
      const startDate = new Date();
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      createSubscriptionMutation.mutate(
        {
          identificacion_fiscal_cliente: user.identificacion_fiscal,
          id_plan: selectedPlan.id_plan,
          tipo_facturacion: 'mensual',
          precio_actual: selectedPrice,
          estado_suscripcion: 'activa',
          fecha_inicio: startDate.toISOString(),
          fecha_proximo_pago: nextPaymentDate.toISOString(),
        },
        {
          onSuccess: (data) => {
            if (data?.checkout_url) {
              window.location.href = data.checkout_url;
              return;
            }
            setShowConfirmDialog(false);
            setSelectedPlan(null);
            setChangeReason('');
          },
        },
      );
      return;
    }

    // Si hay suscripción activa, cambiar de plan
    const selectedPrice =
      typeof selectedPlan.precio_mensual === 'string'
        ? parseFloat(selectedPlan.precio_mensual)
        : selectedPlan.precio_mensual;

    const tipoCambio: 'upgrade' | 'downgrade' | 'lateral' =
      currentPlanPrice === undefined || selectedPrice === currentPlanPrice
        ? 'lateral'
        : selectedPrice > (currentPlanPrice ?? 0)
          ? 'upgrade'
          : 'downgrade';

    changePlanMutation.mutate(
      {
        idSubscription: activeSubscription.id_suscripcion,
        idPlanNuevo: selectedPlan.id_plan,
        tipoCambio,
        motivo: changeReason || undefined,
      },
      {
        onSuccess: (data) => {
          if (data?.checkout_url) {
            window.location.href = data.checkout_url;
            return;
          }
          setShowConfirmDialog(false);
          setSelectedPlan(null);
          setChangeReason('');
        },
      },
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Current Subscription */}
      <CurrentSubscriptionCard 
        subscription={activeSubscription}
        plan={currentPlan}
        loading={loadingCurrentPlan}
      />

      {/* Available Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">{t('subscription.availablePlans.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {activeSubscription 
              ? t('subscription.availablePlans.subtitle')
              : t('subscription.availablePlans.subtitleNoSubscription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans?.map((plan: PlanPublic) => (
            <PlanCard
              key={plan.id_plan}
              plan={plan}
              isCurrentPlan={currentPlan?.id_plan === plan.id_plan}
              currentPlanPrice={currentPlanPrice}
              onSelect={handlePlanSelect}
            />
          ))}
        </div>
      </div>

      {/* Plan History */}
      {activeSubscription && (
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">{t('subscription.planHistory.title')}</h2>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <PlanHistoryTimeline 
                history={planHistory || []}
                loading={loadingHistory}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeSubscription 
                ? t('subscription.changePlan.title')
                : t('subscription.selectPlan.title')}
            </DialogTitle>
            <DialogDescription>
              {activeSubscription 
                ? t('subscription.changePlan.description', { planName: selectedPlan?.nom_plan || '' })
                : t('subscription.selectPlan.description', { planName: selectedPlan?.nom_plan || '' })}
              {selectedPlan && (
                <span className="block mt-2">
                  {activeSubscription && currentPlanPrice
                    ? t('subscription.changePlan.newPrice', { price: formatPrice(selectedPlan.precio_mensual, 'USD', locale) })
                    : t('subscription.selectPlan.price', { price: formatPrice(selectedPlan.precio_mensual, 'USD', locale) })}
                </span>
              )}
              {activeSubscription && selectedPlan && currentPlanPrice != null && (
                (typeof selectedPlan.precio_mensual === 'string' ? parseFloat(selectedPlan.precio_mensual) : selectedPlan.precio_mensual) > currentPlanPrice && (
                  <span className="block mt-2 text-sm font-medium text-foreground">
                    {t('subscription.changePlan.payWithStripe')}
                  </span>
                )
              )}
            </DialogDescription>
          </DialogHeader>
          {activeSubscription && (
            <div className="space-y-2 py-2">
              <Label htmlFor="reason" className="text-sm">
                {t('subscription.changePlan.reasonLabel')} <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <Input
                id="reason"
                placeholder={t('subscription.changePlan.reasonPlaceholder')}
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                disabled={changePlanMutation.isPending || createSubscriptionMutation.isPending}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmChange} 
              disabled={
                (changePlanMutation.isPending || createSubscriptionMutation.isPending) || 
                !selectedPlan ||
                (!activeSubscription && !user?.identificacion_fiscal)
              }
            >
              {(changePlanMutation.isPending || createSubscriptionMutation.isPending) ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {activeSubscription 
                    ? t('subscription.changePlan.applying')
                    : t('subscription.selectPlan.creating')}
                </>
              ) : (
                activeSubscription 
                  ? (selectedPlan && currentPlanPrice != null && (typeof selectedPlan.precio_mensual === 'string' ? parseFloat(selectedPlan.precio_mensual) : selectedPlan.precio_mensual) > currentPlanPrice
                      ? t('subscription.changePlan.confirmAndPay')
                      : t('subscription.changePlan.confirm'))
                  : t('subscription.selectPlan.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SubscriptionPage() {
  const t = useTranslations();
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{t('subscription.title')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('subscription.subtitle')}</p>
      </div>
      <Suspense fallback={<SubscriptionPageSkeleton />}>
        <SubscriptionPageContent />
      </Suspense>
    </div>
  );
}
