'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Key,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

import { useChangePassword } from '@/hooks/use-auth';

export default function SecurityPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const localePrefix = `/${locale}`;
  const changePassword = useChangePassword();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error(t('settings.security.errors.fillAllFields'));
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error(t('settings.security.errors.minLength'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('settings.security.errors.passwordsDontMatch'));
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error(t('settings.security.errors.samePassword'));
      return;
    }

    changePassword.mutate({
      current_password: formData.currentPassword,
      new_password: formData.newPassword,
    }, {
      onSuccess: () => {
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.push(`${localePrefix}/settings`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('settings.security.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.security.subtitle')}
          </p>
        </div>
      </div>

      {/* Change Password Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('settings.security.changePassword')}
          </CardTitle>
          <CardDescription>
            {t('settings.security.changePasswordDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('settings.security.currentPassword')}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    currentPassword: e.target.value 
                  }))}
                  disabled={changePassword.isPending}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('settings.security.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    newPassword: e.target.value 
                  }))}
                  disabled={changePassword.isPending}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('settings.security.passwordHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('settings.security.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    confirmPassword: e.target.value 
                  }))}
                  disabled={changePassword.isPending}
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
            </div>

            <div className="pt-4">
              <Button 
                type="submit"
                disabled={changePassword.isPending}
                className="bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
              >
                {changePassword.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t('settings.security.updating')}
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    {t('settings.security.updatePassword')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('settings.security.securityTips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-synkro-green">•</span>
              {t('settings.security.tips.unique')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-synkro-green">•</span>
              {t('settings.security.tips.mix')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-synkro-green">•</span>
              {t('settings.security.tips.avoid')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-synkro-green">•</span>
              {t('settings.security.tips.change')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-synkro-green">•</span>
              {t('settings.security.tips.share')}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
