import { Translation } from './types.js'
import { zhCN } from './zh-CN.js'
import { en } from './en.js'
import { ja } from './ja.js'
import { ko } from './ko.js'
import { de } from './de.js'
import { fr } from './fr.js'
import { zhTW } from './zh-TW.js'

export type SupportedLanguage = 'zh-CN' | 'en' | 'ja' | 'ko' | 'de' | 'fr' | 'zh-TW'

let currentLang: SupportedLanguage = 'zh-CN'
const locales: Record<SupportedLanguage, Translation> = {
  'zh-CN': zhCN,
  'en': en,
  'ja': ja,
  'ko': ko,
  'de': de,
  'fr': fr,
  'zh-TW': zhTW
}

export function setLanguage(lang: string) {
  if (lang in locales) {
    currentLang = lang as SupportedLanguage
  }
}

export function t(path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.')
  let value: any = locales[currentLang]
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key as keyof typeof value]
    } else {
      return path
    }
  }

  if (typeof value === 'string' && params) {
    return value.replace(/\{(\w+)\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{${key}}`
    })
  }

  return String(value)
}
