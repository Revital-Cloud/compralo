'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useRegister, useAuth } from '@/hooks/use-auth';
import { isAuthenticated } from '@/utils/apiWrapper';
import type { RegisterRequest, IdentificationType, CountryCode } from '@/types';

const ID_TYPE_KEYS: IdentificationType[] = ['NIT', 'EIN', 'RFC', 'CUIT', 'RUT', 'RUC', 'CNPJ', 'NIF', 'OTRO'];
const COUNTRY_CODES: CountryCode[] = ['CO', 'US', 'MX', 'AR', 'CL', 'PE', 'EC', 'PA', 'UY', 'BR', 'ES', 'OTRO'];

type PasswordStrengthKey = 'veryWeak' | 'weak' | 'medium' | 'strong' | 'veryStrong';

const PASSWORD_STRENGTH_ORDER: PasswordStrengthKey[] = [
  'veryWeak',
  'weak',
  'medium',
  'strong',
  'veryStrong',
];

const PASSWORD_STRENGTH_STYLES: Record<
  PasswordStrengthKey,
  { width: string; barClass: string; textClass: string }
> = {
  veryWeak: { width: '20%', barClass: 'bg-red-500', textClass: 'text-red-500' },
  weak: { width: '40%', barClass: 'bg-orange-500', textClass: 'text-orange-500' },
  medium: { width: '60%', barClass: 'bg-yellow-400', textClass: 'text-yellow-500' },
  strong: { width: '80%', barClass: 'bg-emerald-500', textClass: 'text-emerald-500' },
  veryStrong: { width: '100%', barClass: 'bg-emerald-600', textClass: 'text-emerald-600' },
};

const calculatePasswordStrength = (password: string): PasswordStrengthKey | null => {
  if (!password) return null;

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const index = Math.min(PASSWORD_STRENGTH_ORDER.length - 1, score);
  return PASSWORD_STRENGTH_ORDER[index];
};

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('common');
  const { user, isLoading: authLoading } = useAuth();
  const registerMutation = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState<
    RegisterRequest & { confirmPassword: string }
  >({
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

  const passwordStrengthKey = calculatePasswordStrength(formData.password);
  const passwordStrengthConfig = passwordStrengthKey
    ? PASSWORD_STRENGTH_STYLES[passwordStrengthKey]
    : null;

  const showPasswordMismatchHint =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated() && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom_empresa.trim()) {
      newErrors.nom_empresa = t('errors.companyRequired');
    }

    if (!formData.identificacion_fiscal.trim()) {
      newErrors.identificacion_fiscal = t('errors.taxIdRequired');
    } else if (formData.identificacion_fiscal.length < 5) {
      newErrors.identificacion_fiscal = t('errors.taxIdMinLength');
    }

    if (!formData.nom_contacto_principal.trim()) {
      newErrors.nom_contacto_principal = t('errors.contactNameRequired');
    }

    if (!formData.email_contacto_principal.trim()) {
      newErrors.email_contacto_principal = t('errors.emailRequired');
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contacto_principal)
    ) {
      newErrors.email_contacto_principal = t('errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('errors.passwordMinLength');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordsDontMatch');
    }

    if (!acceptTerms) {
      newErrors.acceptTerms = t('errors.termsRequired');
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-revital-green" />
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
            {t('backToHome')}
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
                alt="Revital Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
              <span className="text-2xl font-bold text-revital-green">Revital</span>
            </div>
          </Link>
          <CardTitle className="text-xl">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {t('companyInfo')}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom_empresa">
                    {t('companyName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nom_empresa"
                    placeholder={t('companyNamePlaceholder')}
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
                    {t('taxId')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="identificacion_fiscal"
                    placeholder={t('taxIdPlaceholder')}
                    value={formData.identificacion_fiscal}
                    onChange={(e) =>
                      updateField('identificacion_fiscal', e.target.value)
                    }
                    disabled={registerMutation.isPending}
                    className={errors.identificacion_fiscal ? 'border-red-500' : ''}
                  />
                  {errors.identificacion_fiscal && (
                    <p className="text-xs text-red-500">
                      {errors.identificacion_fiscal}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_identificacion">{t('idType')}</Label>
                  <Select
                    value={formData.tipo_identificacion}
                    onValueChange={(value) => updateField('tipo_identificacion', value)}
                    disabled={registerMutation.isPending}
                  >
                    <SelectTrigger id="tipo_identificacion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_TYPE_KEYS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`idTypes.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">{t('country')}</Label>
                  <Select
                    value={formData.pais}
                    onValueChange={(value) => updateField('pais', value)}
                    disabled={registerMutation.isPending}
                  >
                    <SelectTrigger id="pais">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {t(`countries.${code}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ciudad">{t('city')}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ciudad"
                      placeholder={t('cityPlaceholder')}
                      className="pl-10"
                      value={formData.ciudad}
                      onChange={(e) => updateField('ciudad', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                {t('contactInfo')}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom_contacto_principal">
                    {t('contactName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nom_contacto_principal"
                    placeholder={t('contactNamePlaceholder')}
                    value={formData.nom_contacto_principal}
                    onChange={(e) =>
                      updateField('nom_contacto_principal', e.target.value)
                    }
                    disabled={registerMutation.isPending}
                    className={errors.nom_contacto_principal ? 'border-red-500' : ''}
                  />
                  {errors.nom_contacto_principal && (
                    <p className="text-xs text-red-500">
                      {errors.nom_contacto_principal}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono_contacto">{t('phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono_contacto"
                      type="tel"
                      placeholder={t('phonePlaceholder')}
                      className="pl-10"
                      value={formData.telefono_contacto}
                      onChange={(e) => updateField('telefono_contacto', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email_contacto_principal">
                    {t('email')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email_contacto_principal"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      className={`pl-10 ${
                        errors.email_contacto_principal ? 'border-red-500' : ''
                      }`}
                      value={formData.email_contacto_principal}
                      onChange={(e) =>
                        updateField('email_contacto_principal', e.target.value)
                      }
                      disabled={registerMutation.isPending}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email_contacto_principal && (
                    <p className="text-xs text-red-500">
                      {errors.email_contacto_principal}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lock className="h-4 w-4" />
                {t('accountSecurity')}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {t('password')} <span className="text-red-500">*</span>
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
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  <p className="text-xs text-muted-foreground">{t('passwordMinHint')}</p>
                  {passwordStrengthConfig && passwordStrengthKey && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{t('passwordStrengthLabel')}</span>
                        <span className={`font-medium ${passwordStrengthConfig.textClass}`}>
                          {t(`passwordStrength.${passwordStrengthKey}`)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrengthConfig.barClass}`}
                          style={{ width: passwordStrengthConfig.width }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t('confirmPassword')} <span className="text-red-500">*</span>
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
                  {showPasswordMismatchHint && !errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {t('errors.passwordsDontMatch')}
                    </p>
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
                        setErrors((prev) => ({ ...prev, acceptTerms: '' }));
                      }
                    }}
                    disabled={registerMutation.isPending}
                    className="sr-only peer"
                  />
                  <div
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                      acceptTerms
                        ? 'bg-revital-green border-revital-green'
                        : errors.acceptTerms
                          ? 'border-red-500'
                          : 'border-muted-foreground'
                    }`}
                  >
                    {acceptTerms && <Check className="h-3 w-3 text-revital-black" />}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {t('termsPrefix')}{' '}
                  <Link href="/terms" className="text-revital-green hover:underline">
                    {t('termsLink')}
                  </Link>{' '}
                  {t('and')}{' '}
                  <Link href="/privacy" className="text-revital-green hover:underline">
                    {t('privacyLink')}
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
              className="w-full bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium h-12"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submitButton')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-revital-green hover:underline font-medium">
              {t('loginLink')}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Revital. {tCommon('rightsReserved')}
      </p>
    </div>
  );
}
