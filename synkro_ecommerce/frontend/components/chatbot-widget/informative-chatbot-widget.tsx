"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"
import { Input } from "@/components/ui"
import { ScrollArea } from "@/components/ui"
import { Avatar, AvatarFallback } from "@/components/ui"
import { Send, X } from "lucide-react"
import Image from "next/image"
import { useActiveDiscounts } from "@/hooks/use-discounts"
import { useActivePointsRate } from "@/hooks/use-points"
import { formatPrice } from "@/utils/format-price"
import type { Discount } from "@/types/discount"
import {
  WELCOME_MESSAGE,
  INVALID_OPTION_MESSAGE,
  GOODBYE_MESSAGE,
  getMainMenuText,
  getSubmenuText,
  getSectionById,
} from "./chatbot-menu-content"

type MenuState =
  | "main"
  | "terminos"
  | "datos"
  | "descuentos"
  | "puntos"
  | "garantias"
  | "submenu"

type SubmenuFrom = "terminos" | "datos" | "descuentos" | "puntos" | "garantias"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

const SECTION_IDS: SubmenuFrom[] = ["terminos", "datos", "descuentos", "puntos", "garantias"]

function parseOption(input: string): number | null {
  const n = parseInt(input.trim(), 10)
  if (Number.isNaN(n)) return null
  return n
}

function formatDiscountValue(d: Discount): string {
  return d.tipo_calculo ? `${d.val_porce_descuento ?? 0}%` : formatPrice(d.val_monto_descuento ?? 0)
}

export function InformativeChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [menuState, setMenuState] = useState<MenuState>("main")
  const [submenuFrom, setSubmenuFrom] = useState<SubmenuFrom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const nextIdRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data: activeDiscounts } = useActiveDiscounts(20)
  const { data: activePointsRate } = useActivePointsRate()

  const nextId = () => `msg-${++nextIdRef.current}`

  const addUserMessage = (content: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", content }])
  }

  const addBotMessage = (content: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content }])
  }

  const showSubmenu = (from: SubmenuFrom) => {
    addBotMessage("Elige una opción:\n\n" + getSubmenuText())
    setMenuState("submenu")
    setSubmenuFrom(from)
  }

  const handleClose = () => {
    setIsOpen(false)
    setMessages([])
    setMenuState("main")
    setSubmenuFrom(null)
    setInput("")
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (messages.length === 0) {
      addBotMessage(WELCOME_MESSAGE)
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text?: string) => {
    const raw = (text ?? input).trim()
    if (!raw) return

    const toSend = text ?? input
    setInput("")
    addUserMessage(toSend)
    const option = parseOption(toSend)

    if (menuState === "main") {
      if (option !== null && option === 6) {
        addBotMessage(GOODBYE_MESSAGE)
        setTimeout(handleClose, 800)
        return
      }
      if (option !== null && option >= 1 && option <= 5) {
        const sectionId = SECTION_IDS[option - 1]
        const section = getSectionById(sectionId)
        if (section) {
          let content = `${section.title}\n\n${section.content}`
          if (sectionId === "descuentos") {
            if (activeDiscounts?.length) {
              content += `\n\nDescuentos activos en este momento (${activeDiscounts.length}):\n${activeDiscounts.map((d, i) => `${i + 1}. ${d.nom_descuento}: ${formatDiscountValue(d)}`).join("\n")}`
            } else {
              content += "\n\nNo hay descuentos activos en este momento."
            }
          }
          if (sectionId === "puntos") {
            const config = activePointsRate?.[0]
            if (config?.pesos_por_punto) {
              const pesos = Number(config.pesos_por_punto)
              content += `\n\nConfiguración actual de la tienda:\n• Por cada ${formatPrice(pesos)} gastados en tu compra obtienes 1 punto.\n• Ejemplo: en una compra de ${formatPrice(pesos * 5)} ganas 5 puntos.`
            } else {
              content += "\n\nNo hay configuración de puntos activa en este momento."
            }
          }
          addBotMessage(content)
          showSubmenu(sectionId)
        } else {
          addBotMessage(INVALID_OPTION_MESSAGE + "\n\n" + getMainMenuText())
        }
        return
      }
      addBotMessage(INVALID_OPTION_MESSAGE + "\n\n" + getMainMenuText())
      return
    }

    if (menuState === "submenu") {
      if (option !== null && option === 1) {
        addBotMessage(WELCOME_MESSAGE)
        setMenuState("main")
        setSubmenuFrom(null)
        return
      }
      if (option !== null && option === 2) {
        addBotMessage(GOODBYE_MESSAGE)
        setTimeout(handleClose, 800)
        return
      }
      addBotMessage(INVALID_OPTION_MESSAGE + "\n\n" + getSubmenuText())
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gray-900 dark:bg-gray-950 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center z-50 border border-gray-700 dark:border-gray-800"
        aria-label="Abrir asistente"
      >
        <Image src="/carrito.svg" alt="Asistente" width={32} height={32} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-[400px] h-[600px] shadow-2xl bg-card flex flex-col overflow-hidden rounded-2xl">
        <div className="bg-gray-900 dark:bg-gray-950 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gray-800 dark:bg-gray-800 rounded-full flex items-center justify-center ring-2 ring-gray-600 dark:ring-gray-700 overflow-hidden">
              <Image src="/carrito.svg" alt="" width={24} height={24} />
            </div>
            <div>
              <h3 className="font-semibold text-base">Información legal y comercial</h3>
              <p className="text-xs text-gray-300 dark:text-gray-400">Asistente</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-gray-700 dark:hover:bg-gray-800 rounded-full transition-colors"
            onClick={handleClose}
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden bg-background min-h-0 bg-card">
          <ScrollArea className="h-full bg-card">
            <div ref={scrollRef} className="p-5 space-y-4 max-h-[calc(600px-180px)] overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {message.role === "user" ? (
                    <Avatar className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-primary to-primary/80 ring-2 ring-background">
                      <AvatarFallback className="text-xs font-semibold text-primary-foreground">TÚ</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-800 dark:bg-gray-800 flex items-center justify-center ring-2 ring-border overflow-hidden">
                      <Image src="/carrito.svg" alt="" width={20} height={20} />
                    </div>
                  )}
                  <div className={`flex-1 min-w-0 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground border border-border"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 bg-card flex-shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Escribe el número de la opción..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 h-10 text-sm bg-background border-border focus-visible:ring-primary/20 rounded-xl"
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
