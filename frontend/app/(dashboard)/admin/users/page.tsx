'use client';

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  IconSearch,
  IconFilter,
  IconDownload,
  IconMail,
  IconCalendar,
  IconShoppingBag
} from "@tabler/icons-react"
import { ExportDialog } from "@/components/excel"
import { toast } from "sonner"

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  registrationDate: string;
  totalOrders: number;
  totalSpent: number;
  status: string;
}

// Mock data para usuarios
const usersData: User[] = []

// Estadísticas de usuarios
const userStats = {
  total: 0,
  customers: 0,
  employees: 0,
  admins: 0,
  active: 0,
  inactive: 0
}

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Admin</Badge>
    case 'employee':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Empleado</Badge>
    case 'customer':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Cliente</Badge>
    default:
      return <Badge variant="secondary">{role}</Badge>
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
    case 'inactive':
      return <Badge variant="destructive">Inactivo</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const UserCard = ({ user }: { user: any }) => (
  <Card className="relative">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-sm font-medium">{user.name}</CardTitle>
            <CardDescription className="text-xs flex items-center gap-1">
              <IconMail className="h-3 w-3" />
              {user.email}
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {getRoleBadge(user.role)}
          {getStatusBadge(user.status)}
        </div>
      </div>
    </CardHeader>
    
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <IconCalendar className="h-3 w-3" />
            Registro
          </p>
          <span className="text-sm font-medium">{user.registrationDate}</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <IconShoppingBag className="h-3 w-3" />
            Órdenes
          </p>
          <span className="text-sm font-medium">{user.totalOrders}</span>
        </div>
      </div>
      
      {user.role === 'customer' && (
        <div>
          <p className="text-xs text-muted-foreground">Total Gastado</p>
          <div className="text-lg font-bold text-green-600">
            ${user.totalSpent.toLocaleString()}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
)

const UsersPage = () => {
  const handleExportComplete = (filename: string) => {
    toast.success(`¡Usuarios exportados exitosamente en ${filename}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona todos los usuarios de tu plataforma
          </p>
        </div>
        <ExportDialog
          defaultDataTypes={['users']}
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
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{userStats.customers}</div>
            <p className="text-sm text-muted-foreground">Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{userStats.employees}</div>
            <p className="text-sm text-muted-foreground">Empleados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{userStats.admins}</div>
            <p className="text-sm text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
            <p className="text-sm text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{userStats.inactive}</div>
            <p className="text-sm text-muted-foreground">Inactivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <IconFilter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usersData.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}

export default UsersPage