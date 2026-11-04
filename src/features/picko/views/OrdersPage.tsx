import { useState } from 'react'
import { Link, useSearchParams } from '../router-adapter.tsx'
import { OrdersGate } from '../components/orders/OrdersGate.tsx'
import { OrdersWorkspace } from '../components/orders/OrdersWorkspace.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { routes } from '../routes.ts'
import {
  parseNoticeFilter,
  parseStatusFilter,
  type OrderFilters,
} from '../utils/orders.ts'

export function OrdersPage() {
  const [params, setParams] = useSearchParams()
  const [message, setMessage] = useState<string | null>(null)
  const filters: OrderFilters = {
    query: params.get('q') ?? '',
    status: parseStatusFilter(params.get('status')),
    notice: parseNoticeFilter(params.get('notice')),
  }

  function updateFilters(next: OrderFilters) {
    const nextParams = new URLSearchParams()
    if (next.query.trim()) nextParams.set('q', next.query)
    if (next.status !== 'all') nextParams.set('status', next.status)
    if (next.notice !== 'all') nextParams.set('notice', next.notice)
    setParams(nextParams, { replace: true })
  }

  return (
    <OrdersGate
      empty={
        <EmptyState
          title="لسه مفيش أوردرات"
          description="توليد رمز QR بيتم من نظرة عامة برقم نقطة البيع."
          action={
            <Link
              to={routes.overview}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-mint px-3.5 text-sm font-medium text-on-mint hover:bg-mint-hover"
            >
              الذهاب إلى نظرة عامة
            </Link>
          }
        />
      }
    >
      {(orders) => (
        <OrdersWorkspace
          orders={orders}
          filters={filters}
          onFiltersChange={updateFilters}
          message={message}
          onMessage={setMessage}
        />
      )}
    </OrdersGate>
  )
}
