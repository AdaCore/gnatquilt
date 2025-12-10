// @ts-check
const angular = require('angular-eslint');

const template = require('@angular-eslint/eslint-plugin-template');
const tseslint = require('typescript-eslint');
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ['src/app/source/source-file/virtual-scroller.ts'],
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Note: you must disable the base rule as it can report incorrect errors
      'no-empty-function': ['off'],
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['overrideMethods'] },
      ],
    },
  },
  {
    plugins: { template },
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/click-events-have-key-events': [
        'error',
        {
          ignoreWithDirectives: ['ignoreForKeyEvents'],
        },
      ],
    },
  },
]);
