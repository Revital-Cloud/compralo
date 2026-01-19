"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = `${(scrollPx / winHeightPx) * 100}%`;
      setScrollProgress(parseFloat(scrolled));

      // Show button when page is scrolled down 300px
      if (scrollPx > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-50 transition-all duration-500 ease-out",
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-8 scale-75"
      )}
    >
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
        {/* Progress Bar Circular */}
        <svg
          className="absolute w-full h-full transform -rotate-90"
          viewBox="0 0 64 64"
          fill="none"
        >
          {/* Fondo del círculo */}
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="2"
            className="text-synkro-green/20"
          />
          {/* Progress bar */}
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - scrollProgress / 100)}`}
            className="text-synkro-green transition-all duration-150 ease-out"
            strokeLinecap="round"
          />
        </svg>

        {/* Botón principal */}
        <button
          onClick={scrollToTop}
          className="group relative w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-synkro-green to-synkro-green/80 text-synkro-black shadow-2xl hover:shadow-synkro-green/30 transition-all duration-300 hover:scale-110 hover:from-synkro-green/90 hover:to-synkro-green/70 flex items-center justify-center backdrop-blur-xs border border-synkro-green/20 z-10"
          aria-label="Volver arriba"
        >
          {/* Efecto de pulso en hover */}
          <div className="absolute inset-0 rounded-full bg-synkro-green/20 scale-0 group-hover:scale-150 transition-transform duration-500" />

          {/* Icono */}
          <ArrowUp className="h-3 w-3 sm:h-5 sm:w-5 relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5" />

          {/* Efecto de brillo */}
          <div className="absolute inset-0 rounded-full bg-linear-to-t from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  );
}
