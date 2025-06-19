'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
const orderDetails = {
  id: "#6743",
  status: "Pending",
  dateRange: "Feb 16,2022 - Feb 20,2022",
  customer: {
    fullName: "Jane Cooper",
    email: "janecooper@gmail.com",
    phone: "+900 231 7372"
  },
  orderInfo: {
    shipping: "Next express",
    paymentMethod: "Paypal",
    status: "Pending"
  },
  deliverTo: {
    address: "Santa Ana, Illinois",
    details: "62342 3456 Westminster Rd,",
    blocks: 5
  },
  paymentInfo: {
    card: "Master Card •••• •••• 4557",
    businessName: "Jane Cooper",
    phone: "+900 231 7372"
  },
  products: [
    {
      id: "#25421",
      name: "Adidas ultra boost",
      image: "/products/adidas-1.jpg",
      quantity: 2,
      total: 800.40
    },
    {
      id: "#25421", 
      name: "Adidas ultra boost",
      image: "/products/adidas-2.jpg",
      quantity: 2,
      total: 800.40
    },
    {
      id: "#25421",
      name: "Adidas ultra boost", 
      image: "/products/adidas-3.jpg",
      quantity: 2,
      total: 800.40
    },
    {
      id: "#25421",
      name: "Adidas ultra boost",
      image: "/products/adidas-4.jpg", 
      quantity: 2,
      total: 800.40
    }
  ],
  summary: {
    subtotal: 3201.6,
    tax: 640.32,
    discount: 0,
    total: 3841.92
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
          <h1 className="text-2xl font-bold">Orders Details</h1>
          <p className="text-muted-foreground">
            Home &gt; Order List &gt; Order Details
          </p>
        </div>
      </div>

      {/* Order ID and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm text-muted-foreground">Orders ID: </span>
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <IconRefresh className="h-4 w-4" />
            </Button>
            <Button size="sm">
              Save
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
              <CardTitle className="text-base">Customer</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Full Name:</p>
              <p className="font-medium">{orderDetails.customer.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email:</p>
              <p className="font-medium">{orderDetails.customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone:</p>
              <p className="font-medium">{orderDetails.customer.phone}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              View profile
            </Button>
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <IconInfoCircle className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">Order Info</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Shipping:</p>
              <p className="font-medium">{orderDetails.orderInfo.shipping}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method:</p>
              <p className="font-medium">{orderDetails.orderInfo.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status:</p>
              <p className="font-medium">{orderDetails.orderInfo.status}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              Download info
            </Button>
          </CardContent>
        </Card>

        {/* Deliver to */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <IconTruck className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">Deliver to</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Address:</p>
              <p className="font-medium">{orderDetails.deliverTo.address}</p>
            </div>
            <div>
              <p className="font-medium">{orderDetails.deliverTo.details}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Blocks:</p>
              <p className="font-medium">{orderDetails.deliverTo.blocks}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              View profile
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Info and Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-4 bg-red-500 rounded-sm flex items-center justify-center">
                <div className="w-4 h-3 bg-yellow-400 rounded-sm opacity-80"></div>
              </div>
              <span className="font-medium">{orderDetails.paymentInfo.card}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Business Name:</p>
              <p className="font-medium">{orderDetails.paymentInfo.businessName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone:</p>
              <p className="font-medium">{orderDetails.paymentInfo.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Note</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type some notes"
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Products</CardTitle>
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
                <div>Product Name</div>
                <div>Order ID</div>
                <div>Quantity</div>
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
              <span className="text-muted-foreground">Tax (20%)</span>
              <span className="font-medium">${orderDetails.summary.tax}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Discount</span>
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