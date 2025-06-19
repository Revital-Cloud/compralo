import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  IconTrendingUp, 
  IconShoppingCart, 
  IconUsers, 
  IconCash,
  IconEye,
  IconPercent,
  IconPackage,
  IconTruck
} from "@tabler/icons-react"

// Mock data - En producción vendría del backend
const dashboardData = {
  totalOrders: 2642600,
  totalOrdersGrowth: 34.7,
  activeOrders: 1265400,
  activeOrdersGrowth: 14.3,
  shippedOrders: 374400,
  shippedOrdersGrowth: 24.7,
  salesData: [
    { month: 'JUL', sales: 100 },
    { month: 'AUG', sales: 150 },
    { month: 'SEP', sales: 120 },
    { month: 'OCT', sales: 180 },
    { month: 'NOV', sales: 250 },
    { month: 'DEC', sales: 400 }
  ],
  bestSellers: [
    { name: 'Adidas Ultra boost', price: 196.50, sales: '3.2k sold', image: '/products/adidas-1.jpg' },
    { name: 'Adidas Ultra boost', price: 156.50, sales: '2.1k sold', image: '/products/adidas-2.jpg' },
    { name: 'Adidas Ultra boost', price: 126.50, sales: '999 sales', image: '/products/adidas-3.jpg' }
  ],
  recentOrders: [
    { id: '#2456', product: 'Adidas Ultra boost', date: 'Jan 8th, 2022', customer: 'Leo Goose', status: 'Delivered', amount: 200.00 },
    { id: '#2455', product: 'Adidas Ultra boost', date: 'Jan 7th, 2022', customer: 'Jaxson Korsgaard', status: 'Canceled', amount: 200.00 },
    { id: '#2454', product: 'Adidas Ultra boost', date: 'Jan 6th, 2022', customer: 'Talon Bostosh', status: 'Delivered', amount: 200.00 },
    { id: '#2453', product: 'Adidas Ultra boost', date: 'Jan 5th, 2022', customer: 'Ryan Philips', status: 'Canceled', amount: 200.00 },
    { id: '#2452', product: 'Adidas Ultra boost', date: 'Jan 4th, 2022', customer: 'Emerson Baptista', status: 'Delivered', amount: 200.00 },
    { id: '#2451', product: 'Adidas Ultra boost', date: 'Jan 3th, 2022', customer: 'Jaxson Galonil', status: 'Delivered', amount: 200.00 }
  ]
}

// Componente para las tarjetas de KPI
const KPICard = ({ 
  title, 
  value, 
  growth, 
  icon: Icon, 
  period = "Compared to Jan 2022" 
}: {
  title: string
  value: string
  growth: number
  icon: any
  period?: string
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <div className="flex items-center">
          <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />
          <span className="text-green-600 font-medium">{growth}%</span>
        </div>
        <span>{period}</span>
      </div>
    </CardContent>
  </Card>
)

// Componente para el gráfico de ventas (simplificado)
const SalesChart = () => {
  const maxSales = Math.max(...dashboardData.salesData.map(d => d.sales))
  
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sale Graph</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">WEEKLY</Button>
            <Button variant="default" size="sm">MONTHLY</Button>
            <Button variant="outline" size="sm">YEARLY</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-end justify-between space-x-4">
          {dashboardData.salesData.map((data, index) => (
            <div key={data.month} className="flex flex-col items-center space-y-2 flex-1">
              <div 
                className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600"
                style={{ 
                  height: `${(data.sales / maxSales) * 200}px`,
                  minHeight: '20px'
                }}
              />
              <span className="text-xs text-muted-foreground">{data.month}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold">$400</span>
          <span className="text-sm text-muted-foreground ml-2">999 Sales</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para productos más vendidos
const BestSellers = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Best Sellers</CardTitle>
      <Button variant="ghost" size="sm">•••</Button>
    </CardHeader>
    <CardContent className="space-y-4">
      {dashboardData.bestSellers.map((product, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <IconPackage className="h-6 w-6 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.sales}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">${product.price}</p>
            <Button variant="outline" size="sm" className="text-xs h-6 px-2 mt-1">
              REPORT
            </Button>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
)

// Componente para órdenes recientes
const RecentOrders = () => (
  <Card className="col-span-1 lg:col-span-2">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Recent Orders</CardTitle>
      <Button variant="ghost" size="sm">•••</Button>
    </CardHeader>
    <CardContent>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
            <div>Product</div>
            <div>Order ID</div>
            <div>Date</div>
            <div>Customer Name</div>
            <div>Status</div>
            <div>Amount</div>
          </div>
          {dashboardData.recentOrders.map((order, index) => (
            <div key={index} className="grid grid-cols-6 gap-4 text-sm items-center">
              <div className="font-medium">{order.product}</div>
              <div className="text-muted-foreground">{order.id}</div>
              <div className="text-muted-foreground">{order.date}</div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                <span>{order.customer}</span>
              </div>
              <div>
                <Badge 
                  variant={order.status === 'Delivered' ? 'default' : 'destructive'}
                  className={order.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                >
                  {order.status}
                </Badge>
              </div>
              <div className="font-medium">${order.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {dashboardData.recentOrders.map((order, index) => (
          <Card key={index} className="p-3">
            <div className="space-y-2">
              {/* Header con Producto y Status */}
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{order.product}</div>
                <Badge 
                  variant={order.status === 'Delivered' ? 'default' : 'destructive'}
                  className={order.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                >
                  {order.status}
                </Badge>
              </div>
              
              {/* Customer */}
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                <span className="text-sm">{order.customer}</span>
              </div>
              
              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>ID: {order.id}</div>
                <div>{order.date}</div>
              </div>
              
              {/* Amount */}
              <div className="text-right">
                <span className="font-bold">${order.amount.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </CardContent>
  </Card>
)

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Home &gt; Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Feb 15, 2022 - Feb 20, 2022</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Orders"
          value="$2,642,600"
          growth={34.7}
          icon={IconShoppingCart}
        />
        <KPICard
          title="Active Orders"
          value="$1,265,400"
          growth={14.3}
          icon={IconCash}
        />
        <KPICard
          title="Shipped Orders"
          value="$374,400"
          growth={24.7}
          icon={IconTruck}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesChart />
        <BestSellers />
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1">
        <RecentOrders />
      </div>
    </div>
  )
}

export default AdminDashboard