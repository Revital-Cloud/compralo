'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Sublíneas ya no se usan en el modelo producto+variantes.
 * Redirigir a categorías.
 */
export default function SublinesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/categories');
  }, [router]);
  return null;
}
