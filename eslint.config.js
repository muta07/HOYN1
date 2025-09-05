// @ts-check

import eslint from '@eslint/js';
import next from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.next/', 'node_modules/', 'out/'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@next/next': next,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
    ],
    rules: {
      ...next.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  }
);