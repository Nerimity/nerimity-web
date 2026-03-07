import typescriptEslint from "@typescript-eslint/eslint-plugin";
import solid from "eslint-plugin-solid/configs/typescript";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint
    },

    languageOptions: {
      globals: {
        ...globals.browser
      },

      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module"
    },

    rules: {
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          enableAutofixRemoval: { imports: true }
        }
      ],
      "brace-style": "off",
      quotes: ["error", "double", { avoidEscape: true }],
      indent: "off",

      semi: ["error", "always"],
      "comma-dangle": "off"
    }
  },
  solid
];
