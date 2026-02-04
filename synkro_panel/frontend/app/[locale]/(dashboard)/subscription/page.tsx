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

import { useActiveSubscriptionsSuspense, useChangeSubscriptionPlan } from '@/hooks/use-subscriptions';
import { usePlansSuspense, usePlan } from '@/hooks/use-planes';
import { usePlanHistory } from '@/hooks/use-plan-history';
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
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">{t('subscription.currentPlan.title')}</CardTitle>
          <CardDescription>{t('subscription.currentPlan.description')}</CardDescription>
        </div>
        <StatusBadge status={subscription.estado_suscripcion} size="lg" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-synkro-green">{plan.nom_plan}</h2>
          <p className="text-2xl font-bold mt-1">
            {formatPrice(subscription.precio_actual, 'USD', locale)}
            <span className="text-base font-normal text-muted-foreground">
              /{subscription.tipo_facturacion === 'anual' ? t('subscription.availablePlans.perYear').replace('/', '') : t('subscription.availablePlans.perMonth').replace('/', '')}
            </span>
          </p>
          {plan.desc_plan && (
            <p className="text-sm text-muted-foreground mt-2">{plan.desc_plan}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('subscription.currentPlan.started')}</p>
              <p className="text-sm font-medium">{formatDate(subscription.fecha_inicio, locale)}</p>
            </div>
          </div>
          {subscription.fecha_proximo_pago && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('subscription.currentPlan.nextPayment')}</p>
                <p className="text-sm font-medium">{formatDate(subscription.fecha_proximo_pago, locale)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Plan Features */}
        {plan.features_json && Object.keys(plan.features_json).length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">{t('subscription.currentPlan.planFeatures')}:</p>
            <ul className="space-y-1">
              {Object.entries(plan.features_json).slice(0, 5).map(([key, value]) => (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-synkro-green" />
                  <span>{key}: {String(value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Plan Limits */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">{t('subscription.currentPlan.planLimits')}:</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{plan.max_productos || '∞'}</p>
              <p className="text-xs text-muted-foreground">{t('subscription.currentPlan.products')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{plan.max_usuarios || '∞'}</p>
              <p className="text-xs text-muted-foreground">{t('subscription.currentPlan.users')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{plan.max_almacenamiento_gb || '∞'}</p>
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
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-synkro-green text-synkro-black">
            {t('subscription.availablePlans.currentPlanBadge')}
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pt-8">
        <CardTitle className="text-xl">{plan.nom_plan}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{formatPrice(plan.precio_mensual, 'USD', locale)}</span>
          <span className="text-muted-foreground">{t('subscription.availablePlans.perMonth')}</span>
        </div>
        {plan.precio_anual && (
          <p className="text-sm text-muted-foreground">
            {t('subscription.availablePlans.or')} {formatPrice(plan.precio_anual, 'USD', locale)}{t('subscription.availablePlans.perYear')} {t('subscription.availablePlans.save20')}
          </p>
        )}
        {plan.desc_plan && (
          <CardDescription className="mt-2">{plan.desc_plan}</CardDescription>
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
          className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
        >
          <div className="mt-1">{getChangeIcon(record.tipo_cambio)}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium capitalize">{record.tipo_cambio}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(record.fecha_cambio, locale)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('subscription.planHistory.priceChanged', {
                oldPrice: formatPrice(record.precio_anterior || 0, 'USD', locale),
                newPrice: formatPrice(record.precio_nuevo, 'USD', locale)
              })}
            </p>
            {record.motivo_cambio && (
              <p className="text-sm text-muted-foreground mt-1">
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
    if (!selectedPlan || !activeSubscription) {
      return;
    }

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
        onSuccess: () => {
          setShowConfirmDialog(false);
          setSelectedPlan(null);
          setChangeReason('');
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      <CurrentSubscriptionCard 
        subscription={activeSubscription}
        plan={currentPlan}
        loading={loadingCurrentPlan}
      />

      {/* Available Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t('subscription.availablePlans.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {activeSubscription 
              ? t('subscription.availablePlans.subtitle')
              : t('subscription.availablePlans.subtitleNoSubscription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <h2 className="text-xl font-semibold">{t('subscription.planHistory.title')}</h2>
          <Card>
            <CardContent className="pt-6">
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
            <DialogTitle>{t('subscription.changePlan.title')}</DialogTitle>
            <DialogDescription>
              {t('subscription.changePlan.description', { planName: selectedPlan?.nom_plan || '' })}
              {selectedPlan && currentPlanPrice && (
                <span className="block mt-2">
                  {t('subscription.changePlan.newPrice', { price: formatPrice(selectedPlan.precio_mensual, 'USD', locale) })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reason" className="text-sm">
              {t('subscription.changePlan.reasonLabel')} <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
            </Label>
            <Input
              id="reason"
              placeholder={t('subscription.changePlan.reasonPlaceholder')}
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              disabled={changePlanMutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirmChange} disabled={changePlanMutation.isPending || !selectedPlan}>
              {changePlanMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('subscription.changePlan.applying')}
                </>
              ) : (
                t('subscription.changePlan.confirm')
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('subscription.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subscription.subtitle')}</p>
      </div>
      <Suspense fallback={<SubscriptionPageSkeleton />}>
        <SubscriptionPageContent />
      </Suspense>
    </div>
  );
}
