"use client";

import { ReactNode } from "react";
import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: "fadeIn" | "slideUp" | "slideLeft" | "slideRight" | "scaleIn";
  delay?: number;
  duration?: number;
  threshold?: number;
}

const animationClasses = {
  fadeIn: "opacity-0 animate-fade-in",
  slideUp: "opacity-0 translate-y-8 animate-slide-up",
  slideLeft: "opacity-0 translate-x-8 animate-slide-left",
  slideRight: "opacity-0 -translate-x-8 animate-slide-right",
  scaleIn: "opacity-0 scale-95 animate-scale-in",
};

export function AnimatedSection({
  children,
  className,
  animation = "fadeIn",
  delay = 0,
  duration = 600,
  threshold = 0.1,
}: AnimatedSectionProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    freezeOnceVisible: true,
  });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "transition-all ease-out",
        isIntersecting
          ? "opacity-100 translate-y-0 translate-x-0 scale-100"
          : animationClasses[animation],
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
