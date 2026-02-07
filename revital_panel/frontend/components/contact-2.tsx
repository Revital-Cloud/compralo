import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Contact2Props {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  web?: { label: string; url: string };
}

export const Contact2 = ({
  title = "Contáctanos",
  description = "Estamos disponibles para responder tus preguntas, brindarte soporte técnico o discutir cómo Revital puede impulsar tu negocio online.",
  phone = "+34 912 345 678",
  email = "info@revital.com",
  web = { label: "revital.com", url: "https://revital.com" },
}: Contact2Props) => {
  return (
    <section id="contact" className="py-32 bg-white dark:bg-revital-black">
      <div className="container">
        <div className="mx-auto flex max-w-(--breakpoint-xl) flex-col justify-between gap-10 lg:flex-row lg:gap-20">
          <div className="mx-auto flex max-w-sm flex-col justify-between gap-10">
            <div className="text-center lg:text-left">
              <h1 className="mb-2 text-5xl font-semibold lg:mb-1 lg:text-6xl text-revital-green">
                {title}
              </h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="mx-auto w-fit lg:mx-0">
              <h3 className="mb-6 text-center text-2xl font-semibold lg:text-left text-revital-green">
                Datos de Contacto
              </h3>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-bold text-revital-green">
                    Teléfono:{" "}
                  </span>
                  <span className="text-muted-foreground">{phone}</span>
                </li>
                <li>
                  <span className="font-bold text-revital-green">Email: </span>
                  <a
                    href={`mailto:${email}`}
                    className="underline text-revital-green hover:text-revital-green/80"
                  >
                    {email}
                  </a>
                </li>
                <li>
                  <span className="font-bold text-revital-green">Web: </span>
                  <a
                    href={web.url}
                    target="_blank"
                    className="underline text-revital-green hover:text-revital-green/80"
                  >
                    {web.label}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mx-auto flex max-w-(--breakpoint-md) flex-col gap-6 rounded-lg border border-revital-green/20 p-10 bg-gray-50 dark:bg-revital-black backdrop-blur-xs">
            <div className="flex gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label
                  htmlFor="firstname"
                  className="text-revital-green font-semibold"
                >
                  Nombre
                </Label>
                <Input
                  type="text"
                  id="firstname"
                  placeholder="Tu nombre"
                  className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label
                  htmlFor="lastname"
                  className="text-revital-green font-semibold"
                >
                  Apellidos
                </Label>
                <Input
                  type="text"
                  id="lastname"
                  placeholder="Tus apellidos"
                  className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
                />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="email"
                className="text-revital-green font-semibold"
              >
                Email
              </Label>
              <Input
                type="email"
                id="email"
                placeholder="tu@email.com"
                className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="company"
                className="text-revital-green font-semibold"
              >
                Empresa
              </Label>
              <Input
                type="text"
                id="company"
                placeholder="Nombre de tu empresa"
                className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="interest"
                className="text-revital-green font-semibold"
              >
                ¿Qué te interesa?
              </Label>
              <Select>
                <SelectTrigger className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-revital-black border-revital-green/20">
                  <SelectItem value="tienda">
                    Crear una tienda online
                  </SelectItem>
                  <SelectItem value="migrar">
                    Migrar mi tienda actual
                  </SelectItem>
                  <SelectItem value="integracion">
                    Integraciones con otras plataformas
                  </SelectItem>
                  <SelectItem value="demo">Solicitar una demo</SelectItem>
                  <SelectItem value="soporte">Soporte técnico</SelectItem>
                  <SelectItem value="otro">Otro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full gap-1.5">
              <Label
                htmlFor="message"
                className="text-revital-green font-semibold"
              >
                Mensaje
              </Label>
              <Textarea
                placeholder="Escribe tu mensaje aquí..."
                id="message"
                className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 min-h-[120px] bg-white dark:bg-revital-black"
              />
            </div>
            <Button variant="revital" className="w-full">
              Enviar Mensaje
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
