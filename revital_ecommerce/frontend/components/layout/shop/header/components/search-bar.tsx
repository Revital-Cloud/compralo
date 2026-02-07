"use client"

import * as React from "react"
import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Buscar productos..." }) => {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-full sm:max-w-md">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm transition-colors duration-300"
      />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-300"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
}

export default SearchBar 