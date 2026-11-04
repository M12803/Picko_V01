import { defaultCafeSettings, isPaperWidth, isTheme } from '../../types/settings.ts'
import type { CafeSettings } from '../../types/settings.ts'
import { readStorage, writeStorage } from '../../utils/storage.ts'

const SETTINGS_KEY = 'settings'
const MAX_CAFE_NAME_LENGTH = 40

function readText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

export function readCafeSettings(): CafeSettings {
  const stored = readStorage<unknown>(SETTINGS_KEY, null)
  if (!stored || typeof stored !== 'object') return defaultCafeSettings

  const record = stored as Record<string, unknown>
  const cafeName = readText(record['cafeName'], defaultCafeSettings.cafeName).slice(
    0,
    MAX_CAFE_NAME_LENGTH,
  )

  return {
    cafeName,
    branch: readText(record['branch'], defaultCafeSettings.branch),
    simulateLoadError: record['simulateLoadError'] === true,
    paperWidth: isPaperWidth(record['paperWidth']) ? record['paperWidth'] : '58',
    theme: isTheme(record['theme']) ? record['theme'] : defaultCafeSettings.theme,
  }
}

export function writeCafeSettings(settings: CafeSettings): void {
  const cafeName = settings.cafeName.trim().slice(0, MAX_CAFE_NAME_LENGTH)
  writeStorage(SETTINGS_KEY, {
    cafeName: cafeName || defaultCafeSettings.cafeName,
    branch: settings.branch.trim() || defaultCafeSettings.branch,
    simulateLoadError: settings.simulateLoadError === true,
    paperWidth: isPaperWidth(settings.paperWidth) ? settings.paperWidth : '58',
    theme: isTheme(settings.theme) ? settings.theme : defaultCafeSettings.theme,
  })
}
