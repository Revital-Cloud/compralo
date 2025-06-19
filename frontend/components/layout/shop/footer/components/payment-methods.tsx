"use client"

import * as React from "react"

interface PaymentMethod {
  name: string
  color: string
  letter: string
}

interface PaymentMethodsProps {
  methods?: PaymentMethod[]
}

const defaultPaymentMethods: PaymentMethod[] = [
  { name: "Visa", color: "bg-blue-600", letter: "V" },
  { name: "Mastercard", color: "bg-red-600", letter: "M" },
  { name: "American Express", color: "bg-blue-800", letter: "A" },
  { name: "PayPal", color: "bg-yellow-500", letter: "P" },
  { name: "Google Pay", color: "bg-green-600", letter: "G" }
]

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ methods = defaultPaymentMethods }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 order-1 lg:order-2">
      <span className="text-sm font-medium text-gray-300 dark:text-gray-400">Métodos de pago:</span>
      <div className="flex gap-2">
        {methods.map((method, index) => (
          <div
            key={index}
            className={`w-10 h-6 ${method.color} rounded text-xs flex items-center justify-center text-white font-bold`}
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