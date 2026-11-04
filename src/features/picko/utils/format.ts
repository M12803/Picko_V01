const dateTime = new Intl.DateTimeFormat('ar-EG', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h12',
  numberingSystem: 'latn',
})

const archiveDateTime = new Intl.DateTimeFormat('ar-EG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h12',
  numberingSystem: 'latn',
})

const numbers = new Intl.NumberFormat('ar-EG', { numberingSystem: 'latn' })

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return dateTime.format(date)
}

export function formatArchiveDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return archiveDateTime.format(date)
}

export function formatDurationMs(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return '—'
  const totalMinutes = Math.floor(ms / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1000)
  if (totalMinutes < 1) return `${formatNumber(seconds)} ث`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours < 1) return `${formatNumber(minutes)} د`
  if (minutes === 0) return `${formatNumber(hours)} س`
  return `${formatNumber(hours)} س ${formatNumber(minutes)} د`
}

export function formatNumber(value: number): string {
  return numbers.format(value)
}

function sinceCount(
  count: number,
  one: string,
  two: string,
  few: string,
  many: string,
): string {
  if (count === 1) return `منذ ${one}`
  if (count === 2) return `منذ ${two}`
  if (count >= 3 && count <= 10) return `منذ ${count} ${few}`
  return `منذ ${count} ${many}`
}

/** Full Arabic unit. The board used to abbreviate a day as «ي». */
export function formatElapsedAgo(iso: string, now = Date.now()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60_000))
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return sinceCount(minutes, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return sinceCount(hours, 'ساعة', 'ساعتين', 'ساعات', 'ساعة')
  const days = Math.floor(hours / 24)
  return sinceCount(days, 'يوم', 'يومين', 'أيام', 'يوم')
}

/** Short Arabic relative time matching the cashier board, with Latin digits. */
export function formatRelativeAgo(iso: string, now = Date.now()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60_000))
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} د`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} س`
  const days = Math.floor(hours / 24)
  return `منذ ${days} ي`
}
