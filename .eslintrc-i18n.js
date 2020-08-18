'use strict';
const path = require('path');

module.exports = {
  root: true,
  plugins: ['@intlify/vue-i18n'],
  rules: {
    '@intlify/vue-i18n/no-raw-text': 'warn',
  },
  settings: {
    'vue-i18n': {
      // localeDir: './systems/**/*.json'
      // localeDir: {
      //     pattern: './systems/**/*.json',
      //     localeKey: 'file'
      // }
    },
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: 'babel-eslint',
    // parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
};
