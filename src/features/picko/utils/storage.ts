const STORAGE_PREFIX = 'smart-order.'

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`
}

/**
 * Reads JSON from localStorage.
 * Returns the fallback when the key is missing or the stored value is not JSON.
 * Callers should still check the shape of the parsed value.
 */
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(storageKey(key), JSON.stringify(value))
}

export function hasStorage(key: string): boolean {
  try {
    return localStorage.getItem(storageKey(key)) !== null
  } catch {
    return false
  }
}
