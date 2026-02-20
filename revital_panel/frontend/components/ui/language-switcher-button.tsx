"use client";

import { useLocale } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// SVG flags (same size as theme icon ~1.2rem) so they render everywhere
const FlagEN = () => (
  <svg viewBox="0 0 24 24" className="h-[1.2rem] w-[1.2rem]" aria-hidden>
    <rect width="24" height="24" fill="#012169" />
    <path d="M0 0l24 24M24 0L0 24" stroke="#fff" strokeWidth="4" />
    <path d="M0 0l24 24M24 0L0 24" stroke="#C8102E" strokeWidth="2.5" />
    <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="6" />
    <path d="M12 0v24M0 12h24" stroke="#C8102E" strokeWidth="4" />
  </svg>
);

const FlagES = () => (
  <svg viewBox="0 0 24 24" className="h-[1.2rem] w-[1.2rem]" aria-hidden>
    <rect width="24" height="8" y="0" fill="#AA151B" />
    <rect width="24" height="8" y="8" fill="#F1BF00" />
    <rect width="24" height="8" y="16" fill="#AA151B" />
  </svg>
);

const LOCALES = [
  { code: "en" as const, Flag: FlagEN, label: "English" },
  { code: "es" as const, Flag: FlagES, label: "Español" },
] as const;

interface LanguageSwitcherButtonProps {
  className?: string;
  onSwitch?: () => void;
}

export function LanguageSwitcherButton({ className, onSwitch }: LanguageSwitcherButtonProps) {
  const locale = useLocale();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const next = LOCALES.find((l) => l.code !== locale) ?? LOCALES[1];

  const switchLocale = () => {
    router.replace(pathname, { locale: next.code });
    nextRouter.refresh();
    onSwitch?.();
  };

  const CurrentFlag = current.Flag;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={switchLocale}
      aria-label={next.label}
      title={current.label}
      className={cn("w-9 h-9 shrink-0", className)}
    >
      <span className="sr-only">{next.label}</span>
      <CurrentFlag />
    </Button>
  );
}
