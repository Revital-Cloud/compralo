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
import { Label } from "@/components/ui"
import { PasswordStrength } from "@/components/ui"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useToastActions } from "@/hooks/use-toast-actions"
import { useConfirmPasswordReset } from "@/hooks/use-auth"
import { useSearchParams, useRouter } from "next/navigation"
import type { ResetPasswordConfirm } from "@/types"

/**
 * Formulario de confirmación de restablecimiento.
 *
 * Flujo:
 * 1) lee token desde query param
 * 2) valida fortaleza y confirmación de contraseña
 * 3) confirma cambio en backend
 * 4) maneja estados de token usado/inválido/expirado
 */

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'none' | 'used' | 'invalid' | 'expired'>('none')
  
  const { showSuccess, showError } = useToastActions()
  const { mutateAsync: confirmPasswordReset, isPending } = useConfirmPasswordReset()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Obtener el token de la URL
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      showError("Error", "Token de restablecimiento no válido")
      router.push('/forgot-password')
    }
  }, [searchParams, showError, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      showError("Error", "Token de restablecimiento no válido")
      return
    }

    if (!password) {
      showError("Error", "Por favor ingresa tu nueva contraseña")
      return
    }

    if (password.length < 8) {
      showError("Error", "La contraseña debe tener al menos 8 caracteres")
      return
    }

    // Validar fortaleza de contraseña
    const hasLowerCase = /[a-z]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
    
    if (!hasLowerCase || !hasUpperCase || !hasNumbers || !hasSpecialChar) {
      showError("Error", "La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial")
      return
    }

    if (password !== confirmPassword) {
      showError("Error", "Las contraseñas no coinciden")
      return
    }

    try {
      const resetData: ResetPasswordConfirm = {
        token,
        new_password: password
      }
      
      await confirmPasswordReset(resetData)
      setIsSuccess(true)
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error)
      
      const data = error?.response?.data
      const errorMessage =
        data?.detail ||
        data?.message ||
        error?.message ||
        "Error al restablecer la contraseña"
      
      if (errorMessage.includes("ya fue utilizado")) {
        setErrorType('used')
        showError("Enlace Usado", "Este enlace de restablecimiento ya fue utilizado. Por favor, solicita uno nuevo.")
      } else if (errorMessage.includes("inválido") || errorMessage.includes("expirado")) {
        setErrorType('invalid')
        showError("Token Inválido", "El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita uno nuevo.")
      } else if (errorMessage.includes("no puede ser igual a la contraseña actual")) {
        // Error específico cuando intenta usar la misma contraseña
        setErrorType('none')
        showError("Contraseña inválida", "La nueva contraseña no puede ser igual a la contraseña actual")
      } else {
        setErrorType('none')
        showError("Error", errorMessage)
      }
    }
  }

  // Pantalla de error para token usado
  if (errorType === 'used') {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-start mb-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 cursor-pointer">
                  <ArrowLeft className="size-4" />
                  Volver al Login
                </Button>
              </Link>
            </div>
            <div className="flex justify-center mb-4">
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <CardTitle className="text-xl text-red-600 dark:text-red-400">
              Enlace Ya Utilizado
            </CardTitle>
            <CardDescription>
              Este enlace de restablecimiento ya fue utilizado. Por seguridad, cada enlace solo puede usarse una vez.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Si necesitas restablecer tu contraseña nuevamente, solicita un nuevo enlace.
              </p>
              <div className="flex gap-2">
                <Link href="/forgot-password" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Solicitar Nuevo Enlace
                  </Button>
                </Link>
                <Link href="/login" className="flex-1">
                  <Button className="w-full">
                    Ir al Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pantalla de error para token inválido/expirado
  if (errorType === 'invalid') {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-start mb-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 cursor-pointer">
                  <ArrowLeft className="size-4" />
                  Volver al Login
                </Button>
              </Link>
            </div>
            <div className="flex justify-center mb-4">
              <div className="size-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
            <CardTitle className="text-xl text-orange-600 dark:text-orange-400">
              Enlace Expirado
            </CardTitle>
            <CardDescription>
              Este enlace de restablecimiento ha expirado o no es válido. Los enlaces de restablecimiento tienen una validez de 1 hora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Solicita un nuevo enlace de restablecimiento para continuar.
              </p>
              <div className="flex gap-2">
                <Link href="/forgot-password" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Solicitar Nuevo Enlace
                  </Button>
                </Link>
                <Link href="/login" className="flex-1">
                  <Button className="w-full">
                    Ir al Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-start mb-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 cursor-pointer">
                  <ArrowLeft className="size-4" />
                  Volver al Login
                </Button>
              </Link>
            </div>
            <div className="flex justify-center mb-4">
              <CheckCircle className="size-16 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl text-green-600 dark:text-green-400">
              ¡Contraseña Restablecida!
            </CardTitle>
            <CardDescription>
              Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Link href="/login">
                <Button className="w-full">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-start mb-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 cursor-pointer">
                <ArrowLeft className="size-4" />
                Volver al Login
              </Button>
            </Link>
          </div>
          <CardTitle className="text-xl">Nueva Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para completar el restablecimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <PasswordStrength
                  value={password}
                  onChange={setPassword}
                  placeholder="Ingresa tu nueva contraseña"
                  disabled={isPending}
                  showToggle={true}
                  showStrength={true}
                  showCriteria={true}
                />
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <PasswordStrength
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirma tu nueva contraseña"
                  disabled={isPending}
                  showToggle={true}
                  showStrength={false}
                  showCriteria={false}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restableciendo...
                  </>
                ) : (
                  "Restablecer Contraseña"
                )}
              </Button>
              
              <div className="text-center text-sm">
                ¿Recordaste tu contraseña?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="text-muted-foreground text-center text-xs text-balance">
        <p>
          Tu contraseña debe tener al menos 8 caracteres e incluir letras mayúsculas, minúsculas, números y caracteres especiales.
        </p>
      </div>
    </div>
  )
}

export default ResetPasswordForm
