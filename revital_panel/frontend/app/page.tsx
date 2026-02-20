import { getLocale, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { routing } from '@/i18n/routing';
import { HomeContent } from '@/components/home-content';

/**
 * Root path /: render home with locale from middleware (cookie/header).
 * URL stays as / (no /en or /es). Locale is switched via header button.
 */
export default async function RootPage() {
  const locale = await getLocale();
  const resolvedLocale = routing.locales.includes(locale as 'en' | 'es')
    ? locale
    : routing.defaultLocale;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      <HomeContent />
    </NextIntlClientProvider>
  );
}
