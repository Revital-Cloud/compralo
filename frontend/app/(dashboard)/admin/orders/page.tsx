'use client';

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  IconSearch,
  IconFilter,
  IconDownload,
  IconEye,
  IconPackage,
  IconTruck,
  IconCheck,
  IconX
} from "@tabler/icons-react"
import Link from "next/link"
import { ExportDialog } from "@/components/excel"
import { toast } from "sonner"

interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    avatar: string;
  };
  product: string;
  date: string;
  status: "delivered" | "canceled" | "pending" | "processing" | "shipped";
  amount: number;
  items: number;
}

// Mock data para órdenes
const ordersData: Order[] = []

// Estadísticas de órdenes
const orderStats = {
  total: 0,
  pending: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  canceled: 0
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'delivered':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Entregado</Badge>
    case 'canceled':
      return <Badge variant="destructive">Cancelado</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>
    case 'processing':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Procesando</Badge>
    case 'shipped':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Enviado</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered':
      return <IconCheck className="h-4 w-4 text-green-500" />
    case 'canceled':
      return <IconX className="h-4 w-4 text-red-500" />
    case 'pending':
      return <IconPackage className="h-4 w-4 text-yellow-500" />
    case 'processing':
      return <IconPackage className="h-4 w-4 text-blue-500" />
    case 'shipped':
      return <IconTruck className="h-4 w-4 text-purple-500" />
    default:
      return <IconPackage className="h-4 w-4 text-gray-500" />
  }
}

const OrdersPage = () => {
  const handleExportComplete = (filename: string) => {
    toast.success(`¡Órdenes exportadas exitosamente en ${filename}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes</h1>
          <p className="text-muted-foreground">
            Gestiona todas las órdenes de tu tienda
          </p>
        </div>
        <ExportDialog
          defaultDataTypes={['orders']}
          onExportComplete={handleExportComplete}
        >
          <Button>
            <IconDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </ExportDialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
            <p className="text-sm text-muted-foreground">Procesando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{orderStats.shipped}</div>
            <p className="text-sm text-muted-foreground">Enviadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
            <p className="text-sm text-muted-foreground">Entregadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{orderStats.canceled}</div>
            <p className="text-sm text-muted-foreground">Canceladas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID de orden, cliente o producto..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <IconFilter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Órdenes */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
          <CardDescription>
            Lista completa de todas las órdenes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="space-y-4">
              {/* Header de tabla */}
              <div className="grid grid-cols-7 gap-4 pb-4 border-b font-medium text-sm text-muted-foreground">
                <div>Orden ID</div>
                <div>Cliente</div>
                <div>Producto</div>
                <div>Fecha</div>
                <div>Estado</div>
                <div>Monto</div>
                <div>Acciones</div>
              </div>

              {/* Filas de órdenes */}
              {ordersData.map((order, index) => (
                <div key={index} className="grid grid-cols-7 gap-4 py-4 border-b items-center">
                  <div className="font-medium">{order.id}</div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {order.customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm">{order.product}</div>
                  <div className="text-sm text-muted-foreground">{order.date}</div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="font-medium">${order.amount.toFixed(2)}</div>
                  
                  <div className="flex items-center space-x-2">
                    <Link href={`/admin/orders/${order.id.replace('#', '')}`}>
                      <Button variant="ghost" size="sm">
                        <IconEye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <IconDownload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {ordersData.map((order, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  {/* Header con ID y Estado */}
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{order.id}</div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                  
                  {/* Cliente */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {order.customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                    </div>
                  </div>
                  
                  {/* Detalles del producto y fecha */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Producto:</p>
                      <p className="font-medium">{order.product}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha:</p>
                      <p className="font-medium">{order.date}</p>
                    </div>
                  </div>
                  
                  {/* Monto y Acciones */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="font-bold text-lg">${order.amount.toFixed(2)}</div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/admin/orders/${order.id.replace('#', '')}`}>
                        <Button variant="ghost" size="sm">
                          <IconEye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <IconDownload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {ordersData.length} de {orderStats.total} órdenes
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="default" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OrdersPage