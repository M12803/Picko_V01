import { useRef, useState } from 'react'
import { ApiError } from '../../services/api/ordersApi.ts'
import { cashierStatusLabel, ORDER_STATUSES } from '../../types/order.ts'
import { useOrders } from '../../state/useOrders.ts'
import { compareByCreation } from '../../utils/orders.ts'
import { Button } from '../ui/Button.tsx'

export function CashierOrderList() {
  const { orders, status, errorMessage, reload, completeOrder } = useOrders()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)
  const pendingRef = useRef<string | null>(null)
  const sorted = [...orders].sort(compareByCreation)

  async function markComplete(id: string) {
    if (pendingRef.current) return
    pendingRef.current = id
    setPendingId(id)
    setRowError(null)
    try {
      await completeOrder(id)
    } catch (error) {
      setRowError(
        error instanceof ApiError ? error.message : 'تعذر تحديث حالة الأوردر. حاول مرة تانية.',
      )
    } finally {
      pendingRef.current = null
      setPendingId(null)
    }
  }

  if (status === 'loading') {
    return (
      <p className="px-4 py-6 text-sm text-muted" role="status">
        بنحمّل الطلبات...
      </p>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-3 px-4 py-6">
        <p className="text-sm text-rose-300" role="alert">
          {errorMessage}
        </p>
        <Button variant="secondary" onClick={reload}>
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <p className="px-4 py-6 text-sm leading-6 text-muted">
        لسه مفيش طلبات. اكتب رقم الأوردر وولّد QR.
      </p>
    )
  }

  return (
    <div>
      {rowError ? (
        <p className="px-4 pt-3 text-sm text-rose-300" role="alert">
          {rowError}
        </p>
      ) : null}
      <ul className="divide-y divide-line">
        {sorted.map((order) => {
          const completed = order.status === ORDER_STATUSES.completed
          const pending = pendingId === order.id
          return (
            <li key={order.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-semibold tabular-nums text-ink" dir="ltr">
                {order.code}
              </span>
              <button
                type="button"
                className="min-h-10 min-w-[7.5rem] max-w-[10rem] shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-center text-sm font-medium leading-5 text-ink hover:bg-elevated disabled:cursor-default disabled:bg-elevated disabled:text-muted disabled:hover:bg-elevated"
                disabled={completed || pendingId !== null}
                onClick={() => {
                  if (!completed) void markComplete(order.id)
                }}
              >
                {pending ? 'بيتحفظ...' : cashierStatusLabel(order.status)}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
