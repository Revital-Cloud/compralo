"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"
import { Input } from "@/components/ui"
import { ScrollArea } from "@/components/ui"
import { Avatar, AvatarFallback } from "@/components/ui"
import { Badge } from "@/components/ui"
import { ArrowLeft, Send, BarChart3, Package, Users, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  data?: any
}

const adminActions = [
  { icon: BarChart3, label: "Ventas hoy", query: "Muéstrame las ventas de hoy" },
  { icon: Package, label: "Inventario bajo", query: "Productos con inventario bajo" },
  { icon: Users, label: "Nuevos clientes", query: "Clientes nuevos esta semana" },
  { icon: TrendingUp, label: "Análisis", query: "Dame un análisis general del negocio" },
]

export function AdminChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "¡Bienvenido al panel de administración! 👨‍💼 Soy tu asistente de gestión. Puedo ayudarte con análisis de ventas, gestión de inventario, reportes de pedidos y métricas del negocio. ¿Qué necesitas consultar?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async (message?: string) => {
    const messageToSend = message || input
    if (!messageToSend.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simular respuesta del bot
    setTimeout(() => {
      const botResponse = generateAdminResponse(messageToSend)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botResponse.content,
        data: botResponse.data,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1200)
  }

  const handleQuickAction = (query: string) => {
    handleSend(query)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">Gestión y análisis del negocio</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            En línea
          </Badge>
        </div>

        <Card className="border-2 shadow-xl">
          <ScrollArea className="h-[500px] p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className={message.role === "user" ? "bg-primary" : "bg-accent"}>
                    <AvatarFallback
                      className={message.role === "user" ? "text-primary-foreground" : "text-accent-foreground"}
                    >
                      {message.role === "user" ? "AD" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 max-w-[85%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                      {message.data && (
                        <div className="mt-4 space-y-2">
                          {message.data.type === "metrics" && (
                            <div className="grid grid-cols-2 gap-2">
                              {message.data.metrics.map((metric: any, idx: number) => (
                                <div key={idx} className="bg-card rounded-lg p-3 border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <metric.icon className="w-4 h-4 text-primary" />
                                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                                  </div>
                                  <p className="text-lg font-bold text-card-foreground">{metric.value}</p>
                                  {metric.change && (
                                    <p
                                      className={`text-xs ${metric.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {metric.change}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {message.data.type === "products" && (
                            <div className="space-y-2">
                              {message.data.products.map((product: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-card rounded-lg p-3 border flex items-center justify-between"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-card-foreground">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                  </div>
                                  <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
                                    {product.stock} unidades
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="bg-accent">
                    <AvatarFallback className="text-accent-foreground">AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {adminActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 bg-transparent"
                  onClick={() => handleQuickAction(action.query)}
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Consulta métricas, inventario, pedidos..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button onClick={() => handleSend()} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function generateAdminResponse(query: string): { content: string; data?: any } {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes("ventas") && lowerQuery.includes("hoy")) {
    return {
      content: "Aquí está el resumen de ventas de hoy:",
      data: {
        type: "metrics",
        metrics: [
          { icon: DollarSign, label: "Ingresos", value: "$12,450", change: "+15.3%" },
          { icon: Package, label: "Pedidos", value: "87", change: "+8.2%" },
          { icon: TrendingUp, label: "Unidades vendidas", value: "1.8K", change: "+5.1%" },
          { icon: Users, label: "Clientes nuevos", value: "23", change: "+12.0%" },
        ],
      },
    }
  }

  if (lowerQuery.includes("inventario") && lowerQuery.includes("bajo")) {
    return {
      content: "Productos con inventario bajo que requieren atención:",
      data: {
        type: "products",
        products: [
          { name: "Smartphone Galaxy X", sku: "TECH-001", stock: 5 },
          { name: 'Laptop Pro 15"', sku: "TECH-045", stock: 3 },
          { name: "Auriculares Bluetooth", sku: "AUDIO-023", stock: 8 },
          { name: "Camiseta Premium", sku: "CLOTH-112", stock: 6 },
        ],
      },
    }
  }

  if (lowerQuery.includes("clientes") && lowerQuery.includes("nuevos")) {
    return {
      content: "Resumen de clientes nuevos esta semana:",
      data: {
        type: "metrics",
        metrics: [
          { icon: Users, label: "Nuevos registros", value: "156", change: "+23.5%" },
          { icon: DollarSign, label: "Valor promedio", value: "$89", change: "+11.2%" },
          { icon: TrendingUp, label: "Tasa conversión", value: "34%", change: "+4.8%" },
          { icon: Package, label: "Primera compra", value: "98", change: "+18.9%" },
        ],
      },
    }
  }

  if (lowerQuery.includes("análisis") || lowerQuery.includes("general")) {
    return {
      content: "Análisis general del negocio (últimos 7 días):",
      data: {
        type: "metrics",
        metrics: [
          { icon: DollarSign, label: "Ingresos totales", value: "$78,340", change: "+18.7%" },
          { icon: Package, label: "Pedidos totales", value: "542", change: "+12.3%" },
          { icon: Users, label: "Clientes activos", value: "1,234", change: "+9.5%" },
          { icon: TrendingUp, label: "Tasa retención", value: "67%", change: "+3.2%" },
        ],
      },
    }
  }

  if (lowerQuery.includes("pedido") || lowerQuery.includes("orden")) {
    return {
      content:
        "Estado de pedidos actuales:\n\n✅ Completados: 423 pedidos\n📦 En preparación: 67 pedidos\n🚚 En tránsito: 89 pedidos\n⏳ Pendientes: 12 pedidos\n\nTasa de cumplimiento: 96.8%\nTiempo promedio de procesamiento: 1.2 días",
      data: null,
    }
  }

  if (lowerQuery.includes("producto") && (lowerQuery.includes("agregar") || lowerQuery.includes("añadir"))) {
    return {
      content:
        "Para agregar un nuevo producto, necesito la siguiente información:\n\n📝 Nombre del producto\n💰 Precio\n📦 Cantidad inicial en stock\n🏷️ Categoría\n📸 Imágenes del producto\n📄 Descripción\n\n¿Tienes esta información lista?",
      data: null,
    }
  }

  if (lowerQuery.includes("actualizar") && lowerQuery.includes("precio")) {
    return {
      content:
        "Para actualizar precios, puedo ayudarte de dos formas:\n\n1️⃣ Actualización individual: Dame el SKU y el nuevo precio\n2️⃣ Actualización masiva: Puedo aplicar un porcentaje de cambio a una categoría\n\n¿Cuál prefieres?",
      data: null,
    }
  }

  if (lowerQuery.includes("reporte") || lowerQuery.includes("informe")) {
    return {
      content:
        "Puedo generar los siguientes reportes:\n\n📊 Ventas por período\n📦 Inventario actual\n👥 Análisis de clientes\n💰 Ingresos y gastos\n📈 Productos más vendidos\n🎯 Conversión y retención\n\n¿Qué reporte necesitas?",
      data: null,
    }
  }

  if (lowerQuery.includes("más vendido") || lowerQuery.includes("top")) {
    return {
      content: "Top 5 productos más vendidos este mes:",
      data: {
        type: "products",
        products: [
          { name: "Smartphone Galaxy X", sku: "TECH-001", stock: 234 },
          { name: "Auriculares Pro", sku: "AUDIO-015", stock: 189 },
          { name: "Smartwatch Elite", sku: "TECH-089", stock: 156 },
          { name: "Laptop Ultra", sku: "TECH-045", stock: 143 },
          { name: "Tablet Max", sku: "TECH-067", stock: 128 },
        ],
      },
    }
  }

  return {
    content:
      "Puedo ayudarte con:\n\n📊 Análisis de ventas y métricas\n📦 Gestión de inventario\n👥 Información de clientes\n📈 Reportes personalizados\n💰 Análisis financiero\n🎯 Optimización de productos\n\n¿Qué necesitas consultar específicamente?",
    data: null,
  }
}
