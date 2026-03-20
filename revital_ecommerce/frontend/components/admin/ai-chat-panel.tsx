'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui'
import { Button } from '@/components/ui'
import { Textarea } from '@/components/ui'
import { IconSend, IconSparkles, IconUser } from '@tabler/icons-react'
import { Streamdown } from 'streamdown'
import { aiService } from '@/services/ai.service'
import { PRODUCT_KEYS } from '@/hooks/use-products'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AiChatPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  aiEnabled: boolean
}

export function AiChatPanel({ open, onOpenChange, aiEnabled }: AiChatPanelProps) {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesInnerRef = useRef<HTMLDivElement>(null)
  const prevOpenRef = useRef(false)
  const prevLoadingRef = useRef(false)
  const loadingRef = useRef(loading)
  loadingRef.current = loading

  /**
   * Invalida queries de React Query basado en las entidades afectadas por acciones del AI
   */
  const invalidateAffectedQueries = (affectedEntities: string[]) => {
    affectedEntities.forEach((entity) => {
      switch (entity) {
        case 'brands':
          queryClient.invalidateQueries({ queryKey: ['brands'] })
          break
        case 'providers':
          queryClient.invalidateQueries({ queryKey: ['providers'] })
          break
        case 'categories':
          queryClient.invalidateQueries({ queryKey: ['categories'] })
          break
        case 'discounts':
          queryClient.invalidateQueries({ queryKey: ['discounts'] })
          break
        case 'products':
          queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
          break
        case 'filter-options':
          queryClient.invalidateQueries({ queryKey: ['filter-options'] })
          break
        default:
          // Invalidar todas las queries si no reconocemos la entidad
          console.warn(`Entidad desconocida para invalidar: ${entity}`)
      }
    })
  }

  const scrollChatToBottom = useCallback((mode: 'always' | 'if-near-bottom' = 'always') => {
    const el = scrollAreaRef.current
    if (!el) return
    const threshold = 120
    const doScroll = () => {
      if (mode === 'if-near-bottom') {
        const dist = el.scrollHeight - el.scrollTop - el.clientHeight
        if (dist > threshold) return
      }
      el.scrollTop = el.scrollHeight
    }
    // Nativo + varios frames: Streamdown/prose puede medir altura tras el paint.
    doScroll()
    requestAnimationFrame(() => {
      doScroll()
      requestAnimationFrame(doScroll)
    })
  }, [])

  // Cuando el markdown/streaming cambia el alto real, vuelve a anclar al final.
  useEffect(() => {
    if (!open) return
    const inner = messagesInnerRef.current
    const scrollEl = scrollAreaRef.current
    if (!inner || !scrollEl) return

    const ro = new ResizeObserver(() => {
      scrollChatToBottom(loadingRef.current ? 'always' : 'if-near-bottom')
    })
    ro.observe(inner)
    return () => ro.disconnect()
  }, [open, scrollChatToBottom])

  // Sin scroll mientras loading (respuesta en curso). Al terminar, un scroll al final; al abrir, al final.
  useLayoutEffect(() => {
    if (!open) {
      prevOpenRef.current = false
      prevLoadingRef.current = false
      return
    }
    const justOpened = !prevOpenRef.current
    prevOpenRef.current = true

    if (loading) {
      // Un solo scroll al empezar la petición (tu mensaje nuevo). Si hay streaming real,
      // seguimos el final durante todo el streaming (UX: no quedarse "atrás").
      if (!prevLoadingRef.current) {
        scrollChatToBottom('always')
      } else if (streamingMessageId) {
        scrollChatToBottom('always')
      }
      prevLoadingRef.current = true
      return
    }

    const finishedResponse = prevLoadingRef.current
    prevLoadingRef.current = false

    if (justOpened || finishedResponse) {
      scrollChatToBottom('always')
      return
    }

    scrollChatToBottom('if-near-bottom')
  }, [open, messages, loading, streamingMessageId, scrollChatToBottom])

  // Tras la animación del diálogo: corregir scroll solo si no hay respuesta en curso.
  useEffect(() => {
    if (!open) return
    const run = () => {
      if (loadingRef.current) return
      scrollChatToBottom('always')
    }
    const raf = requestAnimationFrame(run)
    const t1 = window.setTimeout(run, 200)
    const t2 = window.setTimeout(run, 420)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [open, scrollChatToBottom])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    const form = e.currentTarget.form
    if (!form || loading || !input.trim() || !aiEnabled) return
    form.requestSubmit()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading || !aiEnabled) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    }
    const assistantId = `assistant-${Date.now()}`
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
    }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setLoading(true)
    setError(null)
    setStreamingMessageId(assistantId)

    await aiService.chatStream(text, {
      onChunk(accumulatedText) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: accumulatedText } : m))
        )
      },
      onDone() {
        setLoading(false)
        setStreamingMessageId(null)
        // Garantiza que al terminar el modelo se vea el mensaje completo.
        scrollChatToBottom('always')
      },
      onError(err) {
        setLoading(false)
        setStreamingMessageId(null)
        const msg = err.message?.includes('503') || err.message?.toLowerCase().includes('no disponible')
          ? 'IA no disponible'
          : err.message || 'Error al enviar el mensaje'
        setError(msg)
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: msg } : m))
        )
      },
      onMetadata(metadata) {
        // Invalidar queries automáticamente cuando el AI ejecuta acciones
        if (metadata.affected_entities && metadata.affected_entities.length > 0) {
          invalidateAffectedQueries(metadata.affected_entities)
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/35 backdrop-blur-[2px]"
        className={cn(
          'gap-0 p-0 !top-auto !left-auto !right-4 !bottom-4 !translate-x-0 !translate-y-0 sm:!right-6 sm:!bottom-6',
          'flex h-[min(100dvh-5rem,36rem)] w-[min(100vw-2rem,26rem)] max-w-none flex-col overflow-hidden rounded-2xl border shadow-2xl',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 data-[state=open]:slide-in-from-right-2 duration-200'
        )}
      >
        <DialogHeader className="space-y-0 border-b p-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <DialogTitle className="flex items-center gap-2 text-base">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <IconSparkles className="h-5 w-5 text-primary" />
                </span>
                <span className="leading-tight">Asistente de administración</span>
              </DialogTitle>
              <DialogDescription className="text-pretty text-xs text-muted-foreground sm:text-sm">
                Pregunta sobre órdenes, productos, ventas o stock de tu tienda.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={scrollAreaRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-4"
        >
          <div ref={messagesInnerRef} className="space-y-4 pb-24">
            {messages.map((msg) => {
              const isStreamingEmpty = msg.role === 'assistant' && streamingMessageId === msg.id && !msg.content
              if (isStreamingEmpty) return null
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <IconSparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown isAnimating={streamingMessageId === msg.id}>
                          {msg.content}
                        </Streamdown>
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <IconUser className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )
            })}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <IconSparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <span className="text-sm text-muted-foreground animate-pulse">
                    Pensando...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border-t bg-background/95 p-4 backdrop-blur-sm">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              name="admin-chat-message"
              autoComplete="off"
              placeholder="Escribe tu pregunta…"
              disabled={!aiEnabled}
              maxLength={1000}
              rows={1}
              aria-label="Mensaje para el asistente"
              className={cn(
                'min-h-10 max-h-32 flex-1 resize-none rounded-xl border-border/80 py-2.5 shadow-none',
                'focus-visible:border-ring focus-visible:ring-primary/30'
              )}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              disabled={loading || !input.trim() || !aiEnabled}
              aria-label="Enviar mensaje"
            >
              <IconSend className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground sm:text-xs" role="note">
            El asistente puede cometer errores. Comprueba siempre la información importante en el panel.
          </p>
          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
