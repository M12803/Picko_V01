import type { ReactNode } from 'react'
import { cn } from '../../utils/cn.ts'
import {
  NOTIFICATION_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  QR_STATUS_LABELS,
} from '../../types/order.ts'
import type {
  NotificationStatus,
  OrderStatus,
  QrStatus,
} from '../../types/order.ts'

const tones = {
  stone: 'bg-elevated text-muted',
  amber: 'bg-ready/15 text-ready',
  emerald: 'bg-ok-dim text-ok',
  sky: 'bg-info-dim text-info',
  rose: 'bg-bad-dim text-bad',
} as const

const statusTone: Record<OrderStatus, keyof typeof tones> = {
  pending: 'stone',
  preparing: 'amber',
  ready: 'emerald',
  completed: 'sky',
  picked_up: 'emerald',
  cancelled: 'rose',
}

export function Badge({
  children,
  tone,
}: {
  children: ReactNode
  tone: keyof typeof tones
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={statusTone[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
}

export function QrStatusBadge({ status }: { status: QrStatus }) {
  const tone = status === 'issued' ? 'emerald' : status === 'waiting' ? 'amber' : 'stone'
  return <Badge tone={tone}>{QR_STATUS_LABELS[status]}</Badge>
}

export function NotificationBadge({ status }: { status: NotificationStatus }) {
  return (
    <Badge tone={status === 'demo' ? 'amber' : 'stone'}>
      {NOTIFICATION_STATUS_LABELS[status]}
    </Badge>
  )
}
