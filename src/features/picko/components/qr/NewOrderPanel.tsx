import { ScanLine } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useOrders } from '../../state/useOrders.ts'
import { cashierStatusLabel } from '../../types/order.ts'
import type { Order } from '../../types/order.ts'
import { QrPreview } from './QrPreview.tsx'
import { Button } from '../ui/Button.tsx'

export function NewOrderPanel({
  preview,
  trackingUrl,
  now,
  onIssued,
}: {
  preview: Order | null
  trackingUrl: string | null
  now?: number
  onIssued: (order: Order, trackingUrl: string) => void
}) {
  const { issueTrackingQr } = useOrders()
  const [orderNumber, setOrderNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const numberRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    numberRef.current?.focus()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await issueTrackingQr(orderNumber)
      if (!result.ok) {
        setError(result.message)
        return
      }

      setOrderNumber('')
      setSuccess(`اتسجل ${result.order.code}`)
      onIssued(result.order, result.trackingUrl)
      numberRef.current?.focus()
    } catch {
      setError('تعذر حفظ الأوردر. حاول مرة تانية.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <aside className="orders-side">
      <section className="orders-issue-panel">
        <form className="flex gap-2" onSubmit={(event) => void submit(event)}>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">رقم الأوردر</span>
            <ScanLine
              className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-accent"
              aria-hidden="true"
            />
            <input
              id="pos-order-number"
              ref={numberRef}
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="رقم الأوردر"
              autoComplete="off"
              autoFocus
              spellCheck={false}
              dir="ltr"
              className="h-12 w-full rounded-xl border border-accent/50 bg-elevated ps-11 pe-3 text-center text-xl font-semibold tracking-wide text-ink outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted focus:border-accent"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'order-number-error' : undefined}
            />
          </label>
          <Button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 min-w-24 items-center justify-center rounded-xl bg-gradient-to-b from-accent-hover to-accent px-4 text-base font-semibold text-on-accent shadow-[0_12px_26px_-12px] shadow-accent/70 transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
          >
            {saving ? '...' : 'إضافة'}
          </Button>
        </form>
        {error ? (
          <p id="order-number-error" role="alert" className="mt-2 text-sm leading-6 text-rose-400">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="mt-2 text-sm font-medium leading-6 text-ok">
            {success}
          </p>
        ) : null}
      </section>
      {preview ? (
        <QrPreview
          key={preview.trackingToken ?? preview.id}
          orderCode={preview.code}
          createdAt={preview.createdAt}
          trackingUrl={trackingUrl}
          statusLabel={cashierStatusLabel(preview.status, preview.updatedAt, now)}
          customerName={preview.customerName}
          items={preview.items}
          note={preview.note}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-line px-3 py-6 text-sm leading-6 text-muted">
          اكتب رقم الأوردر. الـ QR والطباعة هيظهروا هنا.
        </p>
      )}
    </aside>
  )
}
