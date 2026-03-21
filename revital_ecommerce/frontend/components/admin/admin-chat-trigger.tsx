'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { IconSparkles } from '@tabler/icons-react'
import { AiChatPanel } from './ai-chat-panel'
import { aiService } from '@/services/ai.service'

export function AdminChatTrigger() {
  const [open, setOpen] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)

  useEffect(() => {
    aiService
      .getHealth()
      .then((res) => setAiEnabled(res.enabled))
      .catch(() => setAiEnabled(false))
  }, [])

  if (!aiEnabled) return null

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Abrir asistente de IA"
      >
        <IconSparkles className="h-5 w-5" />
      </Button>
      <AiChatPanel open={open} onOpenChange={setOpen} aiEnabled={aiEnabled} />
    </>
  )
}
