'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui"
import { IconDownload, IconPlus, IconUpload } from '@tabler/icons-react'

interface CatalogHeaderProps {
  title: string
  description?: string
  createUrl?: string
  createLabel?: string
  onExport?: () => void
  onImportClick?: () => void
  onCreateClick?: () => void
  showImportButton?: boolean
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  title,
  description,
  createUrl,
  createLabel,
  onExport,
  onImportClick,
  onCreateClick,
  showImportButton = true,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end sm:gap-3">
        {onExport && (
          <Button variant="outline" onClick={onExport} className="min-w-0 flex-1 sm:flex-none">
            <IconDownload className="h-4 w-4 mr-2" />
            <span className="truncate">Exportar</span>
          </Button>
        )}

        {showImportButton && (
          <Button variant="outline" onClick={onImportClick} className="min-w-0 flex-1 sm:flex-none">
            <IconUpload className="h-4 w-4 mr-2" />
            <span className="truncate">Importar</span>
          </Button>
        )}

        {(onCreateClick || createUrl) && createLabel && (
          onCreateClick ? (
            <Button className="min-w-0 flex-1 bg-[#fec806] text-black hover:bg-[#e6b800] sm:flex-none" onClick={onCreateClick}>
              <IconPlus className="h-4 w-4 mr-2" />
              <span className="truncate">{createLabel}</span>
            </Button>
          ) : (
            createUrl && (
              <Link href={createUrl} className="min-w-0 flex-1 sm:flex-none">
                <Button className="w-full bg-[#fec806] text-black hover:bg-[#e6b800]">
                  <IconPlus className="h-4 w-4 mr-2" />
                  <span className="truncate">{createLabel}</span>
                </Button>
              </Link>
            )
          )
        )}
      </div>
    </div>
  )
}


