'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GalleryVerticalEnd, Loader2 } from 'lucide-react'
import React from 'react'
import { RegisterForm } from '@/components/forms/register-form'
import { useAuth } from '@/hooks/use-auth'

const RegisterPage = () => {
  const { isAuthenticated, isLoadingUser, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si está cargando, no hacer nada
    if (isLoadingUser) return;
    
    // Si ya está autenticado, redirigir según el rol
    if (isAuthenticated && user) {
      const userRole = Number(user.id_rol);
      const redirectUrl = userRole === 1 ? '/admin' : '/';
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, isLoadingUser, user, router]);

  // Si está cargando o ya está autenticado, mostrar loader
  if (isLoadingUser || isAuthenticated) {
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
        <RegisterForm />
      </div>
    </div>
  )
}

export default RegisterPage