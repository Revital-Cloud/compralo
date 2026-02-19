'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Líneas ya no se usan en el modelo producto+variantes.
 * Redirigir a categorías.
 */
export default function LinesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/categories');
  }, [router]);
  return null;
}
