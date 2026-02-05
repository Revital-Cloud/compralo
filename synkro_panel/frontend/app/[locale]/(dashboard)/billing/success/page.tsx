'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from '@tanstack/react-query';
import { BILLING_KEYS } from '@/hooks/use-billing';

function SuccessContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const localePrefix = `/${locale}`;
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Invalidar queries de facturas para refrescar datos después del pago
    queryClient.invalidateQueries({ queryKey: BILLING_KEYS.all });
  }, [queryClient]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('billing.success.title')}</CardTitle>
          <CardDescription className="mt-2">
            {t('billing.success.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionId && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('billing.success.sessionId')}
              </p>
              <p className="font-mono text-xs mt-1 break-all">{sessionId}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => router.push(`${localePrefix}/billing`)}
              className="w-full"
            >
              {t('billing.success.backToBilling')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push(`${localePrefix}/dashboard`)}
              className="w-full"
            >
              {t('billing.success.backToDashboard')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SuccessPageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-full" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  const t = useTranslations();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('billing.success.pageTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('billing.success.pageSubtitle')}</p>
      </div>
      
      <Suspense fallback={<SuccessPageSkeleton />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
