import {
  NEXT_ORDER_STATUSES,
  NOTIFICATION_STATUSES,
  ORDER_STATUS_LABELS,
  QR_STATUS_LABELS,
} from '../../types/order.ts'
import type { Order, OrderStatus } from '../../types/order.ts'
import { buildTrackingUrl } from '../../config/publicUrl.ts'
import { formatDateTime, formatNumber } from '../../utils/format.ts'
import { printTrackingSlip } from '../print/printTrackingSlip.tsx'
import {
  NotificationBadge,
  OrderStatusBadge,
  QrStatusBadge,
} from '../ui/Badge.tsx'
import { Button } from '../ui/Button.tsx'
import { Modal } from '../ui/Modal.tsx'

export function OrderDetailsDialog({
  order,
  onClose,
  onStatus,
  onToggleNotice,
}: {
  order: Order | null
  onClose: () => void
  onStatus: (order: Order, status: OrderStatus) => void
  onToggleNotice: (order: Order) => void
}) {
  const recorded = order?.notificationStatus === NOTIFICATION_STATUSES.demo

  return (
    <Modal open={order !== null} title="تفاصيل الأوردر" onClose={onClose}>
      {order ? (
        <div className="space-y-5">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">رقم الأوردر</dt>
              <dd className="mt-1 font-semibold tabular-nums" dir="ltr">
                #{order.code}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">العميل</dt>
              <dd className="mt-1">{order.customerName || 'غير مسجل — الرقم من نقطة البيع'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">وقت الإنشاء</dt>
              <dd className="mt-1">{formatDateTime(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">آخر تحديث</dt>
              <dd className="mt-1">{formatDateTime(order.updatedAt)}</dd>
            </div>
          </dl>

          <div>
            <h3 className="text-sm font-medium text-muted">الأصناف</h3>
            {order.items.length > 0 ? (
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span>
                      {item.name}
                      {item.note ? (
                        <span className="mt-0.5 block text-xs text-muted">{item.note}</span>
                      ) : null}
                    </span>
                    <span className="tabular-nums text-muted" dir="ltr">
                      ×{formatNumber(item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">
                الأصناف موجودة في نقطة البيع، ومش بننسخها هنا.
              </p>
            )}
            {order.note ? (
              <p className="mt-2 text-sm text-muted">ملاحظة: {order.note}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <QrStatusBadge status={order.qrStatus} />
            <NotificationBadge status={order.notificationStatus} />
          </div>

          <div className="rounded-xl bg-elevated px-3 py-3 text-sm text-muted">
            <p>حالة QR الحالية: {QR_STATUS_LABELS[order.qrStatus]}.</p>
            <p className="mt-1">
              {order.trackingToken
                ? 'الرمز اتولد وبيحتوي رابط تتبع، مش رقم الأوردر لوحده.'
                : 'الأوردر ده من البيانات التجريبية ومفيش رمز QR مرتبط بيه.'}
            </p>
            {order.trackingToken ? (
              <Button
                className="mt-3"
                onClick={() =>
                  printTrackingSlip({
                    orderCode: order.code,
                    trackingUrl: buildTrackingUrl(order.trackingToken ?? ''),
                  })
                }
              >
                طباعة
              </Button>
            ) : null}
          </div>

          <div className="rounded-xl border border-ready/40 bg-ready/15 px-3 py-3 text-sm text-ready">
            {recorded
              ? 'متسجل تنبيه تجريبي على الجهاز. مفيش إشعار حقيقي اتبعت للعميل.'
              : 'لسه مفيش تنبيه تجريبي للأوردر ده، ومفيش إشعار بيتبعت من هنا.'}
          </div>

          {NEXT_ORDER_STATUSES[order.status].length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {NEXT_ORDER_STATUSES[order.status].map((status) => (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'secondary' : 'primary'}
                  onClick={() => onStatus(order, status)}
                >
                  {ORDER_STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">مفيش تحديث متاح للحالة دي.</p>
          )}

          <Button variant="secondary" onClick={() => onToggleNotice(order)}>
            {recorded ? 'إلغاء التنبيه التجريبي' : 'تسجيل تنبيه تجريبي'}
          </Button>
        </div>
      ) : null}
    </Modal>
  )
}
