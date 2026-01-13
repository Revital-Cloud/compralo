import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  // Ignorar artefactos de build y dependencias
  {
    ignores: ["**/node_modules/**", ".next/**"],
  },

  // Reglas base de JS y TS
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Reglas de Next.js (core web vitals)
  nextPlugin.configs["core-web-vitals"],

  // Ajustes locales
  {
    rules: {
      "no-mixed-spaces-and-tabs": "error",
      "no-trailing-spaces": "error",
      "eol-last": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

