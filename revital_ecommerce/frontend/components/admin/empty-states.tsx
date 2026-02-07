'use client'

import React from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  iconPath?: string
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
  children?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  iconPath = 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  primaryAction,
  secondaryAction,
  children,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
          </svg>
        </div>
      </div>

      <div className="text-center max-w-md">
        <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{description}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {primaryAction}
          {secondaryAction}
        </div>

        {children && (
          <div className="mt-8 p-6 bg-muted/30 rounded-xl border border-border text-left">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}


