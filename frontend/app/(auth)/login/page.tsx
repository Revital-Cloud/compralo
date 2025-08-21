'use client';

import { GalleryVerticalEnd } from 'lucide-react'
import React from 'react'
import { LoginForm } from '@/components/forms/login-form'
import { useLoginRedirect } from '@/hooks/use-role-redirect'
import { Loader2 } from 'lucide-react'

const LoginPage = () => {
  const { isLoading, isAuthenticated } = useLoginRedirect();

  // Si ya está autenticado, mostrar loader mientras redirige
  if (isAuthenticated) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Tienda Virtual
        </a>
        <LoginForm />
      </div>
    </div>
  )
}

export default LoginPage