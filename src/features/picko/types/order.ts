import { isTrackingToken } from '../utils/trackingToken.ts'

export const ORDER_STATUSES = {
  pending: 'pending',
  preparing: 'preparing',
  ready: 'ready',
  completed: 'completed',
  pickedUp: 'picked_up',
  cancelled: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]

/** Kitchen flow from a new order to handoff. Cancelled sits outside this path. */
export const ORDER_STATUS_FLOW = [
  ORDER_STATUSES.pending,
  ORDER_STATUSES.preparing,
  ORDER_STATUSES.ready,
  ORDER_STATUSES.completed,
  ORDER_STATUSES.pickedUp,
] as const

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'تم استلام الطلب',
  preparing: 'جاري التحضير',
  ready: 'قيد التحضير',
  completed: 'جاهز للاستلام',
  picked_up: 'تم التسليم',
  cancelled: 'ملغي',
}

/**
 * Forward kitchen path only.
 * تراجع from completed → ready is a 5-second cashier correction, not a regular next step.
 * Customer push and live status stay on قيد التحضير until that window ends.
 */
export const NEXT_ORDER_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: [ORDER_STATUSES.preparing, ORDER_STATUSES.cancelled],
  preparing: [ORDER_STATUSES.ready, ORDER_STATUSES.cancelled],
  ready: [ORDER_STATUSES.completed, ORDER_STATUSES.cancelled],
  completed: [ORDER_STATUSES.pickedUp],
  picked_up: [],
  cancelled: [],
}

/** Matches the server delay before the customer is told the order is ready. */
export const READY_UNDO_MS = 3_000

export function remainingReadyUndoMs(updatedAt: string, now = Date.now()): number {
  const at = Date.parse(updatedAt)
  if (!Number.isFinite(at)) return 0
  return Math.max(0, at + READY_UNDO_MS - now)
}

export function canUndoReadyHandoff(
  status: OrderStatus,
  updatedAt: string,
  now = Date.now(),
): boolean {
  return status === ORDER_STATUSES.completed && remainingReadyUndoMs(updatedAt, now) > 0
}

/** Board column status. During the undo window a completed order stays in قيد التحضير. */
export function cashierBoardStatus(
  status: OrderStatus,
  updatedAt: string,
  now = Date.now(),
): OrderStatus {
  return canUndoReadyHandoff(status, updatedAt, now) ? ORDER_STATUSES.ready : status
}

export const QR_STATUSES = {
  missing: 'missing',
  waiting: 'waiting',
  issued: 'issued',
} as const

export type QrStatus = (typeof QR_STATUSES)[keyof typeof QR_STATUSES]

export const QR_STATUS_LABELS: Record<QrStatus, string> = {
  missing: 'بدون رمز',
  waiting: 'بانتظار الطباعة',
  issued: 'تم إنشاء الرمز',
}

export const NOTIFICATION_STATUSES = {
  none: 'none',
  demo: 'demo',
} as const

export type NotificationStatus =
  (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES]

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  none: 'لم يُرسل',
  demo: 'تنبيه تجريبي',
}

export type OrderItem = {
  id: string
  name: string
  quantity: number
  note?: string | undefined
}

export type Order = {
  id: string
  /** Order number typed from the cafe POS. This is not what the QR encodes. */
  code: string
  /**
   * Secret tracking id. Present only after the cashier generates a QR.
   * The public URL is /track/<trackingToken>.
   */
  trackingToken?: string | undefined
  /** Public tracking URL from the API. Used to reprint the existing QR. */
  trackingUrl?: string | undefined
  customerName: string
  items: OrderItem[]
  status: OrderStatus
  qrStatus: QrStatus
  /** Demo bookkeeping only. This never means a real notification was sent. */
  notificationStatus: NotificationStatus
  /** ISO-8601 timestamps, so the same shape can move to Firestore later. */
  createdAt: string
  updatedAt: string
  note?: string | undefined
}

const ORDER_STATUS_VALUES = new Set<string>(Object.values(ORDER_STATUSES))
const QR_STATUS_VALUES = new Set<string>(Object.values(QR_STATUSES))
const NOTIFICATION_STATUS_VALUES = new Set<string>(
  Object.values(NOTIFICATION_STATUSES),
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUS_VALUES.has(value)
}

export function isQrStatus(value: string): value is QrStatus {
  return QR_STATUS_VALUES.has(value)
}

export function isNotificationStatus(value: string): value is NotificationStatus {
  return NOTIFICATION_STATUS_VALUES.has(value)
}

export function canMoveOrderTo(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT_ORDER_STATUSES[from].includes(to)
}

/** Orders still moving through the cafe. A finished number can be used again. */
export function isActiveOrderStatus(status: OrderStatus): boolean {
  return (
    status === ORDER_STATUSES.pending ||
    status === ORDER_STATUSES.preparing ||
    status === ORDER_STATUSES.ready
  )
}

/** Cashier and customer label. Stored values stay ready and completed. */
export function cashierStatusLabel(
  status: OrderStatus,
  updatedAt?: string,
  now = Date.now(),
): string {
  const visible =
    updatedAt === undefined ? status : cashierBoardStatus(status, updatedAt, now)
  return ORDER_STATUS_LABELS[visible]
}

export function isOrderItem(value: unknown): value is OrderItem {
  if (!isRecord(value)) return false

  return (
    typeof value['id'] === 'string' &&
    value['id'].trim() !== '' &&
    typeof value['name'] === 'string' &&
    value['name'].trim() !== '' &&
    typeof value['quantity'] === 'number' &&
    Number.isInteger(value['quantity']) &&
    value['quantity'] > 0 &&
    (value['note'] === undefined || typeof value['note'] === 'string')
  )
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

export function isOrder(value: unknown): value is Order {
  if (!isRecord(value)) return false

  return (
    typeof value['id'] === 'string' &&
    value['id'].trim() !== '' &&
    typeof value['code'] === 'string' &&
    value['code'].trim() !== '' &&
    typeof value['customerName'] === 'string' &&
    (value['trackingToken'] === undefined ||
      (typeof value['trackingToken'] === 'string' &&
        isTrackingToken(value['trackingToken']))) &&
    typeof value['status'] === 'string' &&
    isOrderStatus(value['status']) &&
    typeof value['qrStatus'] === 'string' &&
    isQrStatus(value['qrStatus']) &&
    typeof value['notificationStatus'] === 'string' &&
    isNotificationStatus(value['notificationStatus']) &&
    Array.isArray(value['items']) &&
    value['items'].every(isOrderItem) &&
    isIsoDate(value['createdAt']) &&
    isIsoDate(value['updatedAt']) &&
    (value['note'] === undefined || typeof value['note'] === 'string')
  )
}

/** Fills missing demo fields, then drops anything that still is not an order. */
export function parseOrder(value: unknown): Order | null {
  if (!isRecord(value)) return null

  const qrStatus =
    typeof value['qrStatus'] === 'string' && isQrStatus(value['qrStatus'])
      ? value['qrStatus']
      : QR_STATUSES.missing
  const notificationStatus =
    typeof value['notificationStatus'] === 'string' &&
    isNotificationStatus(value['notificationStatus'])
      ? value['notificationStatus']
      : NOTIFICATION_STATUSES.none

  const candidate = { ...value, qrStatus, notificationStatus }
  return isOrder(candidate) ? candidate : null
}
