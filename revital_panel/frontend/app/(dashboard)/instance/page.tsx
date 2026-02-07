'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Skeleton,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Badge,
} from "@/components/ui";
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import { useInstances, useCreateInstance } from '@/hooks/use-instances';
import { useDomains, useCreateDomain } from '@/hooks/use-domains';
import { useDeployments } from '@/hooks/use-deployments';
import { StatusBadge } from '@/components/dashboard';
import type { InstancePublic, DomainPublic, DeploymentPublic, InstanceCreate, DomainCreate } from '@/types';

// Create Instance Form
function CreateInstanceForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const createInstance = useCreateInstance();
  const [formData, setFormData] = useState({
    nom_instancia: '',
    slug_instancia: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.identificacion_fiscal) {
      toast.error('User information not available');
      return;
    }

    if (!formData.nom_instancia.trim() || !formData.slug_instancia.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug_instancia)) {
      toast.error('Slug must only contain lowercase letters, numbers, and hyphens');
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
        <div className="mx-auto rounded-full bg-revital-green/10 p-4 mb-4 w-fit">
          <Server className="h-12 w-12 text-revital-green" />
        </div>
        <CardTitle className="text-2xl">Create Your E-commerce</CardTitle>
        <CardDescription>
          Set up your online store in just a few minutes. Choose a name and 
          unique identifier for your store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nom_instancia">Store Name</Label>
            <Input
              id="nom_instancia"
              placeholder="My Awesome Store"
              value={formData.nom_instancia}
              onChange={(e) => setFormData(prev => ({ ...prev, nom_instancia: e.target.value }))}
              disabled={createInstance.isPending}
            />
            <p className="text-xs text-muted-foreground">
              This is the display name for your store.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug_instancia">Store URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">revital.store/</span>
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
              Only lowercase letters, numbers, and hyphens. This will be your store&apos;s URL.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-revital-green hover:bg-revital-green/90 text-revital-black"
            disabled={createInstance.isPending}
          >
            {createInstance.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create my e-commerce
              </>
            )}
          </Button>
        </form>
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
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const createDomain = useCreateDomain();

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name');
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
        <h3 className="text-lg font-semibold">Domains</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowAddDomain(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {domains.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No custom domains configured yet.
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
                        {domain.tipo_dominio} • SSL {domain.ssl_habilitado ? 'enabled' : 'disabled'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.ssl_habilitado && (
                      <Shield className="h-4 w-4 text-green-500" />
                    )}
                    <Badge variant={domain.estado_dominio === 'activo' ? 'default' : 'secondary'}>
                      {domain.estado_dominio}
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
            <DialogTitle>Add Custom Domain</DialogTitle>
            <DialogDescription>
              Add a custom domain to your store. You&apos;ll need to configure DNS settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                placeholder="www.mystore.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDomain(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddDomain}
              disabled={createDomain.isPending}
            >
              {createDomain.isPending ? 'Adding...' : 'Add Domain'}
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
        <h3 className="text-lg font-semibold">Recent Deployments</h3>
      </div>

      {deployments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Rocket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No deployments yet.
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
                      {deployment.tipo_deploy}
                    </Badge>
                    <Badge 
                      variant={deployment.estado_deploy === 'completado' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {deployment.estado_deploy}
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
                View Store
              </a>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/instance/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Instance Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Instance Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {instance.frontend_url && (
              <div>
                <p className="text-sm text-muted-foreground">Store URL</p>
                <a 
                  href={instance.frontend_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-revital-green hover:underline flex items-center gap-1"
                >
                  {instance.frontend_url.replace(/^https?:\/\//, '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {instance.version_instancia && (
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-mono">{instance.version_instancia}</p>
              </div>
            )}
            {instance.region_deployment && (
              <div>
                <p className="text-sm text-muted-foreground">Region</p>
                <p>{instance.region_deployment}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Activated</p>
              <p>{formatDate(instance.fecha_activacion)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Deploy</p>
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
            Domains
          </TabsTrigger>
          <TabsTrigger value="deployments">
            <Rocket className="h-4 w-4 mr-2" />
            Deployments
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

// Main Instance Page
export default function InstancePage() {
  const { data: instances, isLoading, refetch } = useInstances();
  const instance = instances && instances.length > 0 ? instances[0] : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!instance) {
    return <CreateInstanceForm onSuccess={() => refetch()} />;
  }

  return <InstanceDetails instance={instance} />;
}
