"use client"

import * as React from "react"
import { ShoppingCart } from "lucide-react"
import { Button, Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui"

interface CartButtonProps {
  count: number
  onClick?: () => void
}

const CartButton: React.FC<CartButtonProps> = ({ count, onClick }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="relative p-2 hover:bg-muted"
        >
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Carrito de compras ({count} {count === 1 ? 'producto' : 'productos'})</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export default CartButton 