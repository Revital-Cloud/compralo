'use client';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import type { LoginRequest } from "@/types"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Script from "next/script"
import {
  getLockoutState,
  formatLockoutCountdown,
  LOGIN_ATTEMPT_CONFIG,
  loginAttemptKey,
  remainingLockoutSeconds,
  resolveLoginLockoutKey,
  getActiveLoginLockoutStorageKey,
  emailFromLoginAttemptKey,
} from "@/lib/auth-attempt-limiter"
import { useAuthLockout } from "@/hooks/use-auth-lockout"

/**
 * Mapa del formulario de login.
 *
 * Flujo:
 * 1) Valida email/contraseña con Zod + React Hook Form.
 * 2) Aplica protección anti abuso (lockout por intentos fallidos).
 * 3) Integra Turnstile cuando está configurado por entorno.
 * 4) Envía credenciales a `useAuth().login`.
 */

// Schema de validación con Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Debe ser un email válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  // Hook de autenticación
  const { login, isLoggingIn } = useAuth();
  
  // Detectar si hay un parámetro redirect en la URL
  const redirectTo = searchParams.get('redirect');

  // Configurar React Hook Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailWatched = useWatch({ control, name: "email", defaultValue: "" });
  const loginLockKey = resolveLoginLockoutKey(emailWatched);
  const { isLocked, remainingSeconds } = useAuthLockout(
    loginLockKey,
    LOGIN_ATTEMPT_CONFIG,
  );

  // Tras F5, el email vuelve vacío pero el bloqueo sigue en sessionStorage: restaurar correo y UI.
  useEffect(() => {
    const active = getActiveLoginLockoutStorageKey();
    if (!active) return;
    const em = emailFromLoginAttemptKey(active);
    if (!em) return;
    if (!getValues("email")?.trim()) {
      setValue("email", em, { shouldValidate: false });
    }
    // Solo al montar: evita pisar si el usuario borra el correo a propósito en la misma visita.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restaurar una vez tras recarga
  }, []);

  // Manejar envío del formulario
  const onSubmit = (data: LoginFormData) => {
    // Doble verificación de bloqueo antes de golpear backend.
    const key = loginAttemptKey(data.email);
    const lock = getLockoutState(key);
    if (lock.remainingMs > 0) {
      toast.error(
        `Demasiados intentos fallidos. Espera ${formatLockoutCountdown(
          remainingLockoutSeconds({ remainingMs: lock.remainingMs }),
        )} para volver a intentarlo.`,
      );
      return;
    }
    const payload: LoginRequest = {
      email: data.email,
      password: data.password,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    };
    login(payload);
  };

  const formDisabled = isLoggingIn || isLocked;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const shouldUseTurnstile = Boolean(turnstileSiteKey);

  useEffect(() => {
    if (!shouldUseTurnstile) return;

    (window as any).__revitalTurnstileOnSuccess = (token: string) => setTurnstileToken(token);
    (window as any).__revitalTurnstileOnExpired = () => setTurnstileToken(null);
    (window as any).__revitalTurnstileOnError = () => setTurnstileToken(null);

    return () => {
      try {
        delete (window as any).__revitalTurnstileOnSuccess;
        delete (window as any).__revitalTurnstileOnExpired;
        delete (window as any).__revitalTurnstileOnError;
      } catch {
        // ignore
      }
    };
  }, [shouldUseTurnstile]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
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
          <CardTitle className="text-xl">Bienvenido de nuevo</CardTitle>
          <CardDescription>
            Inicia sesión con tu cuenta para acceder a tu tienda
            {redirectTo && (
              <span className="block mt-2 text-sm text-blue-600 dark:text-blue-400">
                Serás redirigido a {redirectTo} después del login
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              {isLocked && (
                <p
                  className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  Demasiados intentos fallidos con este correo. Podrás volver a intentarlo en{" "}
                  {formatLockoutCountdown(remainingSeconds)}.
                </p>
              )}
              {/* 
              TODO: Implementar OAuth con Apple y Google más adelante
              <div className="flex flex-col gap-4">
                <Button variant="outline" className="w-full" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Iniciar sesión con Apple
                </Button>
                <Button variant="outline" className="w-full" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Iniciar sesión con Google
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  O continúa con
                </span>
              </div>
              */}
              
              <div className="grid gap-6">
                {/* Campo Email */}
                <div className="grid gap-3">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    {...register("email")}
                    className={errors.email ? "border-red-500" : ""}
                    disabled={formDisabled}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Campo Contraseña */}
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link
                      href="/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      {...register("password")}
                      className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                      disabled={formDisabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={formDisabled}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Cloudflare Turnstile (managed) */}
                {shouldUseTurnstile && (
                  <div className="grid gap-2 justify-items-center">
                    <Script
                      src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                      strategy="afterInteractive"
                    />
                    <div
                      className="cf-turnstile"
                      data-sitekey={turnstileSiteKey}
                      data-callback="__revitalTurnstileOnSuccess"
                      data-expired-callback="__revitalTurnstileOnExpired"
                      data-error-callback="__revitalTurnstileOnError"
                    />
                    {!turnstileToken && (
                      <p className="text-xs text-muted-foreground text-center">
                        Completa la verificación para poder iniciar sesión.
                      </p>
                    )}
                  </div>
                )}

                {/* Botón Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={formDisabled || (shouldUseTurnstile && !turnstileToken)}
                  onClick={() => {
                    if (shouldUseTurnstile && !turnstileToken && !formDisabled) {
                      toast.error("Completa el captcha para continuar.");
                    }
                  }}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar sesión"
                  )}
                </Button>
              </div>

              {/* Enlace a registro */}
              <div className="text-center text-sm">
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className="underline underline-offset-4">
                  Regístrate
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Términos y condiciones */}
      <div className="text-muted-foreground text-center text-xs text-balance">
        Al hacer clic en continuar, aceptas nuestros{" "}
        <Link href="/terminos" className="underline underline-offset-4 hover:text-primary">
          Términos de Servicio
        </Link>{" "}
        y{" "}
        <Link href="/privacidad" className="underline underline-offset-4 hover:text-primary">
          Política de Privacidad
        </Link>
        .
      </div>
    </div>
  );
}