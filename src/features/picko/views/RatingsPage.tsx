import { Award, Clock, Hash, MessageSquareQuote, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  ApiError,
  fetchPlaceRatings,
  type PlaceRatingList,
} from '../services/api/ordersApi.ts'
import { formatDateTime, formatNumber } from '../utils/format.ts'
import { cn } from '../utils/cn.ts'

export function RatingsPage() {
  const [data, setData] = useState<PlaceRatingList | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const next = await fetchPlaceRatings()
        if (!active) return
        setData(next)
        setError(null)
      } catch (loadError) {
        if (!active) return
        setError(
          loadError instanceof ApiError ? loadError.message : 'تعذر قراءة التقييمات من الخادم.',
        )
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const fiveStars = data ? data.ratings.filter((rating) => rating.stars === 5).length : 0

  return (
    <section className="ratings-page">
      <div className="archive-banner">
        <span className="archive-banner-icon"><Star className="size-7" aria-hidden="true" /></span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">تقييمات المكان</h1>
          <p className="mt-2 text-xs leading-6 text-muted">التقييمات اللي العملاء بعتوها من صفحة التتبع.</p>
        </div>
        <span className="archive-folder" aria-hidden="true"><Star /></span>
      </div>

      <div className="ratings-stats">
        <div className="ratings-stat">
          <span className="ratings-stat-icon"><Star aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="ratings-stat-label">متوسط التقييم</p>
            <p className="ratings-stat-value">
              {data?.average ?? '—'}
              <small>من 5</small>
            </p>
          </div>
        </div>
        <div className="ratings-stat">
          <span className="ratings-stat-icon"><MessageSquareQuote aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="ratings-stat-label">عدد التقييمات</p>
            <p className="ratings-stat-value">{formatNumber(data?.count ?? 0)}</p>
          </div>
        </div>
        <div className="ratings-stat">
          <span className="ratings-stat-icon"><Award aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="ratings-stat-label">تقييمات 5 نجوم</p>
            <p className="ratings-stat-value">{formatNumber(fiveStars)}</p>
          </div>
        </div>
      </div>

      {error ? <p className="py-4 text-sm text-bad" role="alert">{error}</p> : null}

      <div className="archive-table-scroll">
        <table className="archive-table ratings-table">
          <thead><tr>
            <th><span><Hash />رقم الأوردر</span></th>
            <th><span><Star />التقييم</span></th>
            <th><span><Clock />الوقت</span></th>
            <th><span><MessageSquareQuote />الملاحظة</span></th>
          </tr></thead>
          <tbody>
            {data === null && !error ? (
              <tr><td colSpan={4} className="archive-empty" role="status">بنحمّل التقييمات...</td></tr>
            ) : null}
            {data !== null && data.ratings.length === 0 && !error ? (
              <tr><td colSpan={4} className="archive-empty">لسه مفيش تقييمات.</td></tr>
            ) : null}
            {data?.ratings.map((rating) => (
              <tr key={rating.id}>
                <td><span className="archive-code" dir="ltr">{rating.orderCode}</span></td>
                <td><Stars value={rating.stars} /></td>
                <td>{formatDateTime(rating.createdAt)}</td>
                <td className="ratings-note-cell">
                  {rating.note ? (
                    <p className="ratings-note">{rating.note}</p>
                  ) : (
                    <p className="ratings-note ratings-note-empty">من غير ملاحظة.</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="ratings-stars" role="img" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn('size-4', star <= value ? 'ratings-star-filled' : 'ratings-star-empty')}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
