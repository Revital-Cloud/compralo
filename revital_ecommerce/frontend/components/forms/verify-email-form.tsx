'use client';

import { Button } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { InputOTP, InputOTPGroup, InputOTPSlot, Label } from '@/components/ui';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToastActions } from '@/hooks/use-toast-actions';
import authService from '@/services/auth.service';
import type { VerifyEmailOtpRequest } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Formulario OTP de verificación de email.
 *
 * Flujo:
 * - Lee `email` desde query string.
 * - Envía `email+code` a `verifyEmailOtp`.
 * - Permite reenvío de código y redirige al home al confirmar.
 */

export function VerifyEmailForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [code, setCode] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { showSuccess, showError } = useToastActions();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      showError('Error', 'Falta el correo en la URL. Revisa el enlace del email.');
    }
  }, [searchParams, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showError('Error', 'No se encontró el correo. Usa el enlace del email.');
      return;
    }
    const trimmedCode = code.replace(/\D/g, '').slice(0, 6);
    if (trimmedCode.length !== 6) {
      showError('Error', 'Ingresa el código de 6 dígitos que te enviamos por correo.');
      return;
    }
    try {
      setIsPending(true);
      const data: VerifyEmailOtpRequest = { email, code: trimmedCode };
      await authService.verifyEmailOtp(data);
      setIsSuccess(true);
      showSuccess('Cuenta verificada', 'Ya puedes usar tu cuenta. Redirigiendo...');
      setTimeout(() => router.push('/'), 1500);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string }; status?: number } };
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : 'Código inválido o expirado. Revisa el correo o regístrate de nuevo.';
      showError('Error al verificar', msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showError('Error', 'No se encontró el correo. Usa el enlace del email.');
      return;
    }
    try {
      setIsResending(true);
      await authService.resendEmailOtp(email);
      showSuccess('Código reenviado', 'Te enviamos un nuevo código de verificación. Revisa tu bandeja de entrada o spam.');
    } catch {
      showError('Error', 'No pudimos reenviar el código. Inténtalo de nuevo más tarde.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email && !searchParams.get('email')) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Verificar correo</CardTitle>
            <CardDescription>
              No se encontró el correo. Usa el enlace que te enviamos por email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Ir al inicio de sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-start mb-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 cursor-pointer">
                  <ArrowLeft className="size-4" />
                  Volver
                </Button>
              </Link>
            </div>
            <div className="flex justify-center mb-4">
              <CheckCircle className="size-16 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl text-green-600 dark:text-green-400">
              ¡Correo verificado!
            </CardTitle>
            <CardDescription>
              Tu cuenta ya está activa. Serás redirigido al inicio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-start mb-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 cursor-pointer">
                <ArrowLeft className="size-4" />
                Volver
              </Button>
            </Link>
          </div>
          <CardTitle className="text-xl">Verificar tu correo</CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos que te enviamos a{' '}
            {email ? <strong>{email}</strong> : 'tu correo'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="code">
                Código
              </Label>
              <div className="flex justify-center">
                <InputOTP
                  id="code"
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={code}
                  onChange={setCode}
                  disabled={isPending}
                >
                  <InputOTPGroup className="gap-1 sm:gap-2">
                    <InputOTPSlot index={0} className="h-10 w-10 sm:h-12 sm:w-12 text-base" />
                    <InputOTPSlot index={1} className="h-10 w-10 sm:h-12 sm:w-12 text-base" />
                    <InputOTPSlot index={2} className="h-10 w-10 sm:h-12 sm:w-12 text-base" />
                    <InputOTPSlot index={3} className="h-10 w-10 sm:h-12 sm:w-12 text-base" />
                    <InputOTPSlot index={4} className="h-10 w-10 sm:h-12 sm:w-12 text-base" />
                    <InputOTPSlot index={5} className="h-10 w-10 sm:h-12 sm:w-12 text-base" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending || code.replace(/\D/g, '').length !== 6}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar y continuar'
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>
                ¿No recibiste el código? Revisa tu carpeta de spam.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mx-auto"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reenviando código...
                  </>
                ) : (
                  'Reenviar código'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
