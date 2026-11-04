import { Star } from 'lucide-react'
import { useState } from 'react'
import { ApiError, submitPlaceRating, type RatingState } from '../../services/api/ordersApi.ts'
import { fieldClassName } from '../ui/fieldClass.ts'
import { cn } from '../../utils/cn.ts'
import { Button } from '../ui/Button'

const STAR_VALUES = [1, 2, 3, 4, 5] as const

export function PlaceRatingForm({
  token,
  rating,
  onRated,
}: {
  token: string
  rating: RatingState
  onRated: (next: RatingState) => void
}) {
  const [stars, setStars] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (rating === 'skipped') return null

  if (rating === 'submitted') {
    return (
      <p className="mt-6 text-sm leading-6 text-muted" role="status">
        شكرًا على تقييمك للمكان.
      </p>
    )
  }

  async function send(input: { skipped: true } | { stars: number; note: string }) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const next = await submitPlaceRating(token, input)
      onRated(next)
    } catch (sendError) {
      setError(
        sendError instanceof ApiError ? sendError.message : 'تعذر حفظ التقييم. حاول مرة تانية.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-6 border-t border-line pt-5">
      <h2 className="text-base font-semibold">قيّم المكان</h2>
      <p className="mt-1 text-sm leading-6 text-muted">اختياري — تقدر تتخطي التقييم لو مش حابب.</p>
      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="تقييم المكان من خمس نجوم">
        {STAR_VALUES.map((value) => {
          const selected = value <= stars
          return (
            <Button
              variant="ghost"
              key={value}
              type="button"
              role="radio"
              aria-checked={stars === value}
              aria-label={`${value} من 5`}
              className="size-11 p-0"
              onClick={() => setStars(value)}
            >
              <Star
                className={cn('size-6', selected ? 'fill-ready text-ready' : 'text-muted')}
                aria-hidden="true"
              />
            </Button>
          )
        })}
      </div>
      <label className="mt-4 block">
        <span className="text-xs text-muted">ملاحظة (اختياري)</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="اكتب ملاحظتك لو حابب"
          className={`${fieldClassName} mt-1 resize-none`}
        />
      </label>
      {error ? (
        <p className="mt-3 text-sm text-bad" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy || stars < 1}
          className="min-h-11 px-4"
          onClick={() => void send({ stars, note })}
        >
          {busy ? 'بيتحفظ...' : 'إرسال التقييم'}
        </Button>
        <Button
          variant="secondary"
          type="button"
          disabled={busy}
          className="min-h-11 px-4"
          onClick={() => void send({ skipped: true })}
        >
          تخطي
        </Button>
      </div>
    </section>
  )
}
