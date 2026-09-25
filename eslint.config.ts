import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import pluginPlaywright from 'eslint-plugin-playwright'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'public/**']),

  // The scaffold ships `flat/essential`; `flat/recommended` adds the style-guide rules.
  ...pluginVue.configs['flat/recommended'],
  ...pluginVueA11y.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    name: 'app/vue-conventions',
    files: ['**/*.vue'],
    rules: {
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/define-macros-order': ['error', { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineModel', 'defineSlots'] }],
      'vue/no-unused-properties': 'error',
      'vue/no-unused-emit-declarations': 'error',
      'vue/no-ref-object-reactivity-loss': 'error',
      'vue/prefer-use-template-ref': 'error',
      'vue/require-explicit-slots': 'error',
      'vue/no-v-html': 'error',
      // Optional TS props are `undefined` by design; defaults come from props destructuring.
      'vue/require-default-prop': 'off',
      // A label may reference its control by id or wrap it; requiring both is stricter than WCAG.
      'vuejs-accessibility/label-has-for': ['error', { required: { some: ['nesting', 'id'] } }],
      // Formatting is oxfmt's job.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
    },
  },

  {
    name: 'app/layer-boundaries',
    files: ['src/shared/**/*.{ts,vue}'],
    rules: {
      // Imports point downward only: app → pages → features → shared.
      'no-restricted-imports': ['error', { patterns: ['@/app/*', '@/pages/*', '@/features/*'] }],
    },
  },
  {
    files: ['src/features/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@/app/*', '@/pages/*'] }],
    },
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
