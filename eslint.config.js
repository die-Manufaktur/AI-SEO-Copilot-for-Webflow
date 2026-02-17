import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.*',
      'scripts/**',
      'test-reporters/**',
      'workers/**/*.js',
    ],
  },
  {
    rules: {
      // Disabled to accommodate existing codebase patterns
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'no-case-declarations': 'off',
      'no-constant-binary-expression': 'off',
      'no-empty': 'off',
      'no-control-regex': 'off',
      'no-useless-escape': 'off',
      'no-cond-assign': 'off',
      'no-useless-assignment': 'off',
      'prefer-const': 'off',
      'preserve-caught-error': 'off',
    },
  },
);
