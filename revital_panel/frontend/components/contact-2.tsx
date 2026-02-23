"use client";

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
import { useTranslations } from "next-intl";

interface Contact2Props {
  phone?: string;
  email?: string;
  web?: { label: string; url: string };
}

const INTEREST_OPTIONS = ["store", "migrate", "integration", "demo", "support", "other"] as const;

export const Contact2 = ({
  phone = "+34 912 345 678",
  email = "info@revital.com",
  web = { label: "panel.revital.cloud", url: "https://panel.revital.cloud" },
}: Contact2Props) => {
  const t = useTranslations("contact");
  const tForm = useTranslations("contact.form");

  return (
    <section id="contact" className="py-32 bg-white dark:bg-revital-black">
      <div className="container">
        <div className="mx-auto flex max-w-(--breakpoint-xl) flex-col justify-between gap-10 lg:flex-row lg:gap-20">
          <div className="mx-auto flex max-w-sm flex-col justify-between gap-10">
            <div className="text-center lg:text-left">
              <h1 className="mb-2 text-5xl font-semibold lg:mb-1 lg:text-6xl text-revital-green">
                {t("title")}
              </h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
            <div className="mx-auto w-fit lg:mx-0">
              <h3 className="mb-6 text-center text-2xl font-semibold lg:text-left text-revital-green">
                {t("contactInfo")}
              </h3>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-bold text-revital-green">
                    {t("phone")}:{" "}
                  </span>
                  <span className="text-muted-foreground">{phone}</span>
                </li>
                <li>
                  <span className="font-bold text-revital-green">{t("email")}: </span>
                  <a
                    href={`mailto:${email}`}
                    className="underline text-revital-green hover:text-revital-green/80"
                  >
                    {email}
                  </a>
                </li>
                <li>
                  <span className="font-bold text-revital-green">{t("web")}: </span>
                  <a
                    href={web.url}
                    target="_blank"
                    rel="noopener noreferrer"
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
                <Label htmlFor="firstname" className="text-revital-green font-semibold">
                  {tForm("firstName")}
                </Label>
                <Input
                  type="text"
                  id="firstname"
                  placeholder={tForm("firstNamePlaceholder")}
                  className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="lastname" className="text-revital-green font-semibold">
                  {tForm("lastName")}
                </Label>
                <Input
                  type="text"
                  id="lastname"
                  placeholder={tForm("lastNamePlaceholder")}
                  className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
                />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email" className="text-revital-green font-semibold">
                {tForm("emailLabel")}
              </Label>
              <Input
                type="email"
                id="email"
                placeholder={tForm("emailPlaceholder")}
                className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="company" className="text-revital-green font-semibold">
                {tForm("companyLabel")}
              </Label>
              <Input
                type="text"
                id="company"
                placeholder={tForm("companyPlaceholder")}
                className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="interest" className="text-revital-green font-semibold">
                {tForm("interest")}
              </Label>
              <Select>
                <SelectTrigger className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 bg-white dark:bg-revital-black">
                  <SelectValue placeholder={tForm("selectOption")} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-revital-black border-revital-green/20">
                  {INTEREST_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {tForm(`options.${opt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="message" className="text-revital-green font-semibold">
                {tForm("messageLabel")}
              </Label>
              <Textarea
                placeholder={tForm("messagePlaceholder")}
                id="message"
                className="border-revital-green/20 focus:border-revital-green focus:ring-revital-green/20 min-h-[120px] bg-white dark:bg-revital-black"
              />
            </div>
            <Button variant="revital" className="w-full">
              {tForm("submitButton")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
