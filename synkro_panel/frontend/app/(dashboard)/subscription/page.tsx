'use client';

import { useState } from 'react';
import {
  CreditCard,
  Check,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  Sparkles,
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
} from "@/components/ui";

import { useActiveSubscriptions } from '@/hooks/use-subscriptions';
import { usePlans, usePlan } from '@/hooks/use-planes';
import { usePlanHistory } from '@/hooks/use-plan-history';
import { StatusBadge } from '@/components/dashboard';
import type { SubscriptionPublic, PlanPublic, PlanHistoryPublic } from '@/types';

// Format price
const formatPrice = (price: number | string, currency: string = 'USD') => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(numPrice);
};

// Format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
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
          <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
          <p className="text-muted-foreground mb-4">
            Choose a plan below to get started with Synkro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-linear-to-br from-synkro-green/5 to-synkro-green/10 border-synkro-green/20">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">Current Plan</CardTitle>
          <CardDescription>Your active subscription</CardDescription>
        </div>
        <StatusBadge status={subscription.estado_suscripcion} size="lg" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-synkro-green">{plan.nom_plan}</h2>
          <p className="text-2xl font-bold mt-1">
            {formatPrice(subscription.precio_actual)}
            <span className="text-base font-normal text-muted-foreground">
              /{subscription.tipo_facturacion === 'anual' ? 'year' : 'month'}
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
              <p className="text-xs text-muted-foreground">Started</p>
              <p className="text-sm font-medium">{formatDate(subscription.fecha_inicio)}</p>
            </div>
          </div>
          {subscription.fecha_proximo_pago && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Next Payment</p>
                <p className="text-sm font-medium">{formatDate(subscription.fecha_proximo_pago)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Plan Features */}
        {plan.features_json && Object.keys(plan.features_json).length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Plan Features:</p>
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
          <p className="text-sm font-medium mb-2">Plan Limits:</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{plan.max_productos || '∞'}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{plan.max_usuarios || '∞'}</p>
              <p className="text-xs text-muted-foreground">Users</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{plan.max_almacenamiento_gb || '∞'}</p>
              <p className="text-xs text-muted-foreground">GB Storage</p>
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
            Current Plan
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pt-8">
        <CardTitle className="text-xl">{plan.nom_plan}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{formatPrice(plan.precio_mensual)}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        {plan.precio_anual && (
          <p className="text-sm text-muted-foreground">
            or {formatPrice(plan.precio_anual)}/year (save 20%)
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
            <span>Up to {plan.max_productos || 'unlimited'} products</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-synkro-green" />
            <span>Up to {plan.max_usuarios || 'unlimited'} users</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-synkro-green" />
            <span>{plan.max_almacenamiento_gb || 'Unlimited'} GB storage</span>
          </li>
        </ul>

        <Button 
          className="w-full"
          variant={isCurrentPlan ? 'outline' : 'default'}
          disabled={isCurrentPlan}
          onClick={() => onSelect(plan)}
        >
          {isCurrentPlan ? (
            'Current Plan'
          ) : isUpgrade ? (
            <>
              <ArrowUp className="h-4 w-4 mr-2" />
              Upgrade
            </>
          ) : isDowngrade ? (
            <>
              <ArrowDown className="h-4 w-4 mr-2" />
              Downgrade
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Select Plan
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
        <p>No plan changes recorded yet.</p>
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
              Price changed: {formatPrice(record.precio_anterior || 0)} → {formatPrice(record.precio_nuevo)}
            </p>
            {record.motivo_cambio && (
              <p className="text-sm text-muted-foreground mt-1">
                Reason: {record.motivo_cambio}
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
  const [selectedPlan, setSelectedPlan] = useState<PlanPublic | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing preferences.
        </p>
      </div>

      {/* Current Subscription */}
      <CurrentSubscriptionCard 
        subscription={activeSubscription}
        plan={currentPlan}
        loading={loadingSubscription || loadingCurrentPlan}
      />

      {/* Available Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Available Plans</h2>
          <p className="text-sm text-muted-foreground">
            {activeSubscription 
              ? 'Upgrade or downgrade your plan at any time.' 
              : 'Choose the plan that best fits your needs.'}
          </p>
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
                onSelect={handlePlanSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Plan History */}
      {activeSubscription && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Plan History</h2>
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
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to change to the {selectedPlan?.nom_plan} plan?
              {selectedPlan && currentPlanPrice && (
                <span className="block mt-2">
                  Your new price will be {formatPrice(selectedPlan.precio_mensual)}/month.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmChange}>
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
