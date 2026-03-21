import { Button } from "@/components/ui"
import { Search, FilterX, Package, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  EmptyProductsIllustration, 
  SearchIllustration, 
  ShoppingBagIllustration, 
  HeartIllustration,
  FilterIllustration,
  ErrorIllustration
} from "./illustrations"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {/* Icon Container */}
      <div className="mb-6 p-4 rounded-full bg-gray-100 dark:bg-gray-800">
        {icon || <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />}
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {action && (
              <Button onClick={action.onClick} className="w-full sm:w-auto">
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                variant="outline" 
                onClick={secondaryAction.onClick}
                className="w-full sm:w-auto"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Componentes específicos para diferentes estados vacíos
export const EmptyProductsState = ({ 
  hasFilters = false, 
  onClearFilters 
}: { 
  hasFilters?: boolean
  onClearFilters?: () => void 
}) => {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<FilterIllustration className="w-16 h-16" />}
        title="No se encontraron productos"
        description="No hay productos que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda o limpiar los filtros para ver todos los productos disponibles."
        action={{
          label: "Limpiar filtros",
          onClick: onClearFilters || (() => {})
        }}
        secondaryAction={{
          label: "Ver todos los productos",
          onClick: () => window.location.href = '/products'
        }}
      />
    )
  }

  return (
    <EmptyState
      icon={<EmptyProductsIllustration className="w-20 h-20" />}
      title="No hay productos disponibles"
      description="Por el momento no tenemos productos en nuestro catálogo. Estamos trabajando para agregar nuevos productos pronto. ¡Vuelve a visitarnos más tarde!"
      action={{
        label: "Explorar categorías",
        onClick: () => window.location.href = '/categories'
        }}
    />
  )
}

export const EmptySearchState = ({ 
  searchTerm,
  onClearSearch 
}: { 
  searchTerm?: string
  onClearSearch?: () => void 
}) => {
  return (
    <EmptyState
      icon={<SearchIllustration className="w-16 h-16" />}
      title={`No se encontraron resultados para "${searchTerm}"`}
      description="Intenta con términos de búsqueda diferentes o más generales. También puedes explorar nuestras categorías para encontrar lo que buscas."
      action={{
        label: "Limpiar búsqueda",
        onClick: onClearSearch || (() => {})
      }}
      secondaryAction={{
        label: "Ver todos los productos",
        onClick: () => window.location.href = '/products'
      }}
    />
  )
}

export const EmptyFavoritesState = () => {
  return (
    <EmptyState
      icon={<HeartIllustration className="w-16 h-16" />}
      title="No tienes productos favoritos"
      description="Los productos que marques como favoritos aparecerán aquí. ¡Explora nuestro catálogo y encuentra productos que te encanten!"
      action={{
        label: "Explorar productos",
        onClick: () => window.location.href = '/products'
      }}
    />
  )
}

export const EmptyCartState = () => {
  return (
    <EmptyState
      icon={<ShoppingBagIllustration className="w-16 h-16" />}
      title="Tu carrito está vacío"
      description="Agrega algunos productos a tu carrito para comenzar tu compra. ¡Tenemos muchas opciones increíbles esperándote!"
      action={{
        label: "Comenzar a comprar",
        onClick: () => window.location.href = '/products'
      }}
    />
  )
}
