import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import {
  readCafeSettings,
  writeCafeSettings,
} from '../services/settings/cafeSettings.ts'
import { isPaperWidth } from '../types/settings.ts'
import type { CafeSettings } from '../types/settings.ts'
import { SettingsContext } from './settings-context.ts'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CafeSettings>(() => readCafeSettings())

  const saveSettings = useCallback((next: CafeSettings) => {
    writeCafeSettings(next)
    setSettings(readCafeSettings())
  }, [])

  const toggleTheme = useCallback(() => {
    setSettings((current) => {
      const next: CafeSettings = {
        ...current,
        theme: current.theme === 'dark' ? 'light' : 'dark',
      }
      writeCafeSettings(next)
      return readCafeSettings()
    })
  }, [])

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset['paper'] = isPaperWidth(settings.paperWidth) ? settings.paperWidth : '58'
    // Dark-only theme: never read or apply the stored light preference.
    root.dataset['theme'] = 'dark'
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  }, [settings.paperWidth])

  const value = useMemo(
    () => ({ settings, saveSettings, toggleTheme }),
    [settings, saveSettings, toggleTheme],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
