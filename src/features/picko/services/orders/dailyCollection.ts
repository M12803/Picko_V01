import { readStorage, writeStorage } from '../../utils/storage.ts'

const DAILY_COLLECTION_KEY = 'daily-collection'

type DailyCollection = {
  date: string
  orderIds: string[]
}

/** Local calendar day, not UTC. `2026-10-22` in the browser's timezone. */
export function localCalendarDate(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isDailyCollection(value: unknown): value is DailyCollection {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record['date'] === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/u.test(record['date']) &&
    Array.isArray(record['orderIds']) &&
    record['orderIds'].every((id) => typeof id === 'string' && id.trim() !== '')
  )
}

function readCollection(): DailyCollection | null {
  const stored = readStorage<unknown>(DAILY_COLLECTION_KEY, null)
  return isDailyCollection(stored) ? stored : null
}

/** Order ids shown on today's tables page. A stored older day is not today's collection. */
export function readTodayOrderIds(): string[] {
  const stored = readCollection()
  if (!stored || stored.date !== localCalendarDate()) return []
  return stored.orderIds
}

/** Remembers an existing order on today's board. Does not create or change its QR token. */
export function rememberDailyOrder(orderId: string): void {
  const today = localCalendarDate()
  const stored = readCollection()
  const orderIds = stored?.date === today ? [...stored.orderIds] : []
  if (!orderIds.includes(orderId)) orderIds.push(orderId)
  writeStorage<DailyCollection>(DAILY_COLLECTION_KEY, { date: today, orderIds })
}

/** Drops today's board only. Order records and QR tokens stay in the order store. */
export function clearTodayOrders(): void {
  writeStorage<DailyCollection>(DAILY_COLLECTION_KEY, {
    date: localCalendarDate(),
    orderIds: [],
  })
}
