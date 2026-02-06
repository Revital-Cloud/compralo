"use client"

import * as React from "react"
import { PaymentMethodsRow } from "@/components/payment/payment-card-brands"

const PaymentMethods: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 order-1 lg:order-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">Métodos de pago:</span>
      <PaymentMethodsRow />
    </div>
  )
}

export default PaymentMethods 