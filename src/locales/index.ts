import { Translation } from './types.js'
import { zhCN } from './zh-CN.js'
import { en } from './en.js'

let currentLang: 'zh-CN' | 'en' = 'zh-CN'
const locales: Record<string, Translation> = {
  'zh-CN': zhCN,
  'en': en
}

export function setLanguage(lang: string) {
  if (lang === 'en' || lang === 'zh-CN') {
    currentLang = lang
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
