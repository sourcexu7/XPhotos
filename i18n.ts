import { getRequestConfig } from 'next-intl/server'
import { getUserLocale } from '~/lib/utils/locale'

export const defaultLocale = 'zh'
export const supportedLocales = ['zh', 'en'] as const

export type Locale = (typeof supportedLocales)[number]

export default getRequestConfig(async () => {
  const locale = await getUserLocale()
  const resolvedLocale = supportedLocales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale

  return {
    locale: resolvedLocale,
    messages: (await import(`~/messages/${resolvedLocale}.json`)).default,
    timeZone: 'Asia/Shanghai',
  }
})