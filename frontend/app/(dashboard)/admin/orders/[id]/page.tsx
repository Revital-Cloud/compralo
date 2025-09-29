'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { 
  IconUser,
  IconInfoCircle,
  IconTruck,
  IconCreditCard,
  IconNotes,
  IconPackage,
  IconDotsVertical,
  IconCalendar,
  IconRefresh,
  IconCheck
} from "@tabler/icons-react"
import Link from "next/link"

// Mock data para la orden específica
interface OrderDetails {
  id: string;
  status: string;
  dateRange: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  orderInfo: {
    shipping: string;
    paymentMethod: string;
    status: string;
  };
  deliverTo: {
    address: string;
    details: string;
    blocks: number;
  };
  paymentInfo: {
    card: string;
    businessName: string;
    phone: string;
  };
  products: {
    id: string;
    name: string;
    image: string;
    quantity: number;
    total: number;
  }[];
  summary: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
}

const orderDetails: OrderDetails = {
  id: "",
  status: "",
  dateRange: "",
  customer: {
    fullName: "",
    email: "",
    phone: ""
  },
  orderInfo: {
    shipping: "",
    paymentMethod: "",
    status: ""
  },
  deliverTo: {
    address: "",
    details: "",
    blocks: 0
  },
  paymentInfo: {
    card: "",
    businessName: "",
    phone: ""
  },
  products: [],
  summary: {
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0
  }
}

const OrderDetailsPage = ({ params }: { params: { id: string } }) => {
  const [status, setStatus] = useState(orderDetails.status)
  const [notes, setNotes] = useState("")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Detalles de la Orden</h1>
          <p className="text-muted-foreground">
            Inicio &gt; Lista de Órdenes &gt; Detalles de la Orden
          </p>
        </div>
      </div>

      {/* Order ID and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm text-muted-foreground">ID de Orden: </span>
            <span className="font-bold">{orderDetails.id}</span>
          </div>
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            {orderDetails.status}
          </Badge>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <IconCalendar className="h-4 w-4" />
            <span>{orderDetails.dateRange}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32">
              <option value="">Cambiar Estado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Procesando">Procesando</option>
              <option value="Enviado">Enviado</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </Select>
            <Button variant="outline" size="sm">
              <IconRefresh className="h-4 w-4" />
            </Button>
            <Button size="sm">
              Guardar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <IconUser className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">Cliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo:</p>
              <p className="font-medium">{orderDetails.customer.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email:</p>
              <p className="font-medium">{orderDetails.customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono:</p>
              <p className="font-medium">{orderDetails.customer.phone}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              Ver perfil
            </Button>
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <IconInfoCircle className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">Información de la Orden</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Envío:</p>
              <p className="font-medium">{orderDetails.orderInfo.shipping}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Método de Pago:</p>
              <p className="font-medium">{orderDetails.orderInfo.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado:</p>
              <p className="font-medium">{orderDetails.orderInfo.status}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              Descargar información
            </Button>
          </CardContent>
        </Card>

        {/* Deliver to */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <IconTruck className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">Entregar a</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Dirección:</p>
              <p className="font-medium">{orderDetails.deliverTo.address}</p>
            </div>
            <div>
              <p className="font-medium">{orderDetails.deliverTo.details}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bloques:</p>
              <p className="font-medium">{orderDetails.deliverTo.blocks}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              Ver perfil
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Info and Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-4 bg-red-500 rounded-sm flex items-center justify-center">
                <div className="w-4 h-3 bg-yellow-400 rounded-sm opacity-80"></div>
              </div>
              <span className="font-medium">{orderDetails.paymentInfo.card}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nombre del Negocio:</p>
              <p className="font-medium">{orderDetails.paymentInfo.businessName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono:</p>
              <p className="font-medium">{orderDetails.paymentInfo.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe algunas notas"
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Productos</CardTitle>
          <Button variant="ghost" size="sm">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 pb-4 border-b font-medium text-sm text-muted-foreground">
                <div></div>
                <div>Nombre del Producto</div>
                <div>ID de Orden</div>
                <div>Cantidad</div>
                <div></div>
                <div className="text-right">Total</div>
              </div>

              {/* Product Rows */}
              {orderDetails.products.map((product, index) => (
                <div key={index} className="grid grid-cols-6 gap-4 py-4 border-b items-center">
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconPackage className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-muted-foreground">{product.id}</div>
                  <div>{product.quantity}</div>
                  <div></div>
                  <div className="text-right font-medium">${product.total}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {orderDetails.products.map((product, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  {/* Header con checkbox y producto */}
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" />
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconPackage className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">ID: {product.id}</div>
                    </div>
                  </div>
                  
                  {/* Cantidad y Total */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <span className="text-sm text-muted-foreground">Cantidad: </span>
                      <span className="font-medium">{product.quantity}</span>
                    </div>
                    <div className="font-bold text-lg">${product.total}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${orderDetails.summary.subtotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Impuestos (20%)</span>
              <span className="font-medium">${orderDetails.summary.tax}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Descuento</span>
              <span className="font-medium">${orderDetails.summary.discount}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>${orderDetails.summary.total}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderDetailsPage 