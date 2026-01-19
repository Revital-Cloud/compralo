'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { IconCheck, IconArrowLeft } from "@tabler/icons-react";

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onContinue?: () => void;
  onGoBack?: () => void;
  continueText?: string;
  goBackText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  onOpenChange,
  title = "¡Éxito!",
  description = "La operación se completó exitosamente.",
  onContinue,
  onGoBack,
  continueText = "Continuar",
  goBackText = "Volver"
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <IconCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          {onContinue && (
            <Button 
              onClick={onContinue}
              className="w-full"
            >
              {continueText}
            </Button>
          )}
          {onGoBack && (
            <Button 
              variant="outline" 
              onClick={onGoBack}
              className="w-full"
            >
              <IconArrowLeft className="w-4 h-4 mr-2" />
              {goBackText}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
