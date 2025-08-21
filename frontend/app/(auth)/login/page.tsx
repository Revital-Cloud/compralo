'use client';

import { ShoppingCart } from 'lucide-react'
import React from 'react'
import { LoginForm } from '@/components/forms/login-form'
import { useLoginRedirect } from '@/hooks/use-role-redirect'
import { Loader2 } from 'lucide-react'

const LoginPage = () => {
  const { isLoading, isAuthenticated } = useLoginRedirect();

  // Si ya está autenticado, mostrar loader mientras redirige
  if (isAuthenticated) {
    return (
      <div className="bg-[#F5F5F5] flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF0000]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5] flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Logo de Compralo */}
        <div className="flex items-center gap-3 self-center">
          <div className="w-10 h-10 bg-[#FF0000] rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#FF0000]">Compralo</span>
        </div>
        {/* Formulario de login */}
        <LoginForm />
      </div>
    </div>
  )
}

export default LoginPage