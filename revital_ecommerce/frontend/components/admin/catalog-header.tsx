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
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>

      <div className="flex gap-3">
        {onExport && (
          <Button variant="outline" onClick={onExport}>
            <IconDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}

        {showImportButton && (
          <Button variant="outline" onClick={onImportClick}>
            <IconUpload className="h-4 w-4 mr-2" />
            Importar
          </Button>
        )}

        {(onCreateClick || createUrl) && createLabel && (
          onCreateClick ? (
            <Button className="bg-[#fec806] hover:bg-[#e6b800] text-black" onClick={onCreateClick}>
              <IconPlus className="h-4 w-4 mr-2" />
              {createLabel}
            </Button>
          ) : (
            createUrl && (
              <Link href={createUrl}>
                <Button className="bg-[#fec806] hover:bg-[#e6b800] text-black">
                  <IconPlus className="h-4 w-4 mr-2" />
                  {createLabel}
                </Button>
              </Link>
            )
          )
        )}
      </div>
    </div>
  )
}


