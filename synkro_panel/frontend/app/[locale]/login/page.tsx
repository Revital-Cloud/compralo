'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, RefreshCw, ArrowLeft } from 'lucide-react';
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
import { useTranslations } from 'next-intl';

import { useLogin, useAuth } from '@/hooks/use-auth';
import { isAuthenticated } from '@/utils/apiWrapper';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const loginMutation = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated() && user) {
      if (user.user_type === 'cliente') {
        router.push(redirectTo);
      } else {
        // Admin users go to admin panel
        router.push('/admin');
      }
    }
  }, [user, authLoading, router, redirectTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return;
    }

    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Back to landing */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('auth.login.backToHome')}
          </Link>
        </Button>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md">
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
          <CardTitle className="text-xl">{t('auth.login.title')}</CardTitle>
          <CardDescription>{t('auth.login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.login.emailPlaceholder')}
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                disabled={loginMutation.isPending}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.login.passwordLabel')}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-synkro-green hover:underline"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  disabled={loginMutation.isPending}
                  autoComplete="current-password"
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
            </div>

            <Button
              type="submit"
              className="w-full bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.login.submitting')}
                </>
              ) : (
                t('auth.login.submitButton')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <Link
              href="/register"
              className="text-synkro-green hover:underline font-medium"
            >
              {t('auth.login.registerLink')}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </p>
    </div>
  );
}

