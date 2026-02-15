"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui"
import { Button } from "@/components/ui"
import { get } from "@/utils/apiWrapper"
import { getProductImageUrl } from "@/utils/image-helpers"
import type { ProductFiltered, ProductFilterResponse } from "@/types/product"
import Image from "next/image"

interface ProductSearchBarProps {
  placeholder?: string
  className?: string
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  placeholder = "Buscar productos...",
  className = "",
}) => {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<ProductFiltered[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showNoResultsMessage, setShowNoResultsMessage] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce para buscar productos
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      setIsOpen(false)
      setShowNoResultsMessage(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setShowNoResultsMessage(false)
      try {
        const response = await get<ProductFilterResponse>('/products/search', {
          params: { q: query.trim(), limit: 5 }
        })
        const products = response?.products || []
        setSuggestions(products)
        setIsOpen(products.length > 0)
      } catch (error) {
        console.error("❌ Error buscando productos:", error)
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms de debounce

    return () => clearTimeout(timeoutId)
  }, [query])

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowNoResultsMessage(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleProductClick = (product: ProductFiltered) => {
    const productPath = `/products/${product.slug ?? product.id}`
    router.push(productPath)
    setQuery("")
    setSuggestions([])
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setIsLoading(true)
    setShowNoResultsMessage(false)
    try {
      const response = await get<ProductFilterResponse>('/products/search', {
        params: { q: trimmed, limit: 5 }
      })
      const products = response?.products || []
      if (products.length === 0) {
        setSuggestions([])
        setShowNoResultsMessage(true)
        setIsOpen(true)
      } else {
        router.push(`/products?q=${encodeURIComponent(trimmed)}`)
        setQuery("")
        setSuggestions([])
        setIsOpen(false)
      }
    } catch {
      setSuggestions([])
      setShowNoResultsMessage(true)
      setIsOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      handleProductClick(suggestions[selectedIndex])
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }

  return (
    <div ref={searchRef} className={`relative flex-1 max-w-full sm:max-w-md ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(-1)
            setShowNoResultsMessage(false)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm transition-colors duration-300"
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-300"
          disabled={isLoading}
          aria-label="Buscar productos"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Mensaje "no existe" o dropdown de sugerencias */}
      {isOpen && (
        <div className="absolute z-9999 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="py-1">
            {showNoResultsMessage ? (
              <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                Este producto no existe.
              </p>
            ) : (
              suggestions.map((product, index) => {
              const imageUrl = getProductImageUrl(product.image_url)
              return (
                <button
                  key={product.slug ?? String(product.id)}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    selectedIndex === index ? "bg-gray-100 dark:bg-gray-700" : ""
                  }`}
                >
                  <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {product.name}
                    </p>
                    {product.nom_marca && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {product.nom_marca}
                      </p>
                    )}
                    {product.price_min != null && (
                      <p className="text-sm font-semibold text-primary mt-0.5">
                        ${Number(product.price_min).toLocaleString("es-CO")}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductSearchBar
