'use server'

import { cookies } from 'next/headers'
import { defaultLocale } from '~/i18n'
import { Language } from '~/types/language'

const COOKIE_NAME = 'NEXT_LOCALE' as const

export async function getUserLocale(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || defaultLocale
}

export async function setUserLocale(locale: Language): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, locale)
}
