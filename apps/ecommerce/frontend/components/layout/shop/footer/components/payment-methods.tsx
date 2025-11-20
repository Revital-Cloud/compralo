"use client"

import * as React from "react"

interface PaymentMethod {
  name: string
  color: string
  letter: string
}

interface PaymentMethodsProps {
  methods?: Omit<PaymentMethod, 'color'>[]
}

const defaultPaymentMethods: Omit<PaymentMethod, 'color'>[] = [
  { name: "Visa", letter: "V" },
  { name: "Mastercard", letter: "M" },
  { name: "American Express", letter: "A" },
  { name: "PayPal", letter: "P" },
  { name: "Google Pay", letter: "G" }
]

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ methods = defaultPaymentMethods }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 order-1 lg:order-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">Métodos de pago:</span>
      <div className="flex gap-2">
        {methods.map((method, index) => (
          <div
            key={index}
            className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded text-xs flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold transition-colors duration-300"
            title={method.name}
          >
            {method.letter}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PaymentMethods 