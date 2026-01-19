'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

import { useInstances, useUpdateInstance } from '@/hooks/use-instances';
import type { InstanceUpdate, RegionDeployment } from '@/types';

const regions: { value: RegionDeployment; label: string }[] = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
];

export default function InstanceSettingsPage() {
  const router = useRouter();
  const { data: instances, isLoading } = useInstances();
  const updateInstance = useUpdateInstance();
  
  const instance = instances && instances.length > 0 ? instances[0] : null;

  const [formData, setFormData] = useState<InstanceUpdate>({
    nom_instancia: '',
    subdominio: '',
    dominio_personalizado: '',
    version_instancia: '',
    backend_url: '',
    frontend_url: '',
    region_deployment: 'us-east-1',
  });

  // Update form when instance data loads
  useEffect(() => {
    if (instance) {
      setFormData({
        nom_instancia: instance.nom_instancia || '',
        subdominio: instance.subdominio || '',
        dominio_personalizado: instance.dominio_personalizado || '',
        version_instancia: instance.version_instancia || '',
        backend_url: instance.backend_url || '',
        frontend_url: instance.frontend_url || '',
        region_deployment: (instance.region_deployment as RegionDeployment) || 'us-east-1',
      });
    }
  }, [instance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instance) return;

    updateInstance.mutate({
      idInstance: instance.id_instancia,
      data: formData,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">No instance found</p>
        <Button onClick={() => router.push('/instance')}>
          Go to Instance
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.push('/instance')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Instance Settings</h1>
          <p className="text-muted-foreground">
            Configure your e-commerce instance
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Update your instance&apos;s basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nom_instancia">Store Name</Label>
                <Input
                  id="nom_instancia"
                  value={formData.nom_instancia}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    nom_instancia: e.target.value 
                  }))}
                  disabled={updateInstance.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdominio">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdominio"
                    value={formData.subdominio || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      subdominio: e.target.value 
                    }))}
                    placeholder="mystore"
                    disabled={updateInstance.isPending}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    .synkro.store
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dominio_personalizado">Custom Domain</Label>
                <Input
                  id="dominio_personalizado"
                  value={formData.dominio_personalizado || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dominio_personalizado: e.target.value 
                  }))}
                  placeholder="www.mystore.com"
                  disabled={updateInstance.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Configure DNS to point to your store
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Deployment Region</Label>
                <Select
                  value={formData.region_deployment}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    region_deployment: value as RegionDeployment 
                  }))}
                  disabled={updateInstance.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/instance')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateInstance.isPending}
                className="bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
              >
                {updateInstance.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
