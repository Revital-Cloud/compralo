'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const router = useRouter();
  return (
    <Button variant="outline" size="lg" onClick={() => router.back()}>
      <ArrowLeft className="mr-2 h-5 w-5" />
      Volver atrás
    </Button>
  );
}
