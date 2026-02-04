"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"
import { Input } from "@/components/ui"
import { X, Send } from "lucide-react"
import { INFORMATIVE_SECTIONS } from "./chatbot-informative-content"
import discountService from "@/services/discount.service"
import type { Discount } from "@/types/discount"

// --- Tipos y constantes ---

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  sectionId?: string
}

type MenuState = "main" | { kind: "after_section"; sectionId: string }

const MAIN_MENU_OPTIONS = [
  { value: "1", label: "Términos y condiciones", sectionId: "terminos" },
  { value: "2", label: "Datos personales y transacciones", sectionId: "datos-personales" },
  { value: "3", label: "Sistema de puntos", sectionId: "puntos" },
  { value: "4", label: "Descuentos y promociones", sectionId: "descuentos" },
  { value: "5", label: "Garantías y devoluciones", sectionId: "garantias" },
  { value: "6", label: "Salir", sectionId: undefined },
] as const

const SUBMENU_OPTIONS = [
  { value: "1", label: "Ir al menú principal" },
  { value: "2", label: "Salir" },
] as const

const WELCOME_TEXT = `Hola. Soy tu asistente de información legal y comercial. Elige una opción del menú:

1. Términos y condiciones
2. Datos personales y transacciones
3. Sistema de puntos
4. Descuentos y promociones
5. Garantías y devoluciones
6. Salir`

const SUBMENU_TEXT = `¿Qué deseas hacer?

1. Ir al menú principal
2. Salir`

const INVALID_OPTION_TEXT =
  "Esa opción no es válida. Por favor elige un número del menú."

const GOODBYE_TEXT = "Gracias por usar el asistente. ¡Hasta pronto!"

function getSectionSummary(sectionId: string): string {
  const section = INFORMATIVE_SECTIONS.find((s) => s.id === sectionId)
  if (!section) return ""
  return section.shortContent ?? section.content.split("\n")[0] ?? section.title
}

function createWelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: WELCOME_TEXT,
  }
}

export function InformativeChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => [createWelcomeMessage()])
  const [menuState, setMenuState] = useState<MenuState>("main")
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const nextIdRef = useRef(0)

  useEffect(() => {
    if (!isOpen) return
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
  }, [isOpen])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const addMessage = (role: Message["role"], content: string, sectionId?: string) => {
    const id = `msg-${++nextIdRef.current}`
    setMessages((prev) => [...prev, { id, role, content, sectionId }])
  }

  const handleClose = () => {
    setIsOpen(false)
    setMessages([createWelcomeMessage()])
    setMenuState("main")
    setInput("")
  }

  const sendChoice = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    if (menuState === "main") {
      const num = trimmed === "6" ? "6" : trimmed
      if (num === "6") {
        addMessage("user", "6")
        addMessage("assistant", GOODBYE_TEXT)
        setTimeout(handleClose, 800)
        return
      }
      const opt = MAIN_MENU_OPTIONS.find((o) => o.value === num && o.sectionId)
      if (!opt) {
        addMessage("user", trimmed)
        addMessage("assistant", INVALID_OPTION_TEXT + "\n\n" + WELCOME_TEXT)
        return
      }
      addMessage("user", trimmed)
      const summary = getSectionSummary(opt.sectionId!)
      addMessage("assistant", summary, opt.sectionId)
      addMessage("assistant", SUBMENU_TEXT)
      setMenuState({ kind: "after_section", sectionId: opt.sectionId! })
      return
    }

    if (menuState.kind === "after_section") {
      if (trimmed === "1") {
        addMessage("user", trimmed)
        addMessage("assistant", WELCOME_TEXT)
        setMenuState("main")
        return
      }
      if (trimmed === "2") {
        addMessage("user", trimmed)
        addMessage("assistant", GOODBYE_TEXT)
        setTimeout(handleClose, 800)
        return
      }
      addMessage("user", trimmed)
      addMessage("assistant", INVALID_OPTION_TEXT + "\n\n" + SUBMENU_TEXT)
    }
  }

  const handleSend = () => {
    const text = input.trim()
    setInput("")
    if (!text) return
    sendChoice(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#1E222D] text-primary-foreground rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group overflow-hidden animate-chat-float"
        aria-label="Abrir información legal y comercial"
      >
        <img
          src="/carrito.svg"
          alt="Carrito"
          className="w-10 h-10 object-contain transition-transform group-hover:scale-110"
        />
      </button>
    )
  }

  return (
    <div
      ref={panelRef}
      className="fixed bottom-6 right-6 z-50 w-[min(400px,calc(100vw-2rem))] max-h-[min(600px,80vh)] flex flex-col"
      role="dialog"
      aria-label="Información legal y comercial"
    >
      <Card className="flex flex-col max-h-[min(600px,80vh)] shadow-2xl border bg-card/95 backdrop-blur-sm overflow-hidden">
        <div className="flex-shrink-0 px-4 py-3 border-b bg-gradient-to-r from-muted to-muted/80 rounded-t-xl flex items-center justify-between gap-3">
          <div className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-[#1E222D] border-2 border-primary/40 flex items-center justify-center overflow-hidden">
            <img src="/carrito.svg" alt="Carrito" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm">Información legal y comercial</h2>
            <p className="text-xs text-muted-foreground truncate">
              Asistente por menús. Elige una opción en cada paso.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3"
          >
            <div className="space-y-4 pb-4 pr-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
                    {msg.sectionId === "descuentos" && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <DescuentosActivosInline />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 px-4 pb-4 flex gap-2">
            <Input
              type="text"
              placeholder="Escribe el número de opción o tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              aria-label="Mensaje"
            />
            <Button type="button" size="icon" onClick={handleSend} aria-label="Enviar">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DescuentosActivosInline() {
  const { data: discounts, isLoading, isError } = useQuery<Discount[]>({
    queryKey: ["discounts", "active"],
    queryFn: () => discountService.getActiveDiscounts(50),
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Cargando descuentos activos...</p>
  }
  if (isError || !discounts?.length) {
    return (
      <p className="text-xs text-muted-foreground">
        No hay descuentos activos ahora.{" "}
        <Link href="/discounts" className="text-primary underline underline-offset-2">
          Ver descuentos
        </Link>
      </p>
    )
  }
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Descuentos vigentes:</p>
      <ul className="text-xs text-muted-foreground space-y-0.5 list-none">
        {discounts.slice(0, 5).map((d) => (
          <li key={d.id_descuento}>
            {d.nom_descuento}
            {d.tipo_calculo ? ` — ${d.val_porce_descuento}%` : ` — $${Number(d.val_monto_descuento).toLocaleString("es-CO")}`}
          </li>
        ))}
      </ul>
      {discounts.length > 5 && (
        <p className="text-xs pt-0.5">
          <Link href="/discounts" className="text-primary underline underline-offset-2">
            Ver todos los descuentos
          </Link>
        </p>
      )}
    </div>
  )
}
