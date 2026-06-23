import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/* ----------------------------------------------------------------------------
   Theming + white-label
   ----------------------------------------------------------------------------
   Estado de tema (claro/escuro) e marca (white-label). Aplica os atributos
   data-theme / data-brand no <html> e persiste em localStorage. O chrome troca
   por tema; só o accent troca por marca. Ver src/styles/tokens.css.
---------------------------------------------------------------------------- */

export type Theme = 'dark' | 'light'
export type Brand = 'default' | 'ember'

/** Marcas disponíveis (para seletores de UI). */
export const BRANDS: { value: Brand; label: string }[] = [
  { value: 'default', label: 'UPSKL · Steel' },
  { value: 'ember', label: 'Ember · Copper' },
]

const THEME_KEY = 'upskl-theme'
const BRAND_KEY = 'upskl-brand'

interface ThemeCtx {
  theme: Theme
  brand: Brand
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  setBrand: (b: Brand) => void
}

const Context = createContext<ThemeCtx | null>(null)

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function readBrand(): Brand {
  if (typeof window === 'undefined') return 'default'
  return (localStorage.getItem(BRAND_KEY) as Brand) || 'default'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [brand, setBrandState] = useState<Brand>(readBrand)

  // Sincroniza <html> + persiste sempre que algo muda.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    // Mantém a classe `dark` coerente para utilitários `dark:` do Tailwind.
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    if (brand === 'default') root.removeAttribute('data-brand')
    else root.setAttribute('data-brand', brand)
    localStorage.setItem(BRAND_KEY, brand)
  }, [brand])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    [],
  )
  const setBrand = useCallback((b: Brand) => setBrandState(b), [])

  const value = useMemo<ThemeCtx>(
    () => ({ theme, brand, setTheme, toggleTheme, setBrand }),
    [theme, brand, setTheme, toggleTheme, setBrand],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useTheme() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  return ctx
}
