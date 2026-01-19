import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'spinner' | 'dots' | 'pulse'
  text?: string
  className?: string
  fullScreen?: boolean
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'default',
  text,
  className,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const renderSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
      {text && (
        <p className={cn('text-gray-600 dark:text-gray-400', textSizes[size])}>
          {text}
        </p>
      )}
    </div>
  )

  const renderDots = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-blue-600 rounded-full animate-pulse',
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
      {text && (
        <p className={cn('text-gray-600 dark:text-gray-400', textSizes[size])}>
          {text}
        </p>
      )}
    </div>
  )

  const renderPulse = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={cn(
        'bg-blue-600 rounded-full animate-pulse',
        size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : size === 'lg' ? 'w-16 h-16' : 'w-20 h-20'
      )} />
      {text && (
        <p className={cn('text-gray-600 dark:text-gray-400', textSizes[size])}>
          {text}
        </p>
      )}
    </div>
  )

  const renderContent = () => {
    switch (variant) {
      case 'spinner':
        return renderSpinner()
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      default:
        return renderSpinner()
    }
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        {renderContent()}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      {renderContent()}
    </div>
  )
}

export default Loading
