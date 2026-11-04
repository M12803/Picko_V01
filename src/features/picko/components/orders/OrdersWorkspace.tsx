import { useState } from 'react'
import { Link, useLocation } from '../../router-adapter.tsx'
import { routes } from '../../routes.ts'
import { useOrders } from '../../state/useOrders.ts'
import { ORDER_STATUS_LABELS } from '../../types/order.ts'
import type { Order, OrderStatus } from '../../types/order.ts'
import { formatNumber } from '../../utils/format.ts'
import {
  defaultOrderFilters,
  filterOrders,
  filtersAreActive,
} from '../../utils/orders.ts'
import type { OrderFilters } from '../../utils/orders.ts'
import { Button } from '../ui/Button.tsx'
import { OrderDetailsDialog } from './OrderDetailsDialog.tsx'
import { OrderList } from './OrderList.tsx'
import { OrderToolbar } from './OrderToolbar.tsx'

export function OrdersWorkspace({
  orders,
  filters,
  onFiltersChange,
  message,
  onMessage,
  onCreate,
}: {
  orders: Order[]
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
  message: string | null
  onMessage: (message: string | null) => void
  onCreate?: () => void
}) {
  const { pathname } = useLocation()
  const { updateStatus, setDemoNotification } = useOrders()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const visible = filterOrders(orders, filters)
  const selected = orders.find((order) => order.id === selectedId) ?? null

  async function changeStatus(order: Order, status: OrderStatus) {
    try {
      await updateStatus(order.id, status)
      onMessage(`اتحدّثت حالة الأوردر ${order.code} إلى ${ORDER_STATUS_LABELS[status]}.`)
    } catch {
      onMessage('متعذر حفظ تعديل الحالة على الجهاز.')
    }
  }

  async function toggleNotice(order: Order) {
    const recorded = order.notificationStatus !== 'demo'
    try {
      await setDemoNotification(order.id, recorded)
      onMessage(
        recorded
          ? `اتسجل تنبيه تجريبي للأوردر ${order.code}. مفيش إشعار اتبعت للعميل.`
          : `اتشال التنبيه التجريبي من الأوردر ${order.code}.`,
      )
    } catch {
      onMessage('متعذر حفظ التنبيه التجريبي.')
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <OrderToolbar
        filters={filters}
        onFiltersChange={onFiltersChange}
        onCreate={onCreate}
      />
      {filters.notice === 'demo' ? (
        <p className="border-b border-ready/40 bg-ready/15 px-4 py-2 text-sm text-ready">
          معروض بس الأوردرات اللي اتسجل لها تنبيه تجريبي. مفيش إشعار حقيقي اتبعت.
        </p>
      ) : null}
      {message ? (
        <p role="status" className="border-b border-line bg-elevated px-4 py-2 text-sm text-muted">
          {message}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted">
        <p>النتائج: {formatNumber(visible.length)}</p>
        {filtersAreActive(filters) ? (
          <button
            type="button"
            className="font-medium text-ink hover:text-ink"
            onClick={() => onFiltersChange(defaultOrderFilters)}
          >
            مسح التصفية
          </button>
        ) : pathname === routes.orders ? null : (
          <Link to={routes.orders} className="font-medium text-ink hover:text-ink">
            كل الطلبات
          </Link>
        )}
      </div>
      {visible.length === 0 ? (
        <div className="px-4 pb-8 text-center">
          <h2 className="text-base font-semibold text-ink">مفيش أوردرات مطابقة</h2>
          <p className="mt-2 text-sm text-muted">جرّب كلمة تانية أو غيّر الحالة.</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => onFiltersChange(defaultOrderFilters)}>
              مسح البحث
            </Button>
          </div>
        </div>
      ) : (
        <OrderList
          orders={visible}
          onOpen={(order) => setSelectedId(order.id)}
          onStatus={(order, status) => void changeStatus(order, status)}
        />
      )}
      <OrderDetailsDialog
        order={selected}
        onClose={() => setSelectedId(null)}
        onStatus={(order, status) => void changeStatus(order, status)}
        onToggleNotice={(order) => void toggleNotice(order)}
      />
    </section>
  )
}
