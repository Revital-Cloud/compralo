'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ArrowLeft, 
  Building2, 
  User, 
  Mail,
  Phone,
  MapPin,
  Lock,
  Check,
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
} from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useRegister, useAuth } from '@/hooks/use-auth';
import { isAuthenticated } from '@/utils/apiWrapper';
import type { RegisterRequest, IdentificationType, CountryCode } from '@/types';

const IDENTIFICATION_TYPES: { value: IdentificationType; label: string }[] = [
  { value: 'NIT', label: 'NIT (Colombia)' },
  { value: 'EIN', label: 'EIN (USA)' },
  { value: 'RFC', label: 'RFC (Mexico)' },
  { value: 'CUIT', label: 'CUIT (Argentina)' },
  { value: 'RUT', label: 'RUT (Chile)' },
  { value: 'RUC', label: 'RUC (Peru/Ecuador)' },
  { value: 'CNPJ', label: 'CNPJ (Brazil)' },
  { value: 'NIF', label: 'NIF (Spain)' },
  { value: 'OTRO', label: 'Other' },
];

const COUNTRIES: { value: CountryCode; label: string }[] = [
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

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const registerMutation = useRegister();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState<RegisterRequest & { confirmPassword: string }>({
    nom_empresa: '',
    identificacion_fiscal: '',
    tipo_identificacion: 'NIT',
    pais: 'CO',
    ciudad: '',
    nom_contacto_principal: '',
    email_contacto_principal: '',
    telefono_contacto: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated() && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom_empresa.trim()) {
      newErrors.nom_empresa = 'Company name is required';
    }

    if (!formData.identificacion_fiscal.trim()) {
      newErrors.identificacion_fiscal = 'Tax ID is required';
    } else if (formData.identificacion_fiscal.length < 5) {
      newErrors.identificacion_fiscal = 'Tax ID must be at least 5 characters';
    }

    if (!formData.nom_contacto_principal.trim()) {
      newErrors.nom_contacto_principal = 'Contact name is required';
    }

    if (!formData.email_contacto_principal.trim()) {
      newErrors.email_contacto_principal = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contacto_principal)) {
      newErrors.email_contacto_principal = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Remove confirmPassword before sending
    const { confirmPassword, ...registerData } = formData;
    registerMutation.mutate(registerData);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-synkro-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12 bg-background">
      {/* Back to landing */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Register Card */}
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <div className="flex items-center justify-center gap-3">
              <Image
                src="/logo.webp"
                alt="Synkro Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
              <span className="text-2xl font-bold text-synkro-green">Synkro</span>
            </div>
          </Link>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Start your e-commerce journey with Synkro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Company Information
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom_empresa">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nom_empresa"
                    placeholder="Acme Inc."
                    value={formData.nom_empresa}
                    onChange={(e) => updateField('nom_empresa', e.target.value)}
                    disabled={registerMutation.isPending}
                    className={errors.nom_empresa ? 'border-red-500' : ''}
                  />
                  {errors.nom_empresa && (
                    <p className="text-xs text-red-500">{errors.nom_empresa}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identificacion_fiscal">
                    Tax ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="identificacion_fiscal"
                    placeholder="900123456-1"
                    value={formData.identificacion_fiscal}
                    onChange={(e) => updateField('identificacion_fiscal', e.target.value)}
                    disabled={registerMutation.isPending}
                    className={errors.identificacion_fiscal ? 'border-red-500' : ''}
                  />
                  {errors.identificacion_fiscal && (
                    <p className="text-xs text-red-500">{errors.identificacion_fiscal}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_identificacion">ID Type</Label>
                  <Select
                    value={formData.tipo_identificacion}
                    onValueChange={(value) => updateField('tipo_identificacion', value)}
                    disabled={registerMutation.isPending}
                  >
                    <SelectTrigger id="tipo_identificacion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IDENTIFICATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">Country</Label>
                  <Select
                    value={formData.pais}
                    onValueChange={(value) => updateField('pais', value)}
                    disabled={registerMutation.isPending}
                  >
                    <SelectTrigger id="pais">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ciudad">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ciudad"
                      placeholder="Bogotá"
                      className="pl-10"
                      value={formData.ciudad}
                      onChange={(e) => updateField('ciudad', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Contact Information
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom_contacto_principal">
                    Contact Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nom_contacto_principal"
                    placeholder="John Doe"
                    value={formData.nom_contacto_principal}
                    onChange={(e) => updateField('nom_contacto_principal', e.target.value)}
                    disabled={registerMutation.isPending}
                    className={errors.nom_contacto_principal ? 'border-red-500' : ''}
                  />
                  {errors.nom_contacto_principal && (
                    <p className="text-xs text-red-500">{errors.nom_contacto_principal}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono_contacto">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono_contacto"
                      type="tel"
                      placeholder="+57 300 123 4567"
                      className="pl-10"
                      value={formData.telefono_contacto}
                      onChange={(e) => updateField('telefono_contacto', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email_contacto_principal">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email_contacto_principal"
                      type="email"
                      placeholder="john@company.com"
                      className={`pl-10 ${errors.email_contacto_principal ? 'border-red-500' : ''}`}
                      value={formData.email_contacto_principal}
                      onChange={(e) => updateField('email_contacto_principal', e.target.value)}
                      disabled={registerMutation.isPending}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email_contacto_principal && (
                    <p className="text-xs text-red-500">{errors.email_contacto_principal}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lock className="h-4 w-4" />
                Account Security
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      disabled={registerMutation.isPending}
                      autoComplete="new-password"
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      disabled={registerMutation.isPending}
                      autoComplete="new-password"
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (errors.acceptTerms) {
                        setErrors(prev => ({ ...prev, acceptTerms: '' }));
                      }
                    }}
                    disabled={registerMutation.isPending}
                    className="sr-only peer"
                  />
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    acceptTerms 
                      ? 'bg-synkro-green border-synkro-green' 
                      : errors.acceptTerms 
                        ? 'border-red-500' 
                        : 'border-muted-foreground'
                  }`}>
                    {acceptTerms && <Check className="h-3 w-3 text-synkro-black" />}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  I agree to the{' '}
                  <Link href="/terms" className="text-synkro-green hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-synkro-green hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-red-500 ml-8">{errors.acceptTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-synkro-green hover:bg-synkro-green/90 text-synkro-black font-medium h-12"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-synkro-green hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Synkro. All rights reserved.
      </p>
    </div>
  );
}
