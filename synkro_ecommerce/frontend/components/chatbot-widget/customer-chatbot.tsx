"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"
import { Input } from "@/components/ui"
import { ScrollArea } from "@/components/ui"
import { Avatar, AvatarFallback } from "@/components/ui"
import { ArrowLeft, Send, Package, Truck, ShoppingBag, HelpCircle } from "lucide-react"
import Link from "next/link"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const quickActions = [
  { icon: Package, label: "Ver productos", query: "¿Qué productos tienen disponibles?" },
  { icon: Truck, label: "Rastrear pedido", query: "Quiero rastrear mi pedido" },
  { icon: ShoppingBag, label: "Estado de compra", query: "¿Cuál es el estado de mi compra?" },
  { icon: HelpCircle, label: "Ayuda", query: "Necesito ayuda con mi pedido" },
]

export function CustomerChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre productos, seguimiento de pedidos, políticas de envío y más.",
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
      const botResponse = generateCustomerResponse(messageToSend)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botResponse,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleQuickAction = (query: string) => {
    handleSend(query)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Asistente de Clientes</h1>
            <p className="text-sm text-muted-foreground">Estamos aquí para ayudarte</p>
          </div>
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
                      {message.role === "user" ? "TÚ" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
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
              {quickActions.map((action) => (
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
                placeholder="Escribe tu mensaje..."
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

function generateCustomerResponse(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes("producto") || lowerQuery.includes("disponible")) {
    return "¡Claro! Tenemos una amplia variedad de productos disponibles. Algunos de nuestros más populares son:\n\n📱 Electrónica: Smartphones, laptops, tablets\n👕 Ropa: Moda para hombre, mujer y niños\n🏠 Hogar: Decoración, muebles, electrodomésticos\n\n¿Hay alguna categoría específica que te interese?"
  }

  if (lowerQuery.includes("rastrear") || lowerQuery.includes("seguimiento") || lowerQuery.includes("pedido")) {
    return "Para rastrear tu pedido, necesito tu número de orden. Por lo general tiene este formato: #ORD-12345.\n\nSi tienes tu número de orden, por favor compártelo y te daré el estado actualizado de tu envío. 📦"
  }

  if (lowerQuery.includes("estado") || lowerQuery.includes("compra")) {
    return "Puedo ayudarte a verificar el estado de tu compra. Los estados posibles son:\n\n✅ Confirmado - Tu pedido ha sido recibido\n📦 En preparación - Estamos empacando tu pedido\n🚚 En camino - Tu pedido está en tránsito\n✨ Entregado - Tu pedido ha llegado\n\n¿Cuál es tu número de orden?"
  }

  if (lowerQuery.includes("envío") || lowerQuery.includes("entrega")) {
    return "Nuestras opciones de envío son:\n\n🚚 Envío estándar (5-7 días): Gratis en compras mayores a $50\n⚡ Envío express (2-3 días): $9.99\n🎯 Envío prioritario (1 día): $19.99\n\nTodos los envíos incluyen número de rastreo. ¿Necesitas más información?"
  }

  if (lowerQuery.includes("devolución") || lowerQuery.includes("reembolso")) {
    return "Nuestra política de devoluciones:\n\n✅ 30 días para devoluciones\n💰 Reembolso completo si el producto está sin usar\n📦 Envío de devolución gratis\n\nPara iniciar una devolución, necesitaré tu número de orden. ¿Tienes algún problema con tu compra?"
  }

  if (lowerQuery.includes("pago") || lowerQuery.includes("tarjeta")) {
    return "Aceptamos los siguientes métodos de pago:\n\n💳 Tarjetas de crédito/débito (Visa, Mastercard, Amex)\n🏦 Transferencia bancaria\n📱 PayPal\n💵 Pago contra entrega (en áreas seleccionadas)\n\nTodas las transacciones son 100% seguras. ¿Tienes alguna pregunta sobre pagos?"
  }

  if (lowerQuery.includes("ayuda") || lowerQuery.includes("problema")) {
    return "Estoy aquí para ayudarte. Puedo asistirte con:\n\n• Información sobre productos\n• Seguimiento de pedidos\n• Políticas de envío y devolución\n• Métodos de pago\n• Problemas con tu cuenta\n\n¿Con qué necesitas ayuda específicamente?"
  }

  return "Gracias por tu mensaje. Estoy aquí para ayudarte con cualquier consulta sobre productos, pedidos, envíos o devoluciones. ¿Podrías darme más detalles sobre lo que necesitas? 😊"
}
