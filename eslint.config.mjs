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
      // eslint-plugin-import 在部分带 exports 的包上可能出现误报（例如 react-window、piexifjs）
      // 我们仍然保留该规则用于本地/相对路径的保护，但对已知误报包做忽略。
      'import/no-unresolved': [
        'error',
        {
          // ignore 既支持包名也支持正则风格字符串；这里用更严格的“精确匹配”避免失效
          ignore: ['^react-window$', '^piexifjs$'],
        },
      ],

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
