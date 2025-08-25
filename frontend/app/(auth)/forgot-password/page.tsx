import { ForgotPasswordForm } from '@/components/forms/forgot-password'
import { GalleryVerticalEnd } from 'lucide-react'
import React from 'react'

const forgotPasswordPage = () => {
  return (
    <div className="bg-muted dark:bg-gray-950 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 transition-colors duration-300">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium text-foreground hover:text-primary transition-colors duration-300">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Tienda Virtual
        </a>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}

export default forgotPasswordPage