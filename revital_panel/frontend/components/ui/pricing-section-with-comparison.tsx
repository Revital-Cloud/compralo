"use client";
import {
  Check,
  Minus,
  MoveRight,
  PhoneCall,
  ShoppingBag,
  Zap,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function Pricing() {
  return (
    <div
      id="pricing"
      className="w-full py-20 lg:py-40 bg-white dark:bg-revital-black text-black dark:text-white"
    >
      <div className="container mx-auto">
        <div className="flex text-center justify-center items-center gap-4 flex-col">
          <Badge variant="revital">Precios Revital</Badge>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-center font-regular dark:text-white">
              Planes Flexibles para Tu Crecimiento
            </h2>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground dark:text-gray-400 max-w-xl text-center">
              Elige el plan de Revital que mejor se adapte al tamaño y las
              necesidades de tu negocio online.
            </p>
          </div>
          <div className="grid text-left w-full grid-cols-3 lg:grid-cols-4 divide-x divide-gray-200 dark:divide-revital-green/20 pt-20">
            <div className="col-span-3 lg:col-span-1 flex items-center px-3 lg:px-6 py-4">
              <p className="text-lg font-semibold dark:text-white">
                Características Principales
              </p>
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 gap-2 flex flex-col dark:bg-revital-black border border-revital-green/10">
              <p className="text-2xl font-semibold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-revital-green" />{" "}
                Emprendedor
              </p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Ideal para quienes inician su aventura en el e-commerce y
                necesitan lo esencial para vender.
              </p>
              <p className="flex flex-col lg:flex-row lg:items-center gap-2 text-xl mt-8">
                <span className="text-4xl dark:text-white">$29</span>
                <span className="text-sm text-muted-foreground dark:text-gray-400">
                  {" "}
                  / mes
                </span>
              </p>
              <Button
                variant="revitalOutline"
                className="gap-4 mt-8"
                onClick={() => {
                  window.open(
                    "https://app.revital.com/register?plan=emprendedor",
                    "_blank"
                  );
                }}
              >
                Comenzar Ahora <MoveRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 gap-2 flex flex-col border-2 border-revital-green dark:border-revital-green rounded-lg shadow-xl dark:bg-revital-black relative">
              <Badge
                variant="revital"
                className="absolute -top-3 left-1/2 -translate-x-1/2"
              >
                Más Popular
              </Badge>
              <p className="text-2xl font-semibold flex items-center gap-2 pt-3">
                <Zap className="w-6 h-6 text-revital-green" /> Profesional
              </p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Perfecto para negocios en crecimiento que buscan más
                herramientas y personalización.
              </p>
              <p className="flex flex-col lg:flex-row lg:items-center gap-2 text-xl mt-8">
                <span className="text-4xl dark:text-white">$79</span>
                <span className="text-sm text-muted-foreground dark:text-gray-400">
                  {" "}
                  / mes
                </span>
              </p>
              <Button
                variant="revital"
                className="gap-4 mt-8"
                onClick={() => {
                  window.open(
                    "https://app.revital.com/register?plan=profesional",
                    "_blank"
                  );
                }}
              >
                Elegir Plan <MoveRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 gap-2 flex flex-col dark:bg-revital-black">
              <p className="text-2xl font-semibold flex items-center gap-2">
                <Building className="w-6 h-6 text-revital-green" /> Corporativo
              </p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Soluciones a medida para grandes empresas con volumen alto de
                ventas y requerimientos específicos.
              </p>
              <p className="flex flex-col lg:flex-row lg:items-center gap-2 text-xl mt-8">
                <span className="text-4xl dark:text-white">Custom</span>
              </p>
              <Button
                variant="revitalOutline"
                className="gap-4 mt-8"
                onClick={() => {
                  document
                    .querySelector("#contact")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Contactar Ventas <PhoneCall className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4 font-medium dark:text-white">
              Productos Ilimitados
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black">
              <Check className="w-5 h-5 text-revital-green" />
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black">
              <Check className="w-5 h-5 text-revital-green" />
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black">
              <Check className="w-5 h-5 text-revital-green" />
            </div>
            <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4 font-medium dark:text-white">
              Panel de Estadísticas
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black">
              <Check className="w-5 h-5 text-revital-green" />
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black">
              <Check className="w-5 h-5 text-revital-green" />
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black">
              <Check className="w-5 h-5 text-revital-green" />
            </div>
            <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4 font-medium dark:text-white">
              CMS Headless
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black">
              <Minus className="w-5 h-5 text-muted-foreground dark:text-gray-500" />
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black">
              <Check className="w-5 h-5 text-revital-green" />
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black">
              <Check className="w-5 h-5 text-revital-green" />
            </div>
            <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4 font-medium dark:text-white">
              Pasarelas de Pago
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black dark:text-gray-300">
              Wompi
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black dark:text-gray-300">
              Todas + Webhooks
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black dark:text-gray-300">
              Custom + API
            </div>
            <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4 font-medium dark:text-white">
              Usuarios Administradores
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black dark:text-gray-300">
              1 Usuario
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:text-gray-300">
              Hasta 5 Usuarios
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black dark:text-gray-300">
              Usuarios Ilimitados
            </div>
            <div className="px-3 lg:px-6 col-span-3 lg:col-span-1 py-4 font-medium dark:text-white">
              Soporte Técnico
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black dark:text-gray-300">
              Email
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black dark:text-gray-300">
              Email & Chat Prioritario
            </div>
            <div className="px-3 py-1 md:px-6 md:py-4 flex justify-center dark:bg-revital-black dark:text-gray-300">
              Soporte Prioritario
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Pricing };
