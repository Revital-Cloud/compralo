'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Server,
  Globe,
  Rocket,
  ExternalLink,
  Settings,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import { useInstances, useInstancesSuspense, useCreateInstance } from '@/hooks/use-instances';
import { useActiveSubscriptions } from '@/hooks/use-subscriptions';
import { useDomains, useCreateDomain } from '@/hooks/use-domains';
import { useDeployments } from '@/hooks/use-deployments';
import { StatusBadge } from '@/components/dashboard/status-badge';
import type { InstancePublic, DomainPublic, DeploymentPublic, InstanceCreate, DomainCreate } from '@/types';

// Create Instance Form
function CreateInstanceForm({ onSuccess }: { onSuccess: () => void }) {
  const locale = useLocale();
  const t = useTranslations();
  const localePrefix = `/${locale}`;
  const { user } = useAuth();
  const { data: subscriptions } = useActiveSubscriptions();
  const createInstance = useCreateInstance();
  const [formData, setFormData] = useState({
    nom_instancia: '',
    slug_instancia: '',
  });

  const hasActiveSubscription = subscriptions && subscriptions.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.identificacion_fiscal) {
      toast.error(t('instance.create.errors.userInfoNotAvailable'));
      return;
    }

    // Validar que tenga un plan activo
    if (!hasActiveSubscription) {
      toast.error(t('instance.create.errors.noActiveSubscription'));
      return;
    }

    if (!formData.nom_instancia.trim() || !formData.slug_instancia.trim()) {
      toast.error(t('instance.create.errors.fillAllFields'));
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug_instancia)) {
      toast.error(t('instance.create.errors.invalidSlug'));
      return;
    }

    const instanceData: InstanceCreate = {
      identificacion_fiscal_cliente: user.identificacion_fiscal,
      nom_instancia: formData.nom_instancia,
      slug_instancia: formData.slug_instancia,
      db_nombre: `db_${formData.slug_instancia.replace(/-/g, '_')}`,
    };

    createInstance.mutate(instanceData, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  const handleSlugChange = (value: string) => {
    // Auto-format slug: lowercase, replace spaces with hyphens
    const formatted = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, slug_instancia: formatted }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto rounded-full bg-synkro-green/10 p-4 mb-4 w-fit">
          <Server className="h-12 w-12 text-synkro-green" />
        </div>
        <CardTitle className="text-2xl">{t('instance.create.title')}</CardTitle>
        <CardDescription>
          {t('instance.create.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasActiveSubscription ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                  {t('instance.create.noSubscriptionWarning.title')}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                  {t('instance.create.noSubscriptionWarning.description')}
                </p>
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                >
                  <Link href={`${localePrefix}/subscription`}>
                    {t('instance.create.noSubscriptionWarning.selectPlan')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nom_instancia">{t('instance.create.storeName')}</Label>
              <Input
                id="nom_instancia"
                placeholder={t('instance.create.storeNamePlaceholder')}
                value={formData.nom_instancia}
                onChange={(e) => setFormData(prev => ({ ...prev, nom_instancia: e.target.value }))}
                disabled={createInstance.isPending}
              />
              <p className="text-xs text-muted-foreground">
                {t('instance.create.storeNameHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug_instancia">{t('instance.create.storeSlug')}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">synkro.store/</span>
                <Input
                  id="slug_instancia"
                  placeholder="my-store"
                  value={formData.slug_instancia}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={createInstance.isPending}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('instance.create.storeSlugHelp')}
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
              disabled={createInstance.isPending}
            >
              {createInstance.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('instance.create.creating')}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('instance.create.createButton')}
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// Domains Section
function DomainsSection({ 
  instance, 
  domains, 
  loading 
}: { 
  instance: InstancePublic;
  domains: DomainPublic[];
  loading: boolean;
}) {
  const t = useTranslations();
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const createDomain = useCreateDomain();

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error(t('instance.domains.errors.enterDomainName'));
      return;
    }

    const domainData: DomainCreate = {
      id_instancia: instance.id_instancia,
      nom_dominio: newDomain,
      tipo_dominio: 'personalizado',
    };

    createDomain.mutate(domainData, {
      onSuccess: () => {
        setNewDomain('');
        setShowAddDomain(false);
      },
    });
  };

  const getDomainStatusIcon = (status: string) => {
    switch (status) {
      case 'activo':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('instance.domains.title')}</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowAddDomain(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('instance.domains.addDomain')}
        </Button>
      </div>

      {domains.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('instance.domains.noDomains')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {domains.map((domain) => (
            <Card key={domain.id_dominio} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDomainStatusIcon(domain.estado_dominio)}
                    <div>
                      <p className="font-medium">{domain.nom_dominio}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(`instance.domains.type.${domain.tipo_dominio}`)} • SSL {domain.ssl_habilitado ? t('instance.domains.sslEnabled') : t('instance.domains.sslDisabled')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.ssl_habilitado && (
                      <Shield className="h-4 w-4 text-green-500" />
                    )}
                    <Badge variant={domain.estado_dominio === 'activo' ? 'default' : 'secondary'}>
                      {t(`instance.domains.status.${domain.estado_dominio}`)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Domain Dialog */}
      <Dialog open={showAddDomain} onOpenChange={setShowAddDomain}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('instance.domains.addTitle')}</DialogTitle>
            <DialogDescription>
              {t('instance.domains.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">{t('instance.domains.domainName')}</Label>
              <Input
                id="domain"
                placeholder={t('instance.domains.domainPlaceholder')}
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDomain(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleAddDomain}
              disabled={createDomain.isPending}
            >
              {createDomain.isPending ? t('instance.domains.adding') : t('instance.domains.addButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Deployments Section
function DeploymentsSection({ 
  instance, 
  deployments, 
  loading 
}: { 
  instance: InstancePublic;
  deployments: DeploymentPublic[];
  loading: boolean;
}) {
  const t = useTranslations();
  const getDeployStatusIcon = (status: string) => {
    switch (status) {
      case 'completado':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'fallido':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'en_proceso':
      case 'iniciado':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('instance.deployments.title')}</h3>
      </div>

      {deployments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Rocket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('instance.deployments.noDeployments')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {deployments.slice(0, 5).map((deployment) => (
            <Card key={deployment.id_deployment} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDeployStatusIcon(deployment.estado_deploy)}
                    <div>
                      <p className="font-medium text-sm">
                        v{deployment.version_deploy}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(deployment.fecha_inicio)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {t(`instance.deployments.type.${deployment.tipo_deploy}`)}
                    </Badge>
                    <Badge 
                      variant={deployment.estado_deploy === 'completado' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {t(`instance.deployments.status.${deployment.estado_deploy}`)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Instance Details View
function InstanceDetails({ instance }: { instance: InstancePublic }) {
  const locale = useLocale();
  const t = useTranslations();
  const localePrefix = `/${locale}`;
  const { data: domains, isLoading: loadingDomains } = useDomains(instance.id_instancia);
  const { data: deployments, isLoading: loadingDeployments } = useDeployments(instance.id_instancia);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Instance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{instance.nom_instancia}</h1>
            <StatusBadge status={instance.estado_instancia} />
          </div>
          <p className="text-muted-foreground mt-1">{instance.slug_instancia}</p>
        </div>
        <div className="flex gap-2">
          {instance.frontend_url && (
            <Button asChild>
              <a href={instance.frontend_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('instance.info.viewStore')}
              </a>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`${localePrefix}/instance/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              {t('common.settings')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Instance Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('instance.info.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {instance.frontend_url && (
              <div>
                <p className="text-sm text-muted-foreground">{t('instance.info.storeUrl')}</p>
                <a 
                  href={instance.frontend_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-synkro-green hover:underline flex items-center gap-1"
                >
                  {instance.frontend_url.replace(/^https?:\/\//, '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {instance.version_instancia && (
              <div>
                <p className="text-sm text-muted-foreground">{t('instance.info.version')}</p>
                <p className="font-mono">{instance.version_instancia}</p>
              </div>
            )}
            {instance.region_deployment && (
              <div>
                <p className="text-sm text-muted-foreground">{t('instance.info.region')}</p>
                <p>{instance.region_deployment}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{t('instance.info.activated')}</p>
              <p>{formatDate(instance.fecha_activacion)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('instance.info.lastDeploy')}</p>
              <p>{formatDate(instance.fecha_ultimo_deploy)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Domains and Deployments */}
      <Tabs defaultValue="domains" className="space-y-4">
        <TabsList>
          <TabsTrigger value="domains">
            <Globe className="h-4 w-4 mr-2" />
            {t('instance.domains.title')}
          </TabsTrigger>
          <TabsTrigger value="deployments">
            <Rocket className="h-4 w-4 mr-2" />
            {t('instance.deployments.title')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="domains">
          <DomainsSection 
            instance={instance}
            domains={domains || []}
            loading={loadingDomains}
          />
        </TabsContent>
        <TabsContent value="deployments">
          <DeploymentsSection 
            instance={instance}
            deployments={deployments || []}
            loading={loadingDeployments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Skeleton shown while instances load (Suspense fallback)
function InstancePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// Content that suspends until instances are loaded
function InstancePageContent() {
  const { data: instances, refetch } = useInstancesSuspense();
  const instance = instances && instances.length > 0 ? instances[0] : null;

  if (!instance) {
    return <CreateInstanceForm onSuccess={() => refetch()} />;
  }

  return <InstanceDetails instance={instance} />;
}

export default function InstancePage() {
  return (
    <Suspense fallback={<InstancePageSkeleton />}>
      <InstancePageContent />
    </Suspense>
  );
}
