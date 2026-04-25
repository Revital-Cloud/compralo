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
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState } from "react"
import { useToastActions } from "@/hooks/use-toast-actions"
import authService from "@/services/auth.service"
import type { ResetPasswordRequest } from "@/types"

/**
 * Formulario de solicitud de restablecimiento.
 *
 * Flujo:
 * - recibe email
 * - solicita enlace al backend
 * - muestra estado de éxito y guía de siguientes pasos
 */

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { showSuccess, showError } = useToastActions()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Soportar casos donde el navegador autocompleta el email sin disparar onChange
    const formData = new FormData(e.currentTarget)
    const rawEmail = (formData.get("email") as string | null) ?? email
    const emailValue = (rawEmail || "").trim()

    if (!emailValue) {
      showError("Error", "Por favor ingresa tu correo electrónico")
      return
    }

    // Sincronizar estado por si venía solo del autocomplete del navegador
    if (emailValue !== email) {
      setEmail(emailValue)
    }

    setIsLoading(true)
    
    try {
      const resetData: ResetPasswordRequest = { email: emailValue }
      console.log('Enviando solicitud de reset con:', resetData)
      const response = await authService.requestPasswordReset(resetData)
      console.log('Respuesta del servidor:', response)
      
      setIsSuccess(true)
      showSuccess("¡Enlace enviado!", "Revisa tu correo electrónico para restablecer tu contraseña")
    } catch (error: any) {
      console.error('Error completo al solicitar restablecimiento:', error)
      console.error('Detalles del error:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      })
      
      const errorMessage = error?.response?.data?.detail 
        || error?.response?.data?.message
        || error?.message
        || "Error al enviar el enlace de restablecimiento"
      
      showError("Error", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
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
            <CardTitle className="text-xl text-green-600 dark:text-green-400">
              ¡Enlace enviado!
            </CardTitle>
            <CardDescription>
              Hemos enviado un enlace de restablecimiento a <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm">
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
        <div className="text-muted-foreground text-center text-xs text-balance">
          <p>
            Si no recibes un correo en unos minutos, por favor revisa tu carpeta de spam
            o intenta nuevamente con otra dirección de correo.
          </p>
        </div>
      </div>
    )
  }

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
          <CardTitle className="text-xl">Restablecer tu contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar enlace de restablecimiento"
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
          Si no recibes un correo en unos minutos, por favor revisa tu carpeta de spam
          o intenta nuevamente con otra dirección de correo.
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordForm