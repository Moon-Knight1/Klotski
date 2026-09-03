import vuePlugin from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tsParser from '@typescript-eslint/parser';

/** ESLint 9 flat config。
 *  - .vue 文件：用 vue-eslint-parser 解析 <script lang="ts">，跑 vue3-recommended 规则
 *  - .js/.mjs/.cjs 文件：基础 JS 规则
 *  - .ts 文件：跳过（类型问题由 vue-tsc 在 build 时捕获，避免双解析器依赖）
 */
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'demo-frames/**',
      '**/*.ts',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.vue'],
    plugins: { vue: vuePlugin },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      ...vuePlugin.configs['vue3-recommended'].rules,
    },
  },
];
