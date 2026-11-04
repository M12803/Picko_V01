import { Link } from '../../router-adapter.tsx'
import type { ReactNode } from 'react'
import { routes } from '../../routes.ts'
import { useOrders } from '../../state/useOrders.ts'
import type { Order } from '../../types/order.ts'
import { Button } from '../ui/Button.tsx'
import { ErrorState } from '../ui/ErrorState.tsx'
import { LoadingState } from '../ui/LoadingState.tsx'

export function OrdersGate({
  children,
  empty,
  withCards = false,
}: {
  children: (orders: Order[]) => ReactNode
  empty: ReactNode
  withCards?: boolean
}) {
  const { orders, status, errorMessage, reload } = useOrders()

  if (status === 'loading') return <LoadingState withCards={withCards} />
  if (status === 'error') {
    return (
      <ErrorState
        title="متعذر تحميل الأوردرات"
        description={errorMessage}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reload}>إعادة المحاولة</Button>
            <Link
              to={routes.settings}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-surface px-3.5 text-sm font-medium text-ink hover:bg-elevated"
            >
              فتح الإعدادات
            </Link>
          </div>
        }
      />
    )
  }
  if (orders.length === 0) return empty
  return children(orders)
}
