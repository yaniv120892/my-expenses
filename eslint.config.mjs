import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  // This is a Node service, not a browser bundle.
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Allow deliberately unused bindings to be marked with a leading
      // underscore. Needed for positional parameters that must stay in the
      // signature — most importantly Express error middleware, which is only
      // recognised as such when it declares four parameters.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Plain CommonJS scripts; require() is correct here.
    files: ['**/*.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
