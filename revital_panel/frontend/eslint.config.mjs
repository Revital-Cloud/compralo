import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      // Reglas básicas de consistencia (sin conflictos con Prettier)
      "no-mixed-spaces-and-tabs": "error",
      "no-trailing-spaces": "error",
      "eol-last": "error",

      // Reglas específicas para TypeScript/React
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@/components/ui", "@/components/dashboard"],
              message:
                "Use direct imports (e.g. @/components/ui/button) instead of barrel files for better tree-shaking",
            },
          ],
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
