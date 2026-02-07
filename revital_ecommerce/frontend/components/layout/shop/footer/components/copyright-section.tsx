"use client"

import * as React from "react"

interface CopyrightSectionProps {
  companyName?: string
  customMessage?: string
}

const CopyrightSection: React.FC<CopyrightSectionProps> = ({ 
  companyName = "Compralo",
  customMessage = "Hecho para tu negocio con Revital"
}) => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="text-center text-sm">
      <p className="leading-relaxed text-gray-600 dark:text-gray-400 transition-colors duration-300">
        &copy; {currentYear} {companyName}. Todos los derechos reservados.
        <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">{customMessage}</span>
      </p>
    </div>
  )
}

export default CopyrightSection 