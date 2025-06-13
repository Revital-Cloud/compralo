"use client"

import * as React from "react"
import { Mail, Phone, MapPin } from "lucide-react"

interface ContactInfo {
  phone: string
  email: string
  address: string
}

interface AboutSectionProps {
  title?: string
  description?: string
  contact?: ContactInfo
}

const AboutSection: React.FC<AboutSectionProps> = ({
  title = "Acerca de nosotros",
  description = "Somos la tienda online más grande del universo. Te tenemos cubierto con nuestras colecciones exclusivas y las últimas tendencias en todos los productos que necesitas.",
  contact = {
    phone: "+1 (555) 123-4567",
    email: "contacto@synkro.com",
    address: "123 Calle Principal, Ciudad"
  }
}) => {
  return (
    <div className="space-y-4 sm:col-span-2 lg:col-span-1">
      <h3 className="text-blue-400 dark:text-blue-300 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed pr-0 sm:pr-4 text-gray-300 dark:text-gray-400">
        {description}
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="p-1.5 bg-gray-800 dark:bg-gray-700 rounded-full">
            <Phone className="h-3.5 w-3.5 text-gray-300 dark:text-gray-400" />
          </div>
          <span className="text-gray-300 dark:text-gray-400">{contact.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="p-1.5 bg-gray-800 dark:bg-gray-700 rounded-full">
            <Mail className="h-3.5 w-3.5 text-gray-300 dark:text-gray-400" />
          </div>
          <span className="text-gray-300 dark:text-gray-400">{contact.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="p-1.5 bg-gray-800 dark:bg-gray-700 rounded-full">
            <MapPin className="h-3.5 w-3.5 text-gray-300 dark:text-gray-400" />
          </div>
          <span className="text-gray-300 dark:text-gray-400">{contact.address}</span>
        </div>
      </div>
    </div>
  )
}

export default AboutSection 