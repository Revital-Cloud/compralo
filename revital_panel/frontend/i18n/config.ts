import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Root path (e.g. /) has no [locale] segment: use cookie or default
  if (!locale || !routing.locales.includes(locale as 'en' | 'es')) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
    locale = cookieLocale && routing.locales.includes(cookieLocale as 'en' | 'es')
      ? cookieLocale
      : routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
