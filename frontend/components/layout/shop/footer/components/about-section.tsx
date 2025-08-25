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
    email: "contacto@compralo.com",
    address: "123 Calle Principal, Ciudad"
  }
}) => {
  return (
    <div className="space-y-4 sm:col-span-2 lg:col-span-1">
      <h3 className="text-[#ec2538] dark:text-red-400 text-lg font-semibold transition-colors duration-300">{title}</h3>
      <p className="text-sm leading-relaxed pr-0 sm:pr-4 text-gray-600 dark:text-gray-300 transition-colors duration-300">
        {description}
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300">
            <Phone className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
          </div>
          <span className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{contact.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300">
            <Mail className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
          </div>
          <span className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{contact.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300">
            <MapPin className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
          </div>
          <span className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{contact.address}</span>
        </div>
      </div>
    </div>
  )
}

export default AboutSection 