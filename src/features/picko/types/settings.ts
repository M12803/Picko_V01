export const PAPER_WIDTHS = ['58', '80'] as const

export type PaperWidth = (typeof PAPER_WIDTHS)[number]

export function isPaperWidth(value: unknown): value is PaperWidth {
  return value === '58' || value === '80'
}

export const THEMES = ['dark', 'light'] as const

export type Theme = (typeof THEMES)[number]

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

export type CafeSettings = {
  cafeName: string
  branch: string
  simulateLoadError: boolean
  paperWidth: PaperWidth
  theme: Theme
}

export const defaultCafeSettings: CafeSettings = {
  cafeName: 'كافيه لمّة',
  branch: 'فرع الزمالك',
  simulateLoadError: false,
  paperWidth: '58',
  theme: 'light',
}
