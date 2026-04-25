"use client";

import React from "react";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";

/**
 * Modal de acceso requerido.
 *
 * Uso típico:
 * - Flujos protegidos (checkout, acciones de cuenta, etc.).
 * - Redirige a login/register con `redirectTo` para retornar al flujo original.
 */

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** After login, redirect to this path (e.g. "/checkout"). Appended as ?redirect= to login URL. */
  redirectTo?: string;
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  title = "Debes iniciar sesión para continuar",
  description = "Para realizar esta acción necesitas iniciar sesión o registrarte.",
  redirectTo,
}: AuthModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    const loginPath = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login";
    router.push(loginPath);
  };

  const handleRegister = () => {
    onClose();
    const registerPath = redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register";
    router.push(registerPath);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleRegister}
              className="flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <UserPlus className="h-4 w-4" />
              Registrarse
            </Button>
            <Button
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </Button>
          </div>
        </div>
        
        <DialogFooter className="justify-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 transition-all duration-200"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
