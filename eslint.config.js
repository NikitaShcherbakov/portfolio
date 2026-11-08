import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import playwright from 'eslint-plugin-playwright';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import testingLibrary from 'eslint-plugin-testing-library';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const noEnum = {
  selector: 'TSEnumDeclaration',
  message:
    'Use an `as const` object instead of enum: enums are not erasable syntax.',
};

const booleanShorthand = {
  selector: 'JSXAttribute > JSXExpressionContainer > Literal[value=true]',
  message: 'Use boolean shorthand: <Component isVisible />.',
};

export default defineConfig(
  globalIgnores([
    'build',
    'coverage',
    'playwright-report',
    'test-results',
    '.cache',
    // Claude Code settings and hooks: tooling, not project code.
    '.claude',
  ]),

  // Base: JS + strict type-aware TypeScript for every file.
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      'check-file': checkFile,
    },
    rules: {
      // Import order from CLAUDE.md: external, @/ aliases, relative, styles.
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^node:', '^react', '^@?\\w'],
            ['^@/'],
            ['^\\.'],
            ['\\.css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreArrowShorthand: true },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'has', 'should', 'can'],
        },
      ],

      eqeqeq: ['error', 'smart'],
      curly: ['error', 'multi-line'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-nested-ternary': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-restricted-syntax': ['error', noEnum],

      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'src/**/': 'KEBAB_CASE' },
      ],
    },
  },

  // Node: root configs and e2e.
  {
    files: ['*.{js,ts}', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // React app.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      eslintReact.configs['strict-type-checked'],
      jsxA11y.configs.strict,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-syntax': ['error', noEnum, booleanShorthand],
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
    },
  },

  // Tests.
  {
    files: ['src/**/*.test.{ts,tsx}'],
    extends: [vitest.configs.recommended],
    rules: {
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/valid-expect': ['error', { maxArgs: 2 }],
      'vitest/no-focused-tests': 'error',
      'vitest/prefer-hooks-on-top': 'error',
    },
  },
  {
    files: ['src/**/*.test.tsx'],
    extends: [testingLibrary.configs['flat/react']],
  },
  {
    files: ['e2e/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
  },

  // Must stay last: turns off rules that conflict with Prettier.
  prettierConfig
);
