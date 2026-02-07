"use client";

import { motion } from "framer-motion";
import { integrationConfig } from "@/content/config";
import { Badge } from "@/components/ui/badge";

interface IntegrationsShowcaseProps {
  className?: string;
}

export function IntegrationsShowcase({ className }: IntegrationsShowcaseProps) {
  return (
    <div className={`py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-lg font-semibold text-gray-400 mb-8">
            Integraciones nativas con las principales pasarelas de pago
          </h2>

          {/* Payment Gateways */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {integrationConfig.paymentGateways.map((gateway, index) => (
              <motion.div
                key={gateway.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
              >
                {/* Placeholder for logo - replace with actual image when available */}
                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-gray-400">
                    {gateway.name.charAt(0)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {gateway.name}
                </h3>

                <p className="text-sm text-gray-400 mb-4">
                  {gateway.description}
                </p>

                <div className="flex flex-wrap gap-2 justify-center">
                  {gateway.methods.map(method => (
                    <Badge
                      key={method}
                      variant="secondary"
                      className="text-xs bg-gray-800 text-gray-300"
                    >
                      {method}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Shipping Providers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-md font-semibold text-gray-400 mb-6">
              También integramos con empresas de envío
            </h3>

            <div className="flex justify-center items-center gap-8 flex-wrap">
              {integrationConfig.shippingProviders.map((provider, index) => (
                <motion.div
                  key={provider.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                >
                  {/* Placeholder for logo - replace with actual image when available */}
                  <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-400">
                      {provider.name.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-sm text-gray-500 mt-8"
          >
            Y muchas más integraciones disponibles en nuestra plataforma
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
