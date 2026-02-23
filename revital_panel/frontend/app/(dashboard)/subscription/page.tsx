'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  Check,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Skeleton,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";

import { useActiveSubscriptions } from '@/hooks/use-subscriptions';
import { usePlans, usePlan } from '@/hooks/use-planes';
import { usePlanHistory } from '@/hooks/use-plan-history';
import { useFormatters } from '@/hooks/use-formatters';
import { StatusBadge } from '@/components/dashboard';
import { appConfig } from '@/content/config';
import type { SubscriptionPublic, PlanPublic, PlanHistoryPublic } from '@/types';

const isEnterprisePlan = (plan: PlanPublic) =>
  plan.nom_plan?.toLowerCase() === 'enterprise';

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
  const t = useTranslations('subscription');
  const { formatPrice, formatDate } = useFormatters();

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
          <h3 className="text-lg font-semibold mb-2">{t('currentPlan.noSubscription.title')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('currentPlan.noSubscription.description')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-linear-to-br from-revital-green/5 to-revital-green/10 border-revital-green/20">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">{t('currentPlan.title')}</CardTitle>
          <CardDescription>{t('currentPlan.description')}</CardDescription>
        </div>
        <StatusBadge status={subscription.estado_suscripcion} size="lg" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-revital-green">{plan.nom_plan}</h2>
          <p className="text-2xl font-bold mt-1">
            {formatPrice(subscription.precio_actual)}
            <span className="text-base font-normal text-muted-foreground">
              {subscription.tipo_facturacion === 'anual' ? t('availablePlans.perYear') : t('availablePlans.perMonth')}
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
              <p className="text-xs text-muted-foreground">{t('currentPlan.started')}</p>
              <p className="text-sm font-medium">{formatDate(subscription.fecha_inicio)}</p>
            </div>
          </div>
          {subscription.fecha_proximo_pago && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('currentPlan.nextPayment')}</p>
                <p className="text-sm font-medium">{formatDate(subscription.fecha_proximo_pago)}</p>
              </div>
            </div>
          )}
        </div>

        {plan.features_json && Object.keys(plan.features_json).length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">{t('currentPlan.planFeatures')}</p>
            <ul className="space-y-1">
              {Object.entries(plan.features_json).slice(0, 5).map(([key, value]) => (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-revital-green" />
                  <span>{key}: {String(value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">{t('currentPlan.planLimits')}</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{plan.max_productos || '∞'}</p>
              <p className="text-xs text-muted-foreground">{t('currentPlan.products')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{plan.max_usuarios || '∞'}</p>
              <p className="text-xs text-muted-foreground">{t('currentPlan.users')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{plan.max_almacenamiento_gb || '∞'}</p>
              <p className="text-xs text-muted-foreground">{t('currentPlan.storage')}</p>
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
  billingPeriod,
  onSelect,
}: {
  plan: PlanPublic;
  isCurrentPlan: boolean;
  currentPlanPrice?: number;
  billingPeriod: 'mensual' | 'anual';
  onSelect: (plan: PlanPublic) => void;
}) {
  const t = useTranslations('subscription');
  const { formatPrice } = useFormatters();

  const isEnterprise = isEnterprisePlan(plan);
  const price = billingPeriod === 'anual' && plan.precio_anual != null
    ? (typeof plan.precio_anual === 'string' ? parseFloat(plan.precio_anual) : plan.precio_anual)
    : (typeof plan.precio_mensual === 'string' ? parseFloat(plan.precio_mensual) : plan.precio_mensual);
  const planPrice = isEnterprise ? 0 : price;

  const isUpgrade = !isEnterprise && currentPlanPrice !== undefined && planPrice > currentPlanPrice;
  const isDowngrade = !isEnterprise && currentPlanPrice !== undefined && planPrice < currentPlanPrice;

  const productsText = plan.max_productos
    ? t('availablePlans.upTo', { count: plan.max_productos })
    : t('availablePlans.unlimitedProducts');
  const usersText = plan.max_usuarios
    ? t('availablePlans.upToUsers', { count: plan.max_usuarios })
    : t('availablePlans.unlimitedUsers');
  const storageText = plan.max_almacenamiento_gb
    ? `${plan.max_almacenamiento_gb} ${t('currentPlan.storage')}`
    : `${t('availablePlans.unlimited')} ${t('currentPlan.storage')}`;

  const contactSalesUrl = appConfig.registerWithPlan?.enterprise ?? `${appConfig.appUrl}/#contact`;

  return (
    <Card className={`relative transition-all hover:shadow-lg ${isCurrentPlan ? 'ring-2 ring-revital-green' : ''}`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-revital-green text-revital-black">
            {t('availablePlans.currentPlanBadge')}
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pt-8">
        <CardTitle className="text-xl">{plan.nom_plan}</CardTitle>
        <div className="mt-4">
          {isEnterprise ? (
            <span className="text-2xl font-bold">{t('availablePlans.contactUs')}</span>
          ) : (
            <>
              <span className="text-4xl font-bold">
                {formatPrice(billingPeriod === 'anual' && plan.precio_anual != null ? plan.precio_anual : plan.precio_mensual)}
              </span>
              <span className="text-muted-foreground">
                {billingPeriod === 'anual' ? t('availablePlans.perYear') : t('availablePlans.perMonth')}
              </span>
            </>
          )}
        </div>
        {!isEnterprise && billingPeriod === 'mensual' && plan.precio_anual != null && (
          <p className="text-sm text-muted-foreground">
            {t('availablePlans.or')} {formatPrice(plan.precio_anual)}{t('availablePlans.perYear')}{t('availablePlans.save20')}
          </p>
        )}
        {!isEnterprise && billingPeriod === 'anual' && plan.precio_anual != null && (
          <p className="text-sm text-muted-foreground">{t('availablePlans.save20')}</p>
        )}
        {plan.desc_plan && (
          <CardDescription className="mt-2">{plan.desc_plan}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-revital-green" />
            <span>{productsText}</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-revital-green" />
            <span>{usersText}</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-revital-green" />
            <span>{storageText}</span>
          </li>
        </ul>

        {isEnterprise ? (
          <Button
            className="w-full"
            variant="default"
            asChild
          >
            <a href={contactSalesUrl} target="_blank" rel="noopener noreferrer">
              <PhoneCall className="h-4 w-4 mr-2" />
              {t('availablePlans.contactSales')}
            </a>
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isCurrentPlan ? 'outline' : 'default'}
            disabled={isCurrentPlan}
            onClick={() => onSelect(plan)}
          >
            {isCurrentPlan ? (
              t('availablePlans.currentPlanBadge')
            ) : isUpgrade ? (
              <>
                <ArrowUp className="h-4 w-4 mr-2" />
                {t('availablePlans.upgrade')}
              </>
            ) : isDowngrade ? (
              <>
                <ArrowDown className="h-4 w-4 mr-2" />
                {t('availablePlans.downgrade')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('availablePlans.selectPlan')}
              </>
            )}
          </Button>
        )}
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
  const t = useTranslations('subscription');
  const { formatPrice, formatDate } = useFormatters();

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
        <p>{t('planHistory.noHistory')}</p>
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
                {formatDate(record.fecha_cambio)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('planHistory.priceChanged', {
                oldPrice: formatPrice(record.precio_anterior || 0),
                newPrice: formatPrice(record.precio_nuevo),
              })}
            </p>
            {record.motivo_cambio && (
              <p className="text-sm text-muted-foreground mt-1">
                {t('planHistory.reason', { reason: record.motivo_cambio })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Subscription Page
export default function SubscriptionPage() {
  const t = useTranslations('subscription');
  const { formatPrice } = useFormatters();

  const [selectedPlan, setSelectedPlan] = useState<PlanPublic | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'mensual' | 'anual'>('mensual');

  const { data: subscriptions, isLoading: loadingSubscription } = useActiveSubscriptions();
  const { data: plans, isLoading: loadingPlans } = usePlans(true);
  
  const activeSubscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
  
  const { data: currentPlan, isLoading: loadingCurrentPlan } = usePlan(
    activeSubscription?.id_plan || ''
  );
  
  const { data: planHistory, isLoading: loadingHistory } = usePlanHistory(
    activeSubscription?.id_suscripcion
  );

  const currentPlanPrice = currentPlan 
    ? (typeof currentPlan.precio_mensual === 'string' 
        ? parseFloat(currentPlan.precio_mensual) 
        : currentPlan.precio_mensual)
    : undefined;

  const handlePlanSelect = (plan: PlanPublic) => {
    if (isEnterprisePlan(plan)) return;
    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = () => {
    // TODO: Implement plan change mutation
    console.log('Changing to plan:', selectedPlan);
    setShowConfirmDialog(false);
    setSelectedPlan(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      <CurrentSubscriptionCard 
        subscription={activeSubscription}
        plan={currentPlan}
        loading={loadingSubscription || loadingCurrentPlan}
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t('availablePlans.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {activeSubscription
                ? t('availablePlans.subtitle')
                : t('availablePlans.subtitleNoSubscription')}
            </p>
          </div>
          <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'mensual' | 'anual')}>
            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="mensual">{t('availablePlans.billingMonthly')}</TabsTrigger>
              <TabsTrigger value="anual">{t('availablePlans.billingAnnual')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map((plan: PlanPublic) => (
              <PlanCard
                key={plan.id_plan}
                plan={plan}
                isCurrentPlan={currentPlan?.id_plan === plan.id_plan}
                currentPlanPrice={currentPlanPrice}
                billingPeriod={billingPeriod}
                onSelect={handlePlanSelect}
              />
            ))}
          </div>
        )}
      </div>

      {activeSubscription && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('planHistory.title')}</h2>
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

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('changePlan.title')}</DialogTitle>
            <DialogDescription>
              {selectedPlan && isEnterprisePlan(selectedPlan) ? (
                t('changePlan.descriptionEnterprise')
              ) : (
                <>
                  {t('changePlan.description', { planName: selectedPlan?.nom_plan ?? '' })}
                  {selectedPlan && currentPlanPrice != null && (
                    <span className="block mt-2">
                      {billingPeriod === 'anual' && selectedPlan.precio_anual != null
                        ? t('changePlan.newPriceAnnual', {
                            price: formatPrice(selectedPlan.precio_anual),
                          })
                        : t('changePlan.newPrice', {
                            price: formatPrice(selectedPlan.precio_mensual),
                          })}
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t('changePlan.cancel')}
            </Button>
            {selectedPlan && isEnterprisePlan(selectedPlan) ? (
              <Button asChild>
                <a
                  href={appConfig.registerWithPlan?.enterprise ?? `${appConfig.appUrl}/#contact`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  {t('availablePlans.contactSales')}
                </a>
              </Button>
            ) : (
              <Button onClick={handleConfirmChange}>{t('changePlan.confirm')}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
