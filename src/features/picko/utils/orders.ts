import { isOrderStatus } from '../types/order.ts'
import type { Order, OrderStatus } from '../types/order.ts'
import {
  NOTIFICATION_STATUSES,
  ORDER_STATUSES,
  QR_STATUSES,
} from '../types/order.ts'

export type StatusFilter = OrderStatus | 'all'
export type NoticeFilter = 'all' | 'demo'

export type OrderFilters = {
  query: string
  status: StatusFilter
  notice: NoticeFilter
}

export const defaultOrderFilters: OrderFilters = {
  query: '',
  status: 'all',
  notice: 'all',
}

export type OrderSummary = {
  total: number
  preparing: number
  ready: number
  demoNotices: number
}

export type NewOrderInput = {
  customerName: string
  items: { name: string; quantity: number }[]
  note?: string
}

export function parseStatusFilter(value: string | null): StatusFilter {
  if (value && isOrderStatus(value)) return value
  return 'all'
}

export function parseNoticeFilter(value: string | null): NoticeFilter {
  return value === 'demo' ? 'demo' : 'all'
}

export function filtersAreActive(filters: OrderFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.status !== 'all' ||
    filters.notice !== 'all'
  )
}

export function summarizeOrders(orders: Order[]): OrderSummary {
  return {
    total: orders.length,
    preparing: orders.filter((order) => order.status === ORDER_STATUSES.preparing)
      .length,
    ready: orders.filter((order) => order.status === ORDER_STATUSES.ready)
      .length,
    demoNotices: orders.filter(
      (order) => order.notificationStatus === NOTIFICATION_STATUSES.demo,
    ).length,
  }
}

export function filterOrders(orders: Order[], filters: OrderFilters): Order[] {
  const query = filters.query.trim().toLocaleLowerCase('ar')

  return orders
    .filter((order) => {
      if (filters.status !== 'all' && order.status !== filters.status) return false
      if (
        filters.notice === 'demo' &&
        order.notificationStatus !== NOTIFICATION_STATUSES.demo
      ) {
        return false
      }
      if (!query) return true

      const haystack = [
        order.code,
        order.customerName,
        order.note ?? '',
        ...order.items.map((item) => item.name),
      ]
        .join(' ')
        .toLocaleLowerCase('ar')

      return haystack.includes(query)
    })
    .sort(compareByCreation)
}

/** Oldest first. Status updates must not change this order. */
export function compareByCreation(a: Order, b: Order): number {
  const byTime = a.createdAt.localeCompare(b.createdAt)
  if (byTime !== 0) return byTime
  return a.id.localeCompare(b.id)
}

export type BoardSort = 'oldest' | 'newest' | 'code'

export function compareBoardOrders(sort: BoardSort): (a: Order, b: Order) => number {
  if (sort === 'newest') {
    return (a, b) => compareByCreation(b, a)
  }
  if (sort === 'code') {
    return (a, b) => {
      const byCode = a.code.localeCompare(b.code, 'en', { numeric: true })
      if (byCode !== 0) return byCode
      return compareByCreation(a, b)
    }
  }
  return compareByCreation
}

export function buildTrackingOrder(code: string, trackingToken: string): Order {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    code: code.trim(),
    trackingToken,
    customerName: '',
    items: [],
    status: ORDER_STATUSES.ready,
    qrStatus: QR_STATUSES.issued,
    notificationStatus: NOTIFICATION_STATUSES.none,
    createdAt: now,
    updatedAt: now,
  }
}

function nextOrderCode(orders: Order[]): string {
  const numbers = orders
    .map((order) => Number(order.code))
    .filter((value) => Number.isInteger(value))
  const next = Math.max(1840, ...numbers) + 1
  return String(next)
}

export function buildNewOrder(input: NewOrderInput, existing: Order[]): Order {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    code: nextOrderCode(existing),
    customerName: input.customerName.trim(),
    items: input.items.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name.trim(),
      quantity: item.quantity,
    })),
    status: ORDER_STATUSES.pending,
    qrStatus: QR_STATUSES.missing,
    notificationStatus: NOTIFICATION_STATUSES.none,
    createdAt: now,
    updatedAt: now,
    note: input.note?.trim() || undefined,
  }
}
