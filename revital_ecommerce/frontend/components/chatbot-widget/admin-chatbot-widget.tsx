"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"
import { Input } from "@/components/ui"
import { ScrollArea } from "@/components/ui"
import { Avatar, AvatarFallback } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Send, BarChart3, Package, Users, DollarSign, TrendingUp, ShieldCheck, X, ArrowLeft, Zap } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  data?: any
}

const adminActions = [
  { icon: BarChart3, label: "Ventas", query: "Muéstrame las ventas de hoy" },
  { icon: Package, label: "Inventario", query: "Productos con inventario bajo" },
  { icon: Users, label: "Clientes", query: "Clientes nuevos esta semana" },
  { icon: TrendingUp, label: "Análisis", query: "Dame un análisis general del negocio" },
]

export function AdminChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Bienvenido al panel de administración. Puedo ayudarte con análisis de ventas, gestión de inventario, reportes y métricas del negocio. ¿Qué necesitas consultar?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const showQuickActions = messages.length === 1 && messages[0].role === "assistant"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

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

  const handleClose = () => {
    setIsOpen(false)
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Bienvenido al panel de administración. Puedo ayudarte con análisis de ventas, gestión de inventario, reportes y métricas del negocio. ¿Qué necesitas consultar?",
        timestamp: new Date(),
      },
    ])
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-accent to-accent/80 text-accent-foreground rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center z-50 group"
      >
        <ShieldCheck className="w-6 h-6 transition-transform group-hover:scale-110" />
        <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-[440px] h-[600px] shadow-2xl border transition-all duration-300 backdrop-blur-sm bg-card/95 flex flex-col">
        <div className="bg-gradient-to-r from-accent via-accent to-accent/90 text-accent-foreground px-5 py-4 rounded-t-xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-accent-foreground/15 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-accent-foreground/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Panel Admin</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-xs opacity-90 font-medium">Sistema activo</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-accent-foreground hover:bg-accent-foreground/15 rounded-full transition-colors"
              onClick={handleClose}
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-accent-foreground hover:bg-accent-foreground/15 rounded-full transition-colors"
              onClick={handleClose}
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-secondary/30">
          <ScrollArea className="h-full">
            <div ref={scrollRef} className="p-5 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar
                    className={`w-9 h-9 flex-shrink-0 ${message.role === "user" ? "bg-gradient-to-br from-primary to-primary/80" : "bg-gradient-to-br from-accent to-accent/80"} ring-2 ring-background`}
                  >
                    <AvatarFallback
                      className={`text-xs font-semibold ${message.role === "user" ? "text-primary-foreground" : "text-accent-foreground"}`}
                    >
                      {message.role === "user" ? "AD" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-2.5 max-w-[90%] shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                          : "bg-background text-foreground border border-border/50"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                      {message.data && (
                        <div className="mt-3 space-y-2">
                          {message.data.type === "metrics" && (
                            <div className="grid grid-cols-2 gap-2">
                              {message.data.metrics.map((metric: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-card/80 backdrop-blur-sm rounded-xl p-3 border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <metric.icon className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                      {metric.label}
                                    </span>
                                  </div>
                                  <p className="text-base font-bold text-card-foreground mb-0.5">{metric.value}</p>
                                  {metric.change && (
                                    <p
                                      className={`text-[10px] font-semibold ${metric.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
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
                                  className="bg-card/80 backdrop-blur-sm rounded-xl p-3 border border-border/50 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <div>
                                    <p className="text-xs font-semibold text-card-foreground">{product.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                      SKU: {product.sku}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={product.stock < 10 ? "destructive" : "secondary"}
                                    className="text-[10px] h-6 px-2.5 font-semibold"
                                  >
                                    {product.stock}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 px-1 font-medium">
                      {message.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="w-9 h-9 bg-gradient-to-br from-accent to-accent/80 ring-2 ring-background">
                    <AvatarFallback className="text-xs font-semibold text-accent-foreground">AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-background border border-border/50 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <div
                        className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {showQuickActions && (
          <div className="px-4 py-3 border-t border-border/50 bg-background/50 backdrop-blur-sm flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              {adminActions.map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-9 text-xs font-medium hover:bg-secondary/80 rounded-lg transition-colors"
                  onClick={() => handleQuickAction(action.query)}
                >
                  <action.icon className="w-3.5 h-3.5 text-accent" />
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border/50 bg-background rounded-b-xl flex-shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Consulta métricas, inventario..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 h-10 text-sm bg-secondary/50 border-border/50 focus-visible:ring-accent/20 rounded-xl"
            />
            <Button
              onClick={() => handleSend()}
              size="icon"
              className="h-10 w-10 bg-gradient-to-br from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 rounded-xl shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
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
