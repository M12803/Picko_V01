import { Clock, Copy, Info, Link2, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import type { OrderItem } from '../../types/order.ts'
import { formatDateTime } from '../../utils/format.ts'
import { printTrackingSlip } from '../print/printTrackingSlip.tsx'
import { cn } from '../../utils/cn.ts'
import { copyText } from '../../utils/copyText.ts'
import { Button } from '../ui/Button.tsx'

const TRACKING_NOTE = 'امسح الكود لمشاركة الطلب مع العميل.'

export function QrPreview({
  orderCode,
  createdAt,
  trackingUrl,
  statusLabel,
  customerName,
  items,
  note,
}: {
  orderCode: string
  createdAt: string
  trackingUrl: string | null
  statusLabel?: string
  customerName?: string
  items?: OrderItem[]
  note?: string | undefined
}) {
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionFailed, setActionFailed] = useState(false)
  const [printing, setPrinting] = useState(false)
  const hasQr = Boolean(trackingUrl)
  const namedCustomer = customerName?.trim() ?? ''
  const visibleItems = items?.filter((item) => item.name.trim() !== '') ?? []
  const readyForPickup = statusLabel === 'جاهز للاستلام'
  const extraDetails = namedCustomer || visibleItems.length > 0 || Boolean(note?.trim())

  function announce(message: string, failed: boolean) {
    setActionFailed(failed)
    setActionMessage(message)
  }

  async function copyLink() {
    if (!trackingUrl) {
      announce('مفيش رابط تتبع للنسخ.', true)
      return
    }
    try {
      await copyText(trackingUrl, null)
      announce('اتنسخ الرابط.', false)
    } catch {
      announce('الرابط متحدد. انسخه بـ Ctrl+C.', true)
    }
  }

  async function printSlip() {
    if (!trackingUrl) {
      announce('مفيش رمز للطباعة.', true)
      return
    }
    if (printing) return
    setPrinting(true)
    try {
      const result = await printTrackingSlip({ orderCode, trackingUrl })
      if (result === 'opened') {
        announce('اتفتحت نافذة الطباعة.', false)
      } else if (result === 'busy') {
        announce('الطباعة شغالة.', true)
      } else {
        announce('تعذر فتح الطباعة.', true)
      }
    } finally {
      setPrinting(false)
    }
  }

  return (
    <section className="orders-qr-panel rounded-2xl border-2 border-line bg-surface p-4">
      <div className="orders-qr-identity min-w-0 space-y-1.5">
        <p className="text-4xl font-bold leading-none tabular-nums" dir="ltr">
          {orderCode}
        </p>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <Clock className="size-3.5" aria-hidden="true" />
          {formatDateTime(createdAt)}
        </p>
        {statusLabel ? (
          <span
            className={cn(
              'inline-flex w-fit min-h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold',
              readyForPickup ? 'bg-ok-dim text-ok' : 'bg-ready/20 text-ready',
            )}
          >
            <span
              className={cn('size-2 rounded-full', readyForPickup ? 'bg-ok' : 'bg-ready')}
              aria-hidden="true"
            />
            {statusLabel}
          </span>
        ) : null}
      </div>
      {hasQr && trackingUrl ? (
        <div className="orders-qr-code mx-auto shrink-0 rounded-2xl p-2.5">
          <QRCodeSVG
            value={trackingUrl}
            size={160}
            level="M"
            marginSize={2}
            title={`رمز تتبع الأوردر ${orderCode}`}
          />
        </div>
      ) : (
        <div className="mx-auto flex size-[168px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-line px-3 text-center text-sm leading-6 text-muted">
          مفيش رمز
        </div>
      )}

      {actionMessage ? (
        <p
          role={actionFailed ? 'alert' : 'status'}
          className={`mt-2 text-sm leading-6 ${actionFailed ? 'text-rose-400' : 'text-ok'}`}
        >
          {actionMessage}
        </p>
      ) : null}

      {hasQr && trackingUrl ? (
        <>
          <Button variant="ghost"
            type="button"
            onClick={() => void copyLink()}
            className="orders-qr-link flex min-h-10 w-full items-center justify-between gap-2 rounded-xl bg-elevated px-3 py-2 text-start transition hover:bg-app"
          >
            <span className="truncate font-mono text-xs text-muted" dir="ltr">
              {trackingUrl}
            </span>
            <Link2 className="size-4 shrink-0 text-muted" aria-hidden="true" />
          </Button>
          <div className="orders-qr-actions mt-1 flex gap-2">
            <Button
              type="button"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-accent-hover to-accent px-3 text-sm font-semibold text-on-accent shadow-[0_12px_26px_-12px] shadow-accent/70 transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
              disabled={printing}
              onClick={() => void printSlip()}
            >
              <Printer className="size-4" aria-hidden="true" />
              {printing ? 'بيطبع...' : 'طباعة'}
            </Button>
            <Button variant="secondary"
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-elevated px-3 text-sm font-medium text-ink hover:bg-app"
              onClick={() => void copyLink()}
            >
              <Copy className="size-4" aria-hidden="true" />
              نسخ
            </Button>
          </div>
        </>
      ) : null}

      <p className="mt-2 flex items-center gap-1.5 text-xs leading-5 text-muted">
        <Info className="size-3.5 shrink-0 text-info" aria-hidden="true" />
        {hasQr && trackingUrl ? TRACKING_NOTE : 'الرابط بيظهر أول ما يتسجل الأوردر.'}
      </p>

      {extraDetails ? (
        <div className="mt-2 space-y-1 rounded-xl bg-elevated px-3 py-2 text-sm leading-6">
          {namedCustomer ? <p>الاسم: {namedCustomer}</p> : null}
          {visibleItems.length > 0 ? (
            <ul>
              {visibleItems.map((item) => (
                <li key={item.id}>
                  {item.quantity}× {item.name}
                  {item.note ? ` — ${item.note}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
          {note?.trim() ? <p>{note}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
