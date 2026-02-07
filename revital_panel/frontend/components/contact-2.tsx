"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';

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
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
  title,
  description,
=======
  title = "Contáctanos",
  description = "Estamos disponibles para responder tus preguntas, brindarte soporte técnico o discutir cómo Revital puede impulsar tu negocio online.",
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
  phone = "+34 912 345 678",
  email = "info@revital.com",
  web = { label: "revital.com", url: "https://revital.com" },
}: Contact2Props) => {
  const t = useTranslations();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const displayTitle = title || t('contact.title');
  const displayDescription = description || t('contact.subtitle');
  return (
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
    <section id="contact" className="py-32 bg-white dark:bg-synkro-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-20 items-start">
          <div className="flex flex-col gap-10">
            <div className="text-center lg:text-left">
              <h1 className="mb-2 text-5xl font-semibold lg:mb-1 lg:text-6xl text-synkro-green">
                {displayTitle}
=======
    <section id="contact" className="py-32 bg-white dark:bg-revital-black">
      <div className="container">
        <div className="mx-auto flex max-w-(--breakpoint-xl) flex-col justify-between gap-10 lg:flex-row lg:gap-20">
          <div className="mx-auto flex max-w-sm flex-col justify-between gap-10">
            <div className="text-center lg:text-left">
              <h1 className="mb-2 text-5xl font-semibold lg:mb-1 lg:text-6xl text-revital-green">
                {title}
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
              </h1>
              <p className="text-muted-foreground">{displayDescription}</p>
            </div>
            <div className="mx-auto w-fit lg:mx-0">
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
              <h3 className="mb-6 text-center text-2xl font-semibold lg:text-left text-synkro-green">
                {t('contact.contactInfo')}
              </h3>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-bold text-synkro-green">
                    {t('contact.phone')}:{" "}
=======
              <h3 className="mb-6 text-center text-2xl font-semibold lg:text-left text-revital-green">
                Datos de Contacto
              </h3>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-bold text-revital-green">
                    Teléfono:{" "}
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
                  </span>
                  <span className="text-muted-foreground">{phone}</span>
                </li>
                <li>
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
                  <span className="font-bold text-synkro-green">{t('contact.email')}: </span>
=======
                  <span className="font-bold text-revital-green">Email: </span>
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
                  <a
                    href={`mailto:${email}`}
                    className="underline text-revital-green hover:text-revital-green/80"
                  >
                    {email}
                  </a>
                </li>
                <li>
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
                  <span className="font-bold text-synkro-green">{t('contact.web')}: </span>
=======
                  <span className="font-bold text-revital-green">Web: </span>
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
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
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
          <div className="w-full max-w-xl lg:justify-self-end flex flex-col gap-6 rounded-lg border border-synkro-green/20 p-10 bg-gray-50 dark:bg-synkro-black backdrop-blur-xs">
=======
          <div className="mx-auto flex max-w-(--breakpoint-md) flex-col gap-6 rounded-lg border border-revital-green/20 p-10 bg-gray-50 dark:bg-revital-black backdrop-blur-xs">
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
            <div className="flex gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label
                  htmlFor="firstname"
                  className="text-revital-green font-semibold"
                >
                  {t('contact.form.firstName')}
                </Label>
                <Input
                  type="text"
                  id="firstname"
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
                  placeholder={t('contact.form.firstNamePlaceholder')}
                  className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 bg-white dark:bg-synkro-black"
=======
                  placeholder="Tu nombre"
                  className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label
                  htmlFor="lastname"
                  className="text-revital-green font-semibold"
                >
                  {t('contact.form.lastName')}
                </Label>
                <Input
                  type="text"
                  id="lastname"
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
                  placeholder={t('contact.form.lastNamePlaceholder')}
                  className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 bg-white dark:bg-synkro-black"
=======
                  placeholder="Tus apellidos"
                  className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
                />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="email"
                className="text-revital-green font-semibold"
              >
                {t('contact.form.emailLabel')}
              </Label>
              <Input
                type="email"
                id="email"
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
                placeholder={t('contact.form.emailPlaceholder')}
                className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 bg-white dark:bg-synkro-black"
=======
                placeholder="tu@email.com"
                className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="company"
                className="text-revital-green font-semibold"
              >
                {t('contact.form.companyLabel')}
              </Label>
              <Input
                type="text"
                id="company"
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
                placeholder={t('contact.form.companyPlaceholder')}
                className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 bg-white dark:bg-synkro-black"
=======
                placeholder="Nombre de tu empresa"
                className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="interest"
                className="text-revital-green font-semibold"
              >
                {t('contact.form.interest')}
              </Label>
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
              {isMounted ? (
                <Select>
                  <SelectTrigger className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 bg-white dark:bg-synkro-black">
                    <SelectValue placeholder={t('contact.form.selectOption')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-synkro-black border-synkro-green/20">
                    <SelectItem value="tienda">
                      {t('contact.form.options.store')}
                    </SelectItem>
                    <SelectItem value="migrar">
                      {t('contact.form.options.migrate')}
                    </SelectItem>
                    <SelectItem value="integracion">
                      {t('contact.form.options.integration')}
                    </SelectItem>
                    <SelectItem value="demo">{t('contact.form.options.demo')}</SelectItem>
                    <SelectItem value="soporte">{t('contact.form.options.support')}</SelectItem>
                    <SelectItem value="otro">{t('contact.form.options.other')}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 w-full items-center justify-between rounded-md border border-synkro-green/20 bg-white dark:bg-synkro-black px-3 py-2 text-sm text-muted-foreground">
                  {t('contact.form.selectOption')}
                </div>
              )}
=======
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
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
            </div>
            <div className="grid w-full gap-1.5">
              <Label
                htmlFor="message"
                className="text-revital-green font-semibold"
              >
                {t('contact.form.messageLabel')}
              </Label>
              <Textarea
                placeholder={t('contact.form.messagePlaceholder')}
                id="message"
                className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 min-h-[120px] bg-white dark:bg-revital-black"
              />
            </div>
<<<<<<< HEAD:synkro_panel/frontend/components/contact-2.tsx
            <Button variant="synkro" className="w-full">
              {t('contact.form.submitButton')}
=======
            <Button variant="revital" className="w-full">
              Enviar Mensaje
>>>>>>> main:revital_panel/frontend/components/contact-2.tsx
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
