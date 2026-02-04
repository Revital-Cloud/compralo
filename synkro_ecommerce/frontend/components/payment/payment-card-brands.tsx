"use client";

import React from "react";

const iconClass = "h-6 w-auto";

/**
 * Logos de marcas de tarjetas para UI de métodos de pago.
 * Colores y formas reconocibles (Visa, Mastercard, American Express, PSE).
 */
export function PaymentCardBrands() {
  return (
    <div
      className="flex items-center gap-4 flex-wrap"
      aria-label="Aceptamos Visa, Mastercard y American Express"
    >
      <VisaLogo />
      <MastercardLogo />
      <AmexLogo />
    </div>
  );
}

function VisaLogo() {
  return (
    <span className={`${iconClass} inline-flex items-center justify-center`} title="Visa">
      <svg viewBox="0 0 48 16" fill="none" className="h-6 w-auto" aria-hidden>
        <rect width="48" height="16" rx="3" fill="#1A1F71" />
        <text
          x="24"
          y="11.5"
          textAnchor="middle"
          fill="#fff"
          fontSize="9"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.15em"
        >
          VISA
        </text>
      </svg>
    </span>
  );
}

function MastercardLogo() {
  return (
    <span className={`${iconClass} inline-flex items-center justify-center`} title="Mastercard">
      <svg
        viewBox="0 0 32 22"
        fill="none"
        className="h-6 w-auto"
        aria-hidden
      >
        <rect width="32" height="22" rx="4" fill="#fff" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.5" />
        {/* Círculo rojo */}
        <circle cx="12" cy="11" r="6.5" fill="#EB001B" />
        {/* Círculo naranja */}
        <circle cx="20" cy="11" r="6.5" fill="#F79E1B" />
        {/* Intersección (overlap) */}
        <path
          fill="#FF5F00"
          d="M16 4.3a11 11 0 0 1 0 13.4 11 11 0 0 1 0-13.4z"
          opacity="0.95"
        />
      </svg>
    </span>
  );
}

function AmexLogo() {
  return (
    <span className={`${iconClass} inline-flex items-center justify-center`} title="American Express">
      <svg
        viewBox="0 0 48 16"
        fill="none"
        className="h-6 w-auto"
        aria-hidden
      >
        <rect width="48" height="16" rx="3" fill="#006FCF" />
        <text
          x="24"
          y="11"
          textAnchor="middle"
          fill="#fff"
          fontSize="8"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.08em"
        >
          AMEX
        </text>
      </svg>
    </span>
  );
}

/** Logo PSE (Colombia) — estilo tarjeta reconocible, bien visible junto a Visa/MC/Amex */
export function PseLogo() {
  return (
    <span
      className={`${iconClass} inline-flex items-center justify-center rounded-md px-3 py-1.5 border-2 bg-slate-100 dark:bg-slate-700/80 border-slate-300 dark:border-slate-500 shadow-sm`}
      title="PSE"
    >
      <span className="text-xs font-extrabold tracking-wider text-slate-800 dark:text-slate-100">
        PSE
      </span>
    </span>
  );
}

/** Contenedor para mostrar todos los métodos (PSE + tarjetas) en checkout */
export function PaymentMethodsRow() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <PseLogo />
      <PaymentCardBrands />
    </div>
  );
}
