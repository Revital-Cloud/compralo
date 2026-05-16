'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function ShopAuthRedirect({ children }: { children: React.ReactNode }) {
  const {
    user,
    hasToken,
    isAuthenticated: isUserAuthenticated,
    isLoadingUser,
    isHydrated,
  } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirectDone = useRef(false)

  useEffect(() => {
    if (redirectDone.current || !isHydrated || isLoadingUser || !isUserAuthenticated) return
    const userRole = Number(user?.id_rol)
    if (userRole === 1) {
      redirectDone.current = true
      router.replace('/admin')
    }
  }, [isHydrated, isLoadingUser, isUserAuthenticated, user?.id_rol, router])

  // Solo mostrar loading si aún no está hidratado O si hay token y estamos cargando el usuario.
  // Usuarios anónimos (sin token) no deben quedarse atascados en "Cargando...".
  // No tapar toda la vista en resultado de pago: ahí se restaura el JWT y debe verse el mensaje de éxito.
  const skipFullLayoutLoading = pathname?.startsWith('/checkout/payment-result') ?? false
  const showLayoutLoading =
    !isHydrated || (!skipFullLayoutLoading && hasToken && isLoadingUser)

  if (showLayoutLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
