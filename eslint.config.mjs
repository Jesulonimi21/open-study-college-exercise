import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {ignores: ["node_modules/**"]},
  {files: ["**/*.{js,mjs,cjs,ts}"], ignores: ["node_modules/**"]},
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"},  ignores: ["node_modules/**"]},
  {languageOptions: { globals: globals.browser },  ignores: ["node_modules/**"]},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {rules : {
     "@typescript-eslint/no-explicit-any": "off"
  }}
];