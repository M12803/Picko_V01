import { apiUrl } from '../../config/apiBase.ts'
import type { Order, OrderStatus } from '../../types/order.ts'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export type OrderSummary = {
  total: number
  completed: number
  remaining: number
}

export type DailyCard = {
  id: string
  code: string
  trackingUrl: string
}

export const RATING_STATES = {
  none: 'none',
  submitted: 'submitted',
  skipped: 'skipped',
} as const

export type RatingState = (typeof RATING_STATES)[keyof typeof RATING_STATES]

export type PublicOrder = {
  code: string
  status: OrderStatus
  rating: RatingState
}

export type PlaceRating = {
  id: string
  orderCode: string
  stars: number
  note: string | null
  createdAt: string
}

export type PlaceRatingList = {
  ratings: PlaceRating[]
  count: number
  average: number | null
}

type ApiOrder = {
  id: string
  code: string
  trackingToken: string | null
  trackingUrl: string | null
  customerName: string
  items: { id: string; name: string; quantity: number; note: string | null }[]
  status: OrderStatus
  qrStatus: Order['qrStatus']
  notificationStatus: Order['notificationStatus']
  createdAt: string
  updatedAt: string
  note: string | null
}

export async function fetchOrders(): Promise<Order[]> {
  const payload = await apiJson<{ orders: ApiOrder[] }>('/api/orders')
  return payload.orders.map(mapOrder)
}

export async function createTrackedOrder(
  code: string,
): Promise<{ order: Order; trackingUrl: string }> {
  const payload = await apiJson<{ order: ApiOrder; trackingUrl: string | null }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  if (!payload.trackingUrl) {
    throw new ApiError('الخادم لم يرجع رابط تتبع صالحًا للطباعة.', 503)
  }
  return { order: mapOrder(payload.order), trackingUrl: payload.trackingUrl }
}

export async function completeTrackedOrder(id: string): Promise<Order> {
  const payload = await apiJson<{ order: ApiOrder }>(`/api/orders/${id}/complete`, {
    method: 'POST',
  })
  return mapOrder(payload.order)
}

export async function reopenTrackedOrder(id: string): Promise<Order> {
  const payload = await apiJson<{ order: ApiOrder }>(`/api/orders/${id}/reopen`, {
    method: 'POST',
  })
  return mapOrder(payload.order)
}

export async function confirmPickup(token: string): Promise<PublicOrder> {
  const payload = await apiJson<{ order: PublicOrder }>(
    `/api/track/${encodeURIComponent(token)}/pickup`,
    { method: 'POST' },
  )
  return payload.order
}

export async function fetchOrderSummary(): Promise<OrderSummary> {
  return apiJson<OrderSummary>('/api/orders/summary')
}

export async function fetchDailyCards(): Promise<DailyCard[]> {
  const payload = await apiJson<{ orders: DailyCard[] }>('/api/daily-board')
  return payload.orders
}

export async function clearDailyCards(): Promise<void> {
  await apiJson('/api/daily-board/clear', { method: 'POST' })
}

export async function fetchPublicOrder(token: string): Promise<PublicOrder> {
  const payload = await apiJson<{ order: PublicOrder }>(`/api/track/${encodeURIComponent(token)}`)
  const rating = payload.order.rating
  return {
    ...payload.order,
    rating:
      rating === RATING_STATES.submitted || rating === RATING_STATES.skipped
        ? rating
        : RATING_STATES.none,
  }
}

export async function submitPlaceRating(
  token: string,
  input: { skipped: true } | { stars: number; note: string },
): Promise<RatingState> {
  const payload = await apiJson<{ rating: RatingState }>(
    `/api/track/${encodeURIComponent(token)}/rating`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
  return payload.rating
}

export async function fetchPlaceRatings(): Promise<PlaceRatingList> {
  return apiJson<PlaceRatingList>('/api/ratings')
}

export type ArchiveOrder = {
  id: string
  code: string
  status: OrderStatus
  createdAt: string
  readyAt: string | null
  pickedUpAt: string | null
  waitMs: number | null
}

export type ArchiveList = {
  orders: ArchiveOrder[]
  count: number
}

export async function fetchArchive(filters: {
  code: string
  from: string
  to: string
}): Promise<ArchiveList> {
  const params = new URLSearchParams()
  if (filters.code.trim() !== '') params.set('code', filters.code.trim())
  if (filters.from !== '') params.set('from', filters.from)
  if (filters.to !== '') params.set('to', filters.to)
  const query = params.toString()
  return apiJson<ArchiveList>(`/api/orders/archive${query ? `?${query}` : ''}`)
}

export async function fetchPushPublicKey(): Promise<string> {
  const payload = await apiJson<{ publicKey: string }>('/api/push/public-key')
  return payload.publicKey
}

export async function savePushSubscription(input: {
  token: string
  endpoint: string
  p256dh: string
  auth: string
  expiration: number | null
}): Promise<void> {
  await apiJson('/api/push/subscriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError('تعذر الاتصال بالخادم.', 0)
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string' && !payload.error.includes('Only HTML requests')
        ? payload.error
        : 'السيرفر الأصلي غير متصل بالموقع هنا حاليًا.'
    throw new ApiError(message, response.status)
  }
  if (!payload) throw new ApiError('السيرفر الأصلي غير متصل بالموقع هنا حاليًا.', 503)
  return payload as T
}

function mapOrder(order: ApiOrder): Order {
  return {
    id: order.id,
    code: order.code,
    trackingToken: order.trackingToken ?? undefined,
    trackingUrl: order.trackingUrl ?? undefined,
    customerName: order.customerName,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      note: item.note ?? undefined,
    })),
    status: order.status,
    qrStatus: order.qrStatus,
    notificationStatus: order.notificationStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    note: order.note ?? undefined,
  }
}
