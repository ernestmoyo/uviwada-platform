'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Lang = 'sw' | 'en'

export interface BiText {
  sw: string
  en: string
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggle: () => void
  t: (entry: BiText) => string
}

const I18nContext = createContext<I18nValue | null>(null)

const STORAGE_KEY = 'uviwada.lang'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('sw')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'sw' || stored === 'en') {
      setLangState(stored)
    }
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }, [])

  const toggle = useCallback(() => {
    setLang(lang === 'sw' ? 'en' : 'sw')
  }, [lang, setLang])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      toggle,
      t: (entry) => entry[lang] ?? entry.sw
    }),
    [lang, setLang, toggle]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within <I18nProvider>')
  }
  return ctx
}

export function bi(sw: string, en: string): BiText {
  return { sw, en }
}
