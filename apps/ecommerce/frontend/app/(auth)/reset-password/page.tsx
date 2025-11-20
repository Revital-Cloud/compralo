'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/forms';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Restablecer Contraseña
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ingresa tu nueva contraseña para completar el proceso
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}