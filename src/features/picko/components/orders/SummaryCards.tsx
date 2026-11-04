import { Link } from '../../router-adapter.tsx'
import { routes } from '../../routes.ts'
import { formatNumber } from '../../utils/format.ts'
import { summarizeOrders, type OrderSummary } from '../../utils/orders.ts'
import type { Order } from '../../types/order.ts'

const cards: Array<{
  key: keyof OrderSummary
  label: string
  hint: string
  to: string
}> = [
  {
    key: 'total',
    label: 'إجمالي الطلبات',
    hint: 'محفوظة على الجهاز ده',
    to: routes.orders,
  },
  {
    key: 'preparing',
    label: 'جاري التحضير',
    hint: 'في المطبخ الآن',
    to: `${routes.orders}?status=preparing`,
  },
  {
    key: 'ready',
    label: 'قيد التحضير',
    hint: 'لسه بيتحضّر',
    to: `${routes.orders}?status=ready`,
  },
  {
    key: 'demoNotices',
    label: 'تم إرسال التنبيه',
    hint: 'عدّاد تجريبي، بدون إرسال حقيقي',
    to: `${routes.orders}?notice=demo`,
  },
]

export function SummaryCards({ orders }: { orders: Order[] }) {
  const summary = summarizeOrders(orders)

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.key}
          to={card.to}
          className="rounded-2xl border border-line bg-surface p-4 hover:border-mint/50"
        >
          <p className="text-sm text-muted">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-ink" dir="ltr">
            {formatNumber(summary[card.key])}
          </p>
          <p className="mt-1 text-xs text-muted">{card.hint}</p>
        </Link>
      ))}
    </section>
  )
}
