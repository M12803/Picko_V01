import {
  NEXT_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  isOrderStatus,
} from '../../types/order.ts'
import type { Order, OrderStatus } from '../../types/order.ts'
import { formatDateTime } from '../../utils/format.ts'
import { fieldClassName } from '../ui/fieldClass.ts'
import { buildTrackingUrl } from '../../config/publicUrl.ts'
import { printTrackingSlip } from '../print/printTrackingSlip.tsx'
import {
  NotificationBadge,
  OrderStatusBadge,
  QrStatusBadge,
} from '../ui/Badge.tsx'

function PrintOrderButton({ order }: { order: Order }) {
  if (!order.trackingToken) return null

  const trackingUrl = buildTrackingUrl(order.trackingToken)

  return (
    <button
      type="button"
      className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink hover:bg-elevated"
      onClick={() => printTrackingSlip({ orderCode: order.code, trackingUrl })}
    >
      طباعة
    </button>
  )
}

function OrderActions({
  order,
  onOpen,
  onStatus,
}: {
  order: Order
  onOpen: (order: Order) => void
  onStatus: (order: Order, status: OrderStatus) => void
}) {
  const nextStatuses = NEXT_ORDER_STATUSES[order.status]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink hover:bg-elevated"
        onClick={() => onOpen(order)}
      >
        التفاصيل
      </button>
      <PrintOrderButton order={order} />
      <select
        aria-label={`تحديث حالة الأوردر ${order.code}`}
        className={`${fieldClassName} w-auto min-w-36`}
        value={order.status}
        disabled={nextStatuses.length === 0}
        onChange={(event) => {
          const next = event.target.value
          if (isOrderStatus(next) && next !== order.status) onStatus(order, next)
        }}
      >
        <option value={order.status}>{ORDER_STATUS_LABELS[order.status]}</option>
        {nextStatuses.map((status) => (
          <option key={status} value={status}>
            {ORDER_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>
  )
}

function OrderIdentity({ order }: { order: Order }) {
  return (
    <div>
      <p className="font-semibold tabular-nums text-ink" dir="ltr">
        #{order.code}
      </p>
      {order.customerName ? (
        <p className="text-xs text-muted">{order.customerName}</p>
      ) : null}
    </div>
  )
}

export function OrderList({
  orders,
  onOpen,
  onStatus,
}: {
  orders: Order[]
  onOpen: (order: Order) => void
  onStatus: (order: Order, status: OrderStatus) => void
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">قائمة الأوردرات</caption>
          <thead className="bg-elevated text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                رقم الأوردر
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                وقت الإنشاء
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                الحالة
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                حالة QR
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                حالة الإشعار
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => (
              <tr key={order.id} className="align-top">
                <td className="px-4 py-3">
                  <OrderIdentity order={order} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {formatDateTime(order.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <QrStatusBadge status={order.qrStatus} />
                </td>
                <td className="px-4 py-3">
                  <NotificationBadge status={order.notificationStatus} />
                </td>
                <td className="px-4 py-3">
                  <OrderActions order={order} onOpen={onOpen} onStatus={onStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {orders.map((order) => (
          <article key={order.id} className="rounded-xl border border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <OrderIdentity order={order} />
              <OrderStatusBadge status={order.status} />
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm min-[420px]:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">وقت الإنشاء</dt>
                <dd className="mt-1 text-ink">{formatDateTime(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">حالة QR</dt>
                <dd className="mt-1">
                  <QrStatusBadge status={order.qrStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">حالة الإشعار</dt>
                <dd className="mt-1">
                  <NotificationBadge status={order.notificationStatus} />
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <OrderActions order={order} onOpen={onOpen} onStatus={onStatus} />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
