'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
} from '@/components/ui';
import { useRequestPasswordReset } from '@/hooks/use-auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const resetMutation = useRequestPasswordReset();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      return;
    }
    resetMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Back to login */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" asChild>
          <Link href="/login">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio de sesión
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Restablecer contraseña</CardTitle>
          <CardDescription>
            Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para
            restablecer tu contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resetMutation.isPending}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-synkro-green hover:bg-synkro-green/90 text-synkro-black"
              disabled={resetMutation.isPending || !email.trim()}
            >
              {resetMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando enlace...
                </>
              ) : (
                'Enviar enlace de restablecimiento'
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            Si existe una cuenta con ese correo, recibirás un email para
            restablecer tu contraseña en unos minutos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

