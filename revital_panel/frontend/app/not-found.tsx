import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6 px-4 bg-background">
      <div className="text-center space-y-2">
        <p className="text-8xl font-bold text-revital-green/20 select-none">404</p>
        <h1 className="text-2xl font-semibold text-foreground">
          Página no encontrada
        </h1>
        <p className="text-muted-foreground max-w-sm">
          La ruta que buscas no existe o fue movida.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="bg-revital-green hover:bg-revital-green/90 text-revital-black font-medium">
          <Link href="/">
            <Home className="mr-2 h-5 w-5" />
            Ir al inicio
          </Link>
        </Button>
        <BackButton />
      </div>
    </div>
  );
}
