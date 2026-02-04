"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"
import { ScrollArea } from "@/components/ui"
import { Bot, X, ArrowLeft, FileText, Shield, Percent, Gift, PackageCheck } from "lucide-react"
import { INFORMATIVE_SECTIONS, type InformativeSection } from "./chatbot-informative-content"
import discountService from "@/services/discount.service"
import type { Discount } from "@/types/discount"

const SECTION_ICONS: Record<string, typeof FileText> = {
  terminos: FileText,
  "datos-personales": Shield,
  descuentos: Percent,
  puntos: Gift,
  garantias: PackageCheck,
}

export function InformativeChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const selectedSection = selectedSectionId
    ? INFORMATIVE_SECTIONS.find((s) => s.id === selectedSectionId)
    : null

  useEffect(() => {
    if (!isOpen) return
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    setSelectedSectionId(null)
  }

  const handleBack = () => {
    setSelectedSectionId(null)
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-[4.25rem] bg-gradient-to-b from-muted-foreground/90 to-muted-foreground rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col items-center justify-end pb-1.5 pt-3 z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-2 border-primary/30"
        aria-label="Abrir información legal y comercial"
      >
        {/* Antena */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-2.5 bg-primary rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
        {/* Ojos */}
        <div className="flex gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-foreground/95" />
          <span className="w-2.5 h-2.5 rounded-full bg-primary-foreground/95" />
        </div>
        {/* Boca / ícono */}
        <Bot className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
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
          {/* Avatar robot */}
          <div className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-b from-muted-foreground/25 to-muted-foreground/10 border-2 border-primary/40 flex flex-col items-center justify-center gap-0.5">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-primary rounded-full" />
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <Bot className="w-5 h-5 text-primary" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm">Información legal y comercial</h2>
            <p className="text-xs text-muted-foreground truncate">
              Solo informativo. No transacciones ni datos sensibles aquí.
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
          {selectedSection ? (
            <>
              <div className="flex-shrink-0 px-4 py-2 border-b flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={handleBack}
                  aria-label="Volver al menú"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </div>
              <ScrollArea className="flex-1 min-h-0 overflow-auto px-4 py-3 [&>div]:!block">
                <div className="space-y-4 pb-4 pr-2">
                  <h3 className="font-semibold text-base">{selectedSection.title}</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {selectedSection.content}
                  </div>
                  {selectedSection.id === "descuentos" && (
                    <DescuentosActivosBlock />
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Marco legal aplicable (Colombia):</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                      {selectedSection.legalFramework.map((law) => (
                        <li key={law}>{law}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              <div className="flex-shrink-0 px-4 py-3 text-sm text-muted-foreground">
                Consulta políticas, derechos y condiciones de la plataforma. Elige una sección:
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-4 pb-4 space-y-2 pr-2">
                  {INFORMATIVE_SECTIONS.map((section) => (
                    <SectionButton
                      key={section.id}
                      section={section}
                      onClick={() => setSelectedSectionId(section.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

function DescuentosActivosBlock() {
  const { data: discounts, isLoading, isError } = useQuery<Discount[]>({
    queryKey: ["discounts", "active"],
    queryFn: () => discountService.getActiveDiscounts(50),
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando descuentos activos...</p>
    )
  }
  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        No se pudieron cargar los descuentos. Puedes ver la sección de descuentos de la tienda más abajo.
      </p>
    )
  }
  if (!discounts || discounts.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          No hay descuentos activos en este momento.
        </p>
        <p className="text-sm">
          <Link
            href="/discounts"
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            Ver sección de descuentos
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Descuentos vigentes:</p>
      <ul className="text-sm text-muted-foreground space-y-1.5 list-none">
        {discounts.map((d) => (
          <li key={d.id_descuento} className="flex flex-col gap-0.5 border-b border-border/50 pb-2 last:border-0">
            <span className="font-medium text-foreground">{d.nom_descuento}</span>
            {d.tipo_calculo ? (
              <span>{d.val_porce_descuento}% de descuento</span>
            ) : (
              <span>${Number(d.val_monto_descuento).toLocaleString("es-CO")} de descuento</span>
            )}
            {d.des_descuento && (
              <span className="text-xs opacity-90">{d.des_descuento}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm pt-1">
        <Link
          href="/discounts"
          className="text-primary underline underline-offset-2 hover:no-underline"
        >
          Ver todos los descuentos en la tienda
        </Link>
      </p>
    </div>
  )
}

function SectionButton({
  section,
  onClick,
}: {
  section: InformativeSection
  onClick: () => void
}) {
  const Icon = SECTION_ICONS[section.id] ?? FileText
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start gap-3 h-auto py-3 px-3 text-left"
      onClick={onClick}
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <span className="text-sm font-medium">{section.shortLabel}</span>
    </Button>
  )
}
