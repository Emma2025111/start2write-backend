import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import nPlugin from "eslint-plugin-n";
import promisePlugin from "eslint-plugin-promise";

export default [
  js.configs.recommended,
  prettierConfig,
  importPlugin.flatConfigs.recommended,
  nPlugin.configs["flat/recommended"],
  promisePlugin.configs["flat/recommended"],
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      // Add any custom rules here
    },
  },
  {
    ignores: ["node_modules/**", "dist/**"],
  },
];
