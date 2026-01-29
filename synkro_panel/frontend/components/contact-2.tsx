"use client";

import React from "react";
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
  title,
  description,
  phone = "+34 912 345 678",
  email = "info@synkro.com",
  web = { label: "synkro.com", url: "https://synkro.com" },
}: Contact2Props) => {
  const t = useTranslations();
  
  const displayTitle = title || t('contact.title');
  const displayDescription = description || t('contact.subtitle');
  return (
    <section id="contact" className="py-32 bg-white dark:bg-synkro-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-20 items-start">
          <div className="flex flex-col gap-10">
            <div className="text-center lg:text-left">
              <h1 className="mb-2 text-5xl font-semibold lg:mb-1 lg:text-6xl text-synkro-green">
                {displayTitle}
              </h1>
              <p className="text-muted-foreground">{displayDescription}</p>
            </div>
            <div className="mx-auto w-fit lg:mx-0">
              <h3 className="mb-6 text-center text-2xl font-semibold lg:text-left text-synkro-green">
                {t('contact.contactInfo')}
              </h3>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-bold text-synkro-green">
                    {t('contact.phone')}:{" "}
                  </span>
                  <span className="text-muted-foreground">{phone}</span>
                </li>
                <li>
                  <span className="font-bold text-synkro-green">{t('contact.email')}: </span>
                  <a
                    href={`mailto:${email}`}
                    className="underline text-synkro-green hover:text-synkro-green/80"
                  >
                    {email}
                  </a>
                </li>
                <li>
                  <span className="font-bold text-synkro-green">{t('contact.web')}: </span>
                  <a
                    href={web.url}
                    target="_blank"
                    className="underline text-synkro-green hover:text-synkro-green/80"
                  >
                    {web.label}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-full max-w-xl lg:justify-self-end flex flex-col gap-6 rounded-lg border border-synkro-green/20 p-10 bg-gray-50 dark:bg-synkro-black backdrop-blur-xs">
            <div className="flex gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label
                  htmlFor="firstname"
                  className="text-synkro-green font-semibold"
                >
                  {t('contact.form.firstName')}
                </Label>
                <Input
                  type="text"
                  id="firstname"
                  placeholder={t('contact.form.firstNamePlaceholder')}
                  className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 bg-white dark:bg-synkro-black"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label
                  htmlFor="lastname"
                  className="text-synkro-green font-semibold"
                >
                  {t('contact.form.lastName')}
                </Label>
                <Input
                  type="text"
                  id="lastname"
                  placeholder={t('contact.form.lastNamePlaceholder')}
                  className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 bg-white dark:bg-synkro-black"
                />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="email"
                className="text-synkro-green font-semibold"
              >
                {t('contact.form.emailLabel')}
              </Label>
              <Input
                type="email"
                id="email"
                placeholder={t('contact.form.emailPlaceholder')}
                className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 bg-white dark:bg-synkro-black"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="company"
                className="text-synkro-green font-semibold"
              >
                {t('contact.form.companyLabel')}
              </Label>
              <Input
                type="text"
                id="company"
                placeholder={t('contact.form.companyPlaceholder')}
                className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 bg-white dark:bg-synkro-black"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="interest"
                className="text-synkro-green font-semibold"
              >
                {t('contact.form.interest')}
              </Label>
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
            </div>
            <div className="grid w-full gap-1.5">
              <Label
                htmlFor="message"
                className="text-synkro-green font-semibold"
              >
                {t('contact.form.messageLabel')}
              </Label>
              <Textarea
                placeholder={t('contact.form.messagePlaceholder')}
                id="message"
                className="border-synkro-green/20 focus:border-synkro-green focus:ring-synkro-green/20 min-h-[120px] bg-white dark:bg-synkro-black"
              />
            </div>
            <Button variant="synkro" className="w-full">
              {t('contact.form.submitButton')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
