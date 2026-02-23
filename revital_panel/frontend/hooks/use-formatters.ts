'use client';

import { useLocale } from 'next-intl';

export function useFormatters() {
  const locale = useLocale();
  const formatPrice = (price: number | string, currency: string = 'USD') => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', {
      style: 'currency',
      currency,
    }).format(numPrice);
  };
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(locale === 'es' ? 'es' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  return { formatPrice, formatDate };
}
