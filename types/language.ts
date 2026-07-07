export type Language = 'zh' | 'en' | 'ja' | 'zh-TW'

export interface LanguageInfo {
  code: Language
  name: string
  nativeName: string
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'zh', name: 'Chinese', nativeName: '简体中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' },
]
