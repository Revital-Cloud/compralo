"use client";

import { Facehash } from "facehash";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/** Paletas de color para Facehash (arrays de hex) */
const COLOR_PRESETS: { name: string; colors: string[] }[] = [
  { name: "Rosa/Azul", colors: ["#ec4899", "#3b82f6"] },
  { name: "Verde/Esmeralda", colors: ["#264653", "#2a9d8f", "#e9c46a"] },
  { name: "Naranja/Amarillo", colors: ["#f97316", "#eab308"] },
  { name: "Morado/Violeta", colors: ["#7c3aed", "#a78bfa"] },
  { name: "Rojo/Coral", colors: ["#dc2626", "#f97316"] },
  { name: "Azul/Cian", colors: ["#0ea5e9", "#06b6d4"] },
];

interface AvatarSelectorProps {
  currentSeed: string | null | undefined;
  currentColors: string | null | undefined; // comma-separated hex, e.g. "#ec4899,#3b82f6"
  userEmail: string;
  userName: string;
  onSelect: (seed: string) => void;
  onSelectColors: (colors: string) => void; // comma-separated
  className?: string;
}

/**
 * Selector de avatar: avatares cuadrados, con paletas de color y selección discreta.
 */
export function AvatarSelector({
  currentSeed,
  currentColors,
  userEmail,
  userName,
  onSelect,
  onSelectColors,
  className,
}: AvatarSelectorProps) {
  // Extraer la inicial del nombre para que todos los avatares la muestren
  const userInitial = userName.trim().charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase();
  
  // Generar seeds que siempre empiecen con el nombre completo para mantener la inicial
  // pero con sufijos diferentes para generar caras distintas
  const baseSeeds = [
    userName, // Nombre completo (mostrará la inicial del nombre)
    `${userName}-1`,
    `${userName}-2`,
    `${userName}-3`,
    `${userName}-4`,
    `${userName}-5`,
    `${userName}-6`,
    `${userName}-7`,
  ];
  const selectedSeed = currentSeed || userName;
  const selectedColorsArray = currentColors?.trim()
    ? currentColors.split(",").map((c) => c.trim()).filter(Boolean)
    : null;
  const effectiveColors = selectedColorsArray?.length ? selectedColorsArray : COLOR_PRESETS[0].colors;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-2">
        <span className="text-sm font-medium text-muted-foreground">Color del avatar</span>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => {
            const value = preset.colors.join(",");
            const isActive = value === (currentColors?.trim() || COLOR_PRESETS[0].colors.join(","));
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onSelectColors(value)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {baseSeeds.map((seed, index) => {
          const isSelected = seed === selectedSeed;
          const colors = effectiveColors;
          return (
            <button
              key={seed}
              type="button"
              onClick={() => onSelect(seed)}
              className={cn(
                "relative flex items-center justify-center rounded-md p-1 transition-all outline-none",
                "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              aria-label={`Seleccionar avatar ${index + 1}`}
            >
              <div className="relative aspect-square w-full max-w-[72px]">
                <Facehash
                  name={seed}
                  size={64}
                  variant="gradient"
                  intensity3d="subtle"
                  showInitial={false}
                  colors={colors}
                  className="rounded-none w-full h-full"
                />
                {isSelected && (
                  <span
                    className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                    aria-hidden
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Haz clic en un avatar para seleccionarlo. El mismo avatar siempre se verá igual.
      </p>
    </div>
  );
}
