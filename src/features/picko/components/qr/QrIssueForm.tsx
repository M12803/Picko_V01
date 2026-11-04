import { useState, type FormEvent } from 'react'
import { useOrders } from '../../state/useOrders.ts'
import { cashierStatusLabel } from '../../types/order.ts'
import type { Order } from '../../types/order.ts'
import { Button } from '../ui/Button.tsx'
import { fieldClassName } from '../ui/fieldClass.ts'
import { QrPreview } from './QrPreview.tsx'

export function QrIssueForm({
  preview,
  trackingUrl,
  onIssued,
}: {
  preview: Order | null
  trackingUrl: string | null
  onIssued: (order: Order, trackingUrl: string) => void
}) {
  const { issueTrackingQr } = useOrders()
  const [orderNumber, setOrderNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
      setSuccess(`اتعمل رمز QR للأوردر ${result.order.code}.`)
      onIssued(result.order, result.trackingUrl)
    } catch {
      setError('تعذر حفظ الأوردر في قاعدة البيانات. حاول مرة تانية.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="text-base font-semibold text-ink">توليد QR</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          اكتب رقم الأوردر من نقطة البيع. بعد التوليد تقدر تطبع إيصال التتبع.
        </p>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void submit(event)}>
          <label className="block min-w-0 flex-1 space-y-1.5 text-sm">
            <span className="font-medium text-muted">رقم الأوردر</span>
            <input
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="مثلاً: 1851"
              autoComplete="off"
              spellCheck={false}
              dir="ltr"
              className={`${fieldClassName} text-start`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'order-number-error' : undefined}
            />
          </label>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'بيتعمل الرمز...' : 'توليد QR'}
          </Button>
        </form>
        {error ? (
          <p id="order-number-error" role="alert" className="mt-3 text-sm text-rose-300">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="mt-3 text-sm text-muted">
            {success}
          </p>
        ) : null}
      </section>
      {preview && trackingUrl ? (
        <QrPreview
          key={preview.trackingToken}
          orderCode={preview.code}
          createdAt={preview.createdAt}
          trackingUrl={trackingUrl}
          statusLabel={cashierStatusLabel(preview.status)}
        />
      ) : null}
    </div>
  )
}
