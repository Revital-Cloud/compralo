# Ejemplos de Componentes UI - Panel de Control Synkro

## 🎨 Componentes Clave con Ejemplos de Código

### 1. Status Badge Component

```tsx
// components/dashboard/status-badge.tsx
'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'

type Status = 'active' | 'trial' | 'suspended' | 'cancelled' | 'pending'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<Status, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  trial: { label: 'Trial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
  pending: { label: 'Pending', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
```

### 2. Metric Card (Mejorado)

```tsx
// components/dashboard/metric-card.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-package'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
  description?: string
}

export function MetricCard({
  title,
  value,
  change,
  trend = 'stable',
  icon: Icon,
  loading = false,
  description
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-600'

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value}</div>
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs mt-1', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(change).toFixed(1)}%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

### 3. Resource Usage Card

```tsx
// components/dashboard/resource-card.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-package'
import { Progress } from '@/components/ui-package'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResourceUsage {
  current: number
  max: number | null
  percentage?: number
}

interface ResourceCardProps {
  instanceName: string
  instanceId: string | number
  products: ResourceUsage
  users: ResourceUsage
  storage: ResourceUsage
  alerts?: ('products' | 'users' | 'storage')[]
}

export function ResourceCard({
  instanceName,
  instanceId,
  products,
  users,
  storage,
  alerts = []
}: ResourceCardProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const formatStorage = (gb: number) => `${gb.toFixed(1)} GB`

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{instanceName}</CardTitle>
        <p className="text-sm text-muted-foreground">Instance ID: {instanceId}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Products</span>
            <span className="text-sm text-muted-foreground">
              {products.current} / {products.max ?? '∞'}
            </span>
          </div>
          {products.max && (
            <>
              <Progress 
                value={products.percentage || (products.current / products.max) * 100} 
                className="h-2"
              />
              {alerts.includes('products') && (
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Near limit</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Users */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Users</span>
            <span className="text-sm text-muted-foreground">
              {users.current} / {users.max ?? '∞'}
            </span>
          </div>
          {users.max && (
            <>
              <Progress 
                value={users.percentage || (users.current / users.max) * 100} 
                className="h-2"
              />
              {alerts.includes('users') && (
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Near limit</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Storage */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Storage</span>
            <span className="text-sm text-muted-foreground">
              {formatStorage(storage.current)} / {storage.max ? formatStorage(storage.max) : '∞'}
            </span>
          </div>
          {storage.max && (
            <>
              <Progress 
                value={storage.percentage || (storage.current / storage.max) * 100} 
                className="h-2"
              />
              {alerts.includes('storage') && (
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Near limit</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4. Instance Card (Vista Grid)

```tsx
// components/dashboard/instance-card.tsx
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui-package'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui-package'
import { ExternalLink, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui-package'
import type { InstancePublic } from '@/types'

interface InstanceCardProps {
  instance: InstancePublic
  onView?: (id: string | number) => void
  onEdit?: (id: string | number) => void
  onDelete?: (id: string | number) => void
}

export function InstanceCard({ instance, onView, onEdit, onDelete }: InstanceCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{instance.nom_instancia}</h3>
          <p className="text-sm text-muted-foreground">{instance.slug_instancia}</p>
        </div>
        <StatusBadge status={instance.estado_instancia as any} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Client:</span>
            <span className="font-medium">{instance.identificacion_fiscal_cliente}</span>
          </div>
          {instance.frontend_url && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">URL:</span>
              <a
                href={instance.frontend_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-synkro-green hover:underline"
              >
                <span className="truncate max-w-[150px]">{instance.frontend_url}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {instance.version_instancia && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-mono text-xs">{instance.version_instancia}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(instance.id_instancia)}
          >
            View Details
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(instance.id_instancia)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(instance.id_instancia)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 5. Dashboard Sidebar

```tsx
// components/layout/dashboard-sidebar.tsx
'use client'

import {
  IconDashboard,
  IconUsers,
  IconServer,
  IconCreditCard,
  IconPackage,
  IconReceipt,
  IconCloudUpload,
  IconWorld,
  IconChartBar,
  IconSettings,
  IconHelp,
} from '@tabler/icons-react'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem } from '@/components/ui-package'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: IconDashboard },
    ],
  },
  {
    title: 'Management',
    items: [
      { title: 'Clients', href: '/dashboard/clients', icon: IconUsers },
      { title: 'Instances', href: '/dashboard/instances', icon: IconServer },
      { title: 'Subscriptions', href: '/dashboard/subscriptions', icon: IconCreditCard },
      { title: 'Plans', href: '/dashboard/plans', icon: IconPackage },
    ],
  },
  {
    title: 'Operations',
    items: [
      { title: 'Billing', href: '/dashboard/billing', icon: IconReceipt },
      { title: 'Deployments', href: '/dashboard/deployments', icon: IconCloudUpload },
      { title: 'Domains', href: '/dashboard/domains', icon: IconWorld },
      { title: 'Resource Usage', href: '/dashboard/resources', icon: IconChartBar },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'Admin Users', href: '/dashboard/admin-users', icon: IconUsers },
      { title: 'Settings', href: '/dashboard/settings', icon: IconSettings },
      { title: 'Help', href: '/dashboard/help', icon: IconHelp },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-lg bg-synkro-green" />
          <div>
            <div className="font-semibold">Synkro</div>
            <div className="text-xs text-muted-foreground">SaaS Control Panel</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </div>
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-synkro-green/10 text-synkro-green font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
```

### 6. Dashboard Header

```tsx
// components/layout/dashboard-header.tsx
'use client'

import { Button } from '@/components/ui-package'
import { Bell, Search, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui-package'
import { useLogout } from '@/hooks/use-auth'

export function DashboardHeader() {
  const { user } = useAuth()
  const { mutate: logout } = useLogout()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Search */}
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search clients, instances..."
              className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-synkro-green"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.nombre}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
```

### 7. Ejemplo de Página de Dashboard

```tsx
// app/(dashboard)/dashboard/page.tsx
'use client'

import { useClients } from '@/hooks/use-clients'
import { useActiveSubscriptions } from '@/hooks/use-subscriptions'
import { useInstances } from '@/hooks/use-instances'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ResourceCard } from '@/components/dashboard/resource-card'
import { IconUsers, IconServer, IconCreditCard, IconTrendingUp } from '@tabler/icons-react'
import { useLatestResourceUsage } from '@/hooks/use-resource-usage'

export default function DashboardPage() {
  const { data: clients, isLoading: clientsLoading } = useClients()
  const { data: subscriptions, isLoading: subsLoading } = useActiveSubscriptions()
  const { data: instances, isLoading: instancesLoading } = useInstances()

  // Calcular métricas
  const totalClients = clients?.length || 0
  const activeInstances = instances?.filter(i => i.estado_instancia === 'activa').length || 0
  const totalSubscriptions = subscriptions?.length || 0
  const mrr = subscriptions?.reduce((sum, s) => sum + Number(s.precio_actual), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your SaaS platform.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Date picker, refresh button, etc. */}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Clients"
          value={totalClients.toLocaleString()}
          change={12.5}
          trend="up"
          icon={IconUsers}
          loading={clientsLoading}
        />
        <MetricCard
          title="Active Instances"
          value={activeInstances.toLocaleString()}
          change={8.2}
          trend="up"
          icon={IconServer}
          loading={instancesLoading}
        />
        <MetricCard
          title="MRR"
          value={`$${mrr.toLocaleString()}`}
          change={15.3}
          trend="up"
          icon={IconTrendingUp}
          loading={subsLoading}
        />
        <MetricCard
          title="Active Subscriptions"
          value={totalSubscriptions.toLocaleString()}
          change={5.7}
          trend="up"
          icon={IconCreditCard}
          loading={subsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - ocuparía 2 columnas */}
        <div className="lg:col-span-2">
          {/* Chart component aquí */}
        </div>
        
        {/* Resource Usage Overview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Resource Usage</h2>
          {/* Lista de instancias con uso de recursos */}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {/* Activity feed component */}
      </div>
    </div>
  )
}
```

## 🎨 Paleta de Colores Específica

```css
/* Dashboard Colors */
--dashboard-bg: hsl(var(--background))
--dashboard-border: hsl(var(--border))
--dashboard-card: hsl(var(--card))
--dashboard-card-hover: hsl(var(--card) / 0.8)

/* Status Colors */
--status-active: 142 71% 45%      /* synkro-green */
--status-trial: 38 92% 50%        /* amber-500 */
--status-suspended: 0 84% 60%     /* red-500 */
--status-cancelled: 215 16% 47%   /* gray-500 */

/* Resource Alert Colors */
--alert-critical: 0 72% 51%       /* red-600 */
--alert-warning: 38 92% 50%       /* amber-500 */
--alert-info: 217 91% 60%         /* blue-500 */
```

## 📱 Responsive Breakpoints

```tsx
// Tailwind breakpoints
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large
```

## 🚀 Próximos Pasos

1. Crear estructura de carpetas `app/(dashboard)/`
2. Implementar componentes base (StatusBadge, MetricCard, etc.)
3. Crear layout con Sidebar y Header
4. Implementar páginas principales usando React Query hooks
5. Agregar tablas con TanStack Table
6. Implementar formularios con React Hook Form
7. Agregar gráficos con Recharts o similar
8. Implementar búsqueda global (Cmd+K)
9. Agregar filtros avanzados
10. Optimizar para mobile
