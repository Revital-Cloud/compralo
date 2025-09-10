import { cn } from "@/lib/utils"

interface IllustrationProps {
  className?: string
}

export const EmptyBoxIllustration = ({ className }: IllustrationProps) => (
  <svg
    className={cn("w-24 h-24 text-gray-300 dark:text-gray-600", className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
)

export const SearchIllustration = ({ className }: IllustrationProps) => (
  <svg
    className={cn("w-24 h-24 text-orange-300 dark:text-orange-600", className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="11" cy="11" r="8" strokeWidth={1.5} />
    <path d="m21 21-4.35-4.35" strokeWidth={1.5} />
  </svg>
)

export const ShoppingBagIllustration = ({ className }: IllustrationProps) => (
  <svg
    className={cn("w-24 h-24 text-blue-300 dark:text-blue-600", className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"
    />
  </svg>
)

export const HeartIllustration = ({ className }: IllustrationProps) => (
  <svg
    className={cn("w-24 h-24 text-pink-300 dark:text-pink-600", className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
)

export const FilterIllustration = ({ className }: IllustrationProps) => (
  <svg
    className={cn("w-24 h-24 text-purple-300 dark:text-purple-600", className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
)

export const ErrorIllustration = ({ className }: IllustrationProps) => (
  <svg
    className={cn("w-24 h-24 text-red-300 dark:text-red-600", className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
)

export const LoadingIllustration = ({ className }: IllustrationProps) => (
  <svg
    className={cn("w-24 h-24 text-blue-300 dark:text-blue-600 animate-spin", className)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      strokeWidth={1.5}
      strokeDasharray="31.416"
      strokeDashoffset="31.416"
      className="animate-dash"
    />
  </svg>
)

// Ilustración más elaborada para productos vacíos
export const EmptyProductsIllustration = ({ className }: IllustrationProps) => (
  <div className={cn("relative w-32 h-32", className)}>
    {/* Caja principal */}
    <svg
      className="absolute inset-0 w-full h-full text-gray-300 dark:text-gray-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
    
    {/* Líneas de búsqueda */}
    <svg
      className="absolute top-4 right-4 w-8 h-8 text-gray-200 dark:text-gray-700"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="6" strokeWidth={1} />
      <path d="m21 21-4.35-4.35" strokeWidth={1} />
    </svg>
    
    {/* Puntos de productos */}
    <div className="absolute bottom-2 left-2 flex space-x-1">
      <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
  </div>
)
