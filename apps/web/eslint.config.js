import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import { createBaseTypeScriptConfig } from "../../infra/config/eslint/eslint-shared.js";

export default await createBaseTypeScriptConfig({
  tsconfigRootDir: import.meta.dirname,
  globals: globals.browser,
  ecmaVersion: 2020,
  files: ["**/*.{ts,tsx}"],
  additionalPlugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
  },
  additionalRules: {
    ...reactHooks.configs.recommended.rules,
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
});
