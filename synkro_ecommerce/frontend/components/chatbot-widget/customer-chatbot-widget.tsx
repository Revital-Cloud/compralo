"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"
import { Input } from "@/components/ui"
import { ScrollArea } from "@/components/ui"
import { Avatar, AvatarFallback } from "@/components/ui"
import { Send, Package, Truck, ShoppingBag, HelpCircle, MessageCircle, X, ArrowLeft, Sparkles } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const quickActions = [
  { icon: Package, label: "Productos", query: "¿Qué productos tienen disponibles?" },
  { icon: Truck, label: "Rastrear", query: "Quiero rastrear mi pedido" },
  { icon: ShoppingBag, label: "Mi compra", query: "¿Cuál es el estado de mi compra?" },
  { icon: HelpCircle, label: "Ayuda", query: "Necesito ayuda con mi pedido" },
]

export function CustomerChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hola, soy tu asistente virtual. Estoy aquí para ayudarte con información sobre productos, seguimiento de pedidos y más. ¿En qué puedo ayudarte?",
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

  const handleClose = () => {
    setIsOpen(false)
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hola, soy tu asistente virtual. Estoy aquí para ayudarte con información sobre productos, seguimiento de pedidos y más. ¿En qué puedo ayudarte?",
        timestamp: new Date(),
      },
    ])
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center z-50 group"
      >
        <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
        <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-[400px] h-[600px] shadow-2xl border transition-all duration-300 backdrop-blur-sm bg-card/95 flex flex-col">
        <div className="bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground px-5 py-4 rounded-t-xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary-foreground/15 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-primary-foreground/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Asistente Virtual</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-xs opacity-90 font-medium">En línea</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/15 rounded-full transition-colors"
              onClick={handleClose}
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/15 rounded-full transition-colors"
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
                      className={`text-xs font-semibold text-foreground ${message.role === "user" ? "text-primary-foreground" : "text-accent-foreground"}`}
                    >
                      {message.role === "user" ? "TÚ" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                          : "bg-background text-foreground border border-border/50"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
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
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-9 text-xs font-medium hover:bg-secondary/80 rounded-lg transition-colors"
                  onClick={() => handleQuickAction(action.query)}
                >
                  <action.icon className="w-3.5 h-3.5 text-primary" />
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border/50 bg-background rounded-b-xl flex-shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 h-10 text-sm bg-secondary/50 border-border/50 focus-visible:ring-primary/20 rounded-xl"
            />
            <Button
              onClick={() => handleSend()}
              size="icon"
              className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
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
