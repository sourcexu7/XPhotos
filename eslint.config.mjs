import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
      // --- 风险类：保留 ---
      'react-hooks/exhaustive-deps': 'warn',
      // 允许使用 <img>（项目中有大量静态/特定需求场景），关闭以避免噪声
      '@next/next/no-img-element': 'off',
      'import/no-unresolved': 'error',

      // --- 类型安全：保留但降噪 ---
      // 大量告警且业务风险低，降噪关闭
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 3,
          // disallow ts-ignore; must use ts-expect-error with description
          'ts-ignore': false,
        },
      ],

      // --- 纯风格交给 Prettier，避免噪声 ---
      quotes: 'off',
      'no-multiple-empty-lines': 'off',
      semi: ['warn', 'never'],
      'no-trailing-spaces': 'off',
      'eol-last': 'off',

      // --- 其他 ---
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  }),
  // 针对组件层的常见占位参数/any 做限域放宽，避免大面积噪声
  {
    files: ['components/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]

export default eslintConfig
