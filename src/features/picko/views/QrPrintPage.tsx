import { useState } from 'react'
import { Link } from '../router-adapter.tsx'
import { QrPreview } from '../components/qr/QrPreview.tsx'
import { OrdersGate } from '../components/orders/OrdersGate.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { QrStatusBadge } from '../components/ui/Badge.tsx'
import { buildTrackingUrl } from '../config/publicUrl.ts'
import { printTrackingSlip } from '../components/print/printTrackingSlip.tsx'
import { routes } from '../routes.ts'
import { ORDER_STATUS_LABELS } from '../types/order.ts'
import type { Order } from '../types/order.ts'
import { compareByCreation } from '../utils/orders.ts'

function QrOrderList({ orders }: { orders: Order[] }) {
  const sorted = [...orders].sort(compareByCreation)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = sorted.find((order) => order.id === selectedId) ?? null

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="text-base font-semibold text-ink">رموز QR المحفوظة</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          توليد رمز جديد بيتم من نظرة عامة برقم نقطة البيع. من هنا تقدر تعرض الرمز تاني وتطبعه.
        </p>
      </section>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {sorted.map((order) => (
          <li
            key={order.id}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold tabular-nums" dir="ltr">
                #{order.code}
              </p>
              {order.customerName ? (
                <p className="text-sm text-muted">{order.customerName}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <QrStatusBadge status={order.qrStatus} />
              {order.trackingToken ? (
                <>
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink hover:bg-elevated"
                    onClick={() => setSelectedId(order.id)}
                  >
                    عرض الرمز
                  </button>
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink hover:bg-elevated"
                    onClick={() =>
                      printTrackingSlip({
                        orderCode: order.code,
                        trackingUrl: buildTrackingUrl(order.trackingToken ?? ''),
                      })
                    }
                  >
                    طباعة
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted">مفيش رمز مرتبط</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {selected?.trackingToken ? (
        <QrPreview
          key={selected.trackingToken}
          orderCode={selected.code}
          createdAt={selected.createdAt}
          trackingUrl={buildTrackingUrl(selected.trackingToken)}
          statusLabel={ORDER_STATUS_LABELS[selected.status]}
        />
      ) : null}
    </div>
  )
}

export function QrPrintPage() {
  return (
    <OrdersGate
      empty={
        <EmptyState
          title="مفيش أوردرات للطباعة"
          description="لما الكاشير يولّد QR من نظرة عامة، الرمز هيظهر هنا."
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
      {(orders) => <QrOrderList orders={orders} />}
    </OrdersGate>
  )
}
