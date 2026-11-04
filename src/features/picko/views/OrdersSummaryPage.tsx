import { useEffect, useState } from 'react'
import { ApiError, fetchOrderSummary, type OrderSummary } from '../services/api/ordersApi.ts'
import { useOrders } from '../state/useOrders.ts'

export function OrdersSummaryPage() {
  const { orders, status, errorMessage, reload } = useOrders()
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'ready') return
    let active = true

    void fetchOrderSummary()
      .then((next) => {
        if (!active) return
        setSummary(next)
        setSummaryError(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setSummary(null)
        setSummaryError(
          error instanceof ApiError ? error.message : 'تعذر حساب أعداد الطلبات.',
        )
      })

    return () => {
      active = false
    }
  }, [status, orders])

  return (
    <section className="space-y-5">
      <h1 className="text-lg font-semibold text-ink">الطلبات</h1>

      {status === 'loading' || (status === 'ready' && !summary && !summaryError) ? (
        <p className="text-sm text-muted" role="status">
          بنحسب أعداد الطلبات...
        </p>
      ) : null}

      {status === 'error' ? (
        <div className="space-y-3">
          <p className="text-sm text-rose-300" role="alert">
            {errorMessage}
          </p>
          <button
            type="button"
            className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm font-medium"
            onClick={reload}
          >
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {summaryError ? (
        <p className="text-sm text-rose-300" role="alert">
          {summaryError}
        </p>
      ) : null}

      {status === 'ready' && summary ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard label="إجمالي الطلبات" value={summary.total} />
          <SummaryCard label="جاهز للاستلام" value={summary.completed} />
          <SummaryCard label="قيد التحضير" value={summary.remaining} />
        </ul>
      ) : null}
    </section>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{value}</p>
    </li>
  )
}
