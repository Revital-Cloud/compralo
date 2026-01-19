"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, CreditCard, Wallet, Banknote, Coins, Check } from "lucide-react";
import { formatPrice } from "@/utils/format-price";

interface WompiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onSelectPaymentMethod: (method: "card" | "pse" | "cash" | "credit") => void;
}

export function WompiPaymentModal({
  isOpen,
  onClose,
  total,
  onSelectPaymentMethod,
}: WompiPaymentModalProps) {
  const paymentMethods = [
    {
      id: "card",
      title: "Paga con tus tarjetas Débito y Crédito",
      icon: CreditCard,
      description: "VISA, Mastercard, American Express",
    },
    {
      id: "pse",
      title: "Transfiere con tu cuenta",
      icon: Wallet,
      description: "PSE, Nequi",
      logos: ["PSE", "N"],
    },
    {
      id: "cash",
      title: "Paga en efectivo en Corresponsal Bancario",
      icon: Banknote,
      description: "Bancolombia",
    },
    {
      id: "credit",
      title: "Paga con crédito",
      icon: Coins,
      description: "Crédito disponible",
      isNew: true,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl w-full p-0 bg-gray-800 dark:bg-gray-900 border-gray-700"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Elige un método de pago</DialogTitle>
        </DialogHeader>
        <div className="relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-700 gap-4">
            <div className="flex items-center gap-4">
              {/* Logo Phonetify - placeholder, reemplazar con logo real */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-sm">P</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm">
                    Pago a Phonetify
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-green-400 font-bold text-lg">
                      {formatPrice(total)} COP
                    </span>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <span className="text-xs">?</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <h2 className="text-white font-semibold text-base sm:text-lg">
                Elige un método de pago
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Payment Methods Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => onSelectPaymentMethod(method.id as any)}
                    className="relative p-6 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200 flex flex-col items-center justify-center gap-4 text-center min-h-[200px] group"
                  >
                    {method.isNew && (
                      <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                        NUEVO
                      </span>
                    )}
                    <div className="w-20 h-20 bg-gray-600 group-hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-white font-medium text-sm leading-tight">
                        {method.title}
                      </span>
                      {method.logos && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          {method.logos.map((logo, idx) => (
                            <div
                              key={idx}
                              className="w-10 h-10 bg-white rounded flex items-center justify-center text-xs font-bold text-gray-900 border border-gray-200"
                            >
                              {logo}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between bg-gray-900">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-400" />
              <span className="text-gray-300 text-sm font-medium">
                PAGOS SEGUROS POR W Wompi
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Logo Grupo Cibest - placeholder */}
              <div className="w-24 h-10 bg-white rounded flex items-center justify-center">
                <span className="text-gray-900 font-bold text-xs">
                  Grupo Cibest
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

