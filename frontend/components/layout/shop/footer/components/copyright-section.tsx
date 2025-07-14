"use client"

import * as React from "react"

interface CopyrightSectionProps {
  companyName?: string
  customMessage?: string
}

const CopyrightSection: React.FC<CopyrightSectionProps> = ({ 
  companyName = "Brillo Rosa",
  customMessage = "Hecho por Synkro"
}) => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="text-center text-sm">
      <p className="leading-relaxed text-secondary-foreground/80">
        &copy; {currentYear} {companyName}. Todos los derechos reservados.
        <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">{customMessage}</span>
      </p>
    </div>
  )
}

export default CopyrightSection 