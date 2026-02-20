'use client'

import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui'
import { Button } from '@/components/ui'
import { ScrollArea } from '@/components/ui'
import { Input } from '@/components/ui'
import { IconSend, IconRobot, IconUser, IconTrash } from '@tabler/icons-react'
import { Streamdown } from 'streamdown'
import { aiService } from '@/services/ai.service'
import { PRODUCT_KEYS } from '@/hooks/use-products'

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
  const scrollRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (open && messages.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages])

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

  const handleClearChat = () => {
    if (loading) return
    setMessages([])
    setError(null)
    setStreamingMessageId(null)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 pr-12 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <SheetTitle className="flex items-center gap-2">
                <IconRobot className="h-5 w-5" />
                Asistente de administración
              </SheetTitle>
              <SheetDescription>
                Órdenes pendientes, recientes, productos más vendidos, resumen de ventas, resumen general o alertas de stock.
              </SheetDescription>
            </div>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                disabled={loading}
                title="Borrar chat"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                Por ejemplo: órdenes pendientes, órdenes recientes, productos más vendidos, resumen de ventas, cómo va la tienda o alertas.
              </p>
            )}
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
                      <IconRobot className="h-4 w-4 text-primary" />
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
                  <IconRobot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <span className="text-sm text-muted-foreground animate-pulse">
                    Pensando...
                  </span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={loading || !aiEnabled}
              maxLength={1000}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim() || !aiEnabled}>
              <IconSend className="h-4 w-4" />
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}
