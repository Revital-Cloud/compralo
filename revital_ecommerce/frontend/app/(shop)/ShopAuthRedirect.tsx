'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function ShopAuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoadingUser, isHydrated } = useAuth()
  const router = useRouter()
  const redirectDone = useRef(false)

  useEffect(() => {
    if (redirectDone.current || !isHydrated || isLoadingUser || !isAuthenticated) return
    const userRole = Number(user?.id_rol)
    if (userRole === 1) {
      redirectDone.current = true
      router.replace('/admin')
    }
  }, [isHydrated, isLoadingUser, isAuthenticated, user?.id_rol, router])

  if (!isHydrated || isLoadingUser) {
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
