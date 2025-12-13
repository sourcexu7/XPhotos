import { getRequestConfig } from 'next-intl/server'
import { getUserLocale } from '~/lib/utils/locale'

export const defaultLocale = 'zh'
export const supportedLocales = ['zh', 'en', 'ja', 'zh-TW'] as const

export type Locale = (typeof supportedLocales)[number]

export default getRequestConfig(async () => {
  const locale = await getUserLocale()
  const resolvedLocale = locale ?? defaultLocale

  return {
    locale: resolvedLocale,
    messages: (await import(`~/messages/${resolvedLocale}.json`)).default,
    timeZone: 'Asia/Shanghai',
  }
})