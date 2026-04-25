'use client';

import { Suspense } from 'react';
import { VerifyEmailForm } from '@/components/forms/verify-email-form';

/**
 * Página de verificación de email (`/verify-email`).
 *
 * Renderiza `VerifyEmailForm` dentro de `Suspense` porque consume search params.
 */

export default function VerifyEmailPage() {
  return (
    <div className="bg-[#F5F5F5] dark:bg-gray-950 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 transition-colors duration-300">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Logo Compralo */}
        <div className="flex items-center gap-3 self-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg">
                <circle className="fill-[#ec2538]" cx="280.42" cy="568.76" r="43.83" />
                <circle className="fill-[#ec2538]" cx="495.94" cy="568.76" r="43.83" />
                <path
                  className="fill-[#ec2538]"
                  d="M53.48,164.04h82.2c3.44,0,6.42,2.37,7.2,5.73l67.48,292.67c4.66,20.22,22.67,34.55,43.42,34.55h267.95c34.64,0,64.96-23.25,73.96-56.7l57.12-212.33c4.52-16.79-8.13-33.28-25.51-33.28h-61.44c4.92,71.77-21.63,132.81-63.82,188.53,19.19,12.32,33.63,26.23,32.64,45.31,1.55,34.12-48.73,38.39-108.03,37.47h-119.7c-17.42,0-31.54-14.12-31.54-31.54v-145.6c0-22.14,23.66-36.25,43.14-25.72l27.7,14.97c23.19-21.34,40.1-48.75,49.78-83.14h-190.56c-3.24,0-6.04-2.25-6.75-5.41l-8.66-38.78c-4.94-22.13-24.58-37.87-47.26-37.87H53.47c-5.82,0-11.59,1.55-16.4,4.82-7.04,4.79-10.7,11.74-10.71,21.02-.71,10.34,3.81,17.17,11.9,21.61,4.64,2.55,9.93,3.69,15.22,3.69Z"
                />
                <path
                  className="fill-[#fec806]"
                  d="M441.83,75.06c-4.32,118.31-38.28,185.28-84.47,231.11-3.22,3.2-8.23,3.71-12.07,1.3l-35.57-22.4c-4.62-2.91-10.64.41-10.64,5.87v140.38c0,5.26,4.25,9.53,9.51,9.56,78.36.44,153.52.47,192.25-4.16,9.85-1.18,13.22-13.75,5.29-19.7l-35.17-26.37c-3.1-2.33-3.57-6.8-1.02-9.72,103.04-118.15,93.62-227.41-15.41-311.86-5.07-3.93-12.48-.42-12.71,5.99Z"
                />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#ec2538] dark:text-red-500 transition-colors duration-300">
              Compralo
            </span>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          }
        >
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
