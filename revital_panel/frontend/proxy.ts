import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALE_PREFIXES = ['/en', '/es'];

/**
 * Redirects /en/* and /es/* to /* so URLs are always without locale segment.
 * Locale is determined by cookie (NEXT_LOCALE) and i18n config.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      const pathWithoutLocale = pathname.slice(prefix.length) || '/';
      const url = request.nextUrl.clone();
      url.pathname = pathWithoutLocale;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/en', '/en/:path*', '/es', '/es/:path*'],
};
