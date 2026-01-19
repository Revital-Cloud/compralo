'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui"
import { EmptyState } from '@/components/admin/empty-states'

const AdminNotFound = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <EmptyState
        title="Página no encontrada"
        description="La página que buscas no existe o ha sido movida. Verifica la URL o regresa al panel de administración."
        iconPath="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 9c-2.34 0-4.29-1.009-5.824-2.709M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
        primaryAction={
          <Link href="/admin">
            <Button className="bg-[#fec806] hover:bg-[#e6b800] text-black">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ir al Dashboard
            </Button>
          </Link>
        }
        secondaryAction={
          <Button variant="outline" onClick={() => window.history.back()}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver atrás
          </Button>
        }
      >
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center">
            <svg className="w-4 h-4 mr-2 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Enlaces útiles
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <Link href="/admin/products" className="text-primary hover:text-primary/80 transition-colors">
              → Gestión de Productos
            </Link>
            <Link href="/admin/categories" className="text-primary hover:text-primary/80 transition-colors">
              → Categorías
            </Link>
            <Link href="/admin/orders" className="text-primary hover:text-primary/80 transition-colors">
              → Pedidos
            </Link>
            <Link href="/admin/users" className="text-primary hover:text-primary/80 transition-colors">
              → Usuarios
            </Link>
          </div>
        </div>
      </EmptyState>
    </div>
  )
}

export default AdminNotFound