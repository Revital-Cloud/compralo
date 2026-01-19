'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
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
  Separator,
} from "@/components/ui";

import { useMyProfile, useUpdateMyProfile } from '@/hooks/use-clients';
import type { ClientUpdate } from '@/types';

const countries = [
  { value: 'CO', label: 'Colombia' },
  { value: 'US', label: 'United States' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'PE', label: 'Peru' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'PA', label: 'Panama' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'BR', label: 'Brazil' },
  { value: 'ES', label: 'Spain' },
  { value: 'OTRO', label: 'Other' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateMyProfile();

  const [formData, setFormData] = useState<ClientUpdate>({
    nom_empresa: '',
    email_contacto: '',
    telefono_contacto: '',
    direccion_empresa: '',
    ciudad: '',
    pais: 'CO',
    nom_contacto_principal: '',
    email_contacto_principal: '',
    telefono_contacto_principal: '',
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      setFormData({
        nom_empresa: profile.nom_empresa || '',
        email_contacto: profile.email_contacto || '',
        telefono_contacto: profile.telefono_contacto || '',
        direccion_empresa: profile.direccion_empresa || '',
        ciudad: profile.ciudad || '',
        pais: (profile.pais as any) || 'CO',
        nom_contacto_principal: profile.nom_contacto_principal || '',
        email_contacto_principal: profile.email_contacto_principal || '',
        telefono_contacto_principal: profile.telefono_contacto_principal || '',
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleInputChange = (field: keyof ClientUpdate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
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
          onClick={() => router.push('/settings')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Company Profile</h1>
          <p className="text-muted-foreground">
            Update your company and contact information
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Company Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Your business details and registration information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom_empresa">Company Name</Label>
                <Input
                  id="nom_empresa"
                  value={formData.nom_empresa}
                  onChange={(e) => handleInputChange('nom_empresa', e.target.value)}
                  disabled={updateProfile.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_contacto">Company Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email_contacto"
                    type="email"
                    className="pl-10"
                    value={formData.email_contacto}
                    onChange={(e) => handleInputChange('email_contacto', e.target.value)}
                    disabled={updateProfile.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono_contacto">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefono_contacto"
                    className="pl-10"
                    value={formData.telefono_contacto || ''}
                    onChange={(e) => handleInputChange('telefono_contacto', e.target.value)}
                    disabled={updateProfile.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pais">Country</Label>
                <Select
                  value={formData.pais as string}
                  onValueChange={(value) => handleInputChange('pais', value)}
                  disabled={updateProfile.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ciudad"
                    className="pl-10"
                    value={formData.ciudad || ''}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    disabled={updateProfile.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion_empresa">Address</Label>
                <Input
                  id="direccion_empresa"
                  value={formData.direccion_empresa || ''}
                  onChange={(e) => handleInputChange('direccion_empresa', e.target.value)}
                  disabled={updateProfile.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Primary Contact
            </CardTitle>
            <CardDescription>
              The main person we should contact about your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom_contacto_principal">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nom_contacto_principal"
                    className="pl-10"
                    value={formData.nom_contacto_principal}
                    onChange={(e) => handleInputChange('nom_contacto_principal', e.target.value)}
                    disabled={updateProfile.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_contacto_principal">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email_contacto_principal"
                    type="email"
                    className="pl-10"
                    value={formData.email_contacto_principal}
                    onChange={(e) => handleInputChange('email_contacto_principal', e.target.value)}
                    disabled={updateProfile.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono_contacto_principal">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefono_contacto_principal"
                    className="pl-10"
                    value={formData.telefono_contacto_principal || ''}
                    onChange={(e) => handleInputChange('telefono_contacto_principal', e.target.value)}
                    disabled={updateProfile.isPending}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push('/settings')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={updateProfile.isPending}
            className="bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
          >
            {updateProfile.isPending ? (
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
      </form>
    </div>
  );
}
