import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Common TypeScript rules that all projects share
export const commonTypeScriptRules = {
  '@typescript-eslint/no-misused-promises': [
    'error',
    {
      checksVoidReturn: false,
    },
  ],
  // Middle ground: Keep type safety but disable only the most problematic unsafe rules
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
  '@typescript-eslint/no-unsafe-argument': 'warn',
};

// Common Prettier rules
export const commonPrettierRules = {
  ...eslintConfigPrettier.rules,
  'prettier/prettier': 'warn',
};

// Base TypeScript configuration
export const createBaseTypeScriptConfig = async (options = {}) => {
  const jest = await import('eslint-plugin-jest');

  const {
    globals: customGlobals = globals.node,
    ecmaVersion = 'latest',
    ignores = ['**/dist/**', '**/build/**', '**/node_modules/**', '**/coverage/**'],
    additionalRules = {},
    additionalPlugins = {},
  } = options;

  return defineConfig(
    { ignores },
    {
      files: ['**/*.ts'],
      extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
      languageOptions: {
        globals: customGlobals,
        parserOptions: {
          ecmaVersion,
          sourceType: 'module',
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      plugins: {
        prettier: prettierPlugin,
        jest: jest.default,
        ...additionalPlugins,
      },
      rules: {
        ...commonTypeScriptRules,
        ...commonPrettierRules,
        ...jest.default.configs.recommended.rules,
        ...additionalRules,
      },
    },
  );
};
