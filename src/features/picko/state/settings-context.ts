import { createContext } from 'react'
import type { CafeSettings } from '../types/settings.ts'

export type SettingsContextValue = {
  settings: CafeSettings
  saveSettings: (settings: CafeSettings) => void
  toggleTheme: () => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
