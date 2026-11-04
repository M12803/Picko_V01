import {
  Archive,
  Check,
  CircleCheck,
  Eye,
  RotateCcw,
  Calendar,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderClock,
  Hash,
  Hourglass,
  Info,
  Search,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, fetchArchive, type ArchiveOrder } from '../services/api/ordersApi.ts'
import { cashierStatusLabel, ORDER_STATUSES } from '../types/order.ts'
import type { OrderStatus } from '../types/order.ts'
import { formatArchiveDateTime, formatDurationMs, formatNumber } from '../utils/format.ts'
import { cn } from '../utils/cn.ts'
import { Button } from '../components/ui/Button.tsx'
import { Modal } from '../components/ui/Modal.tsx'

const PAGE_SIZE = 10
const DAY_MS = 86_400_000

const RANGE_PRESETS = [
  { label: 'آخر أسبوعين', days: 14 },
  { label: 'آخر شهر', days: 30 },
  { label: 'آخر 3 أشهر', days: 90 },
  { label: 'آخر 6 أشهر', days: 180 },
  { label: 'كل الوقت', days: null },
] as const

const PICKED_UP_TONES = new Set<string>([ORDER_STATUSES.completed, ORDER_STATUSES.pickedUp])

function statusTone(status: OrderStatus): 'ok' | 'ready' | 'bad' {
  if (PICKED_UP_TONES.has(status)) return 'ok'
  if (status === ORDER_STATUSES.cancelled) return 'bad'
  return 'ready'
}

function localDayStamp(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function StatusPill({ label, tone }: { label: string; tone: 'ok' | 'ready' | 'bad' }) {
  return (
    <span className={cn('archive-status', tone === 'bad' ? 'archive-status-cancelled' : tone === 'ok' ? 'archive-status-delivered' : 'archive-status-preparing')}>
      {tone === 'ok' ? <CircleCheck className="size-4" aria-hidden="true" /> : <span className="archive-status-spinner" aria-hidden="true" />}
      {label}
    </span>
  )
}

export function ArchivePage() {
  const today = localDayStamp()
  const [code, setCode] = useState('')
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [activePreset, setActivePreset] = useState<number | null>(null)
  const [applied, setApplied] = useState({ code: '', from: today, to: today })
  const [orders, setOrders] = useState<ArchiveOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<ArchiveOrder | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const next = await fetchArchive(applied)
        if (!active) return
        setOrders(next.orders)
        setError(null)
      } catch (loadError) {
        if (!active) return
        setOrders([])
        setError(
          loadError instanceof ApiError ? loadError.message : 'تعذر قراءة الأرشيف من الخادم.',
        )
      }
    })()
    return () => { active = false }
  }, [applied])

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApplied({ code, from, to })
    setPage(0)
  }

  function applyPreset(index: number) {
    const preset = RANGE_PRESETS[index]
    if (!preset) return
    setActivePreset(index)
    const nextFrom = preset.days === null ? '' : localDayStamp(new Date(Date.now() - preset.days * DAY_MS))
    const nextTo = preset.days === null ? '' : today
    setFrom(nextFrom)
    setTo(nextTo)
    setApplied({ code, from: nextFrom, to: nextTo })
    setPage(0)
  }

  const total = orders?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageOrders = orders ? orders.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE) : []
  const shownFrom = total === 0 ? 0 : safePage * PAGE_SIZE + 1
  const shownTo = total === 0 ? 0 : Math.min(total, safePage * PAGE_SIZE + pageOrders.length)

  return (
    <section className="archive-page">
      <div className="archive-banner">
        <span className="archive-banner-icon"><Archive className="size-7" aria-hidden="true" /></span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">أرشيف الأوردرات</h1>
          <p className="mt-2 text-xs leading-6 text-muted">ابحث برقم الأوردر أو بتاريخ الإنشاء. أقصى المعروض 200 أوردر.</p>
        </div>
        <span className="archive-folder" aria-hidden="true"><FolderClock /></span>
      </div>

      <form className="archive-search" onSubmit={search}>
        <label>
          <span className="archive-label">رقم الأوردر</span>
          <span className="archive-input-wrap">
            <Hash aria-hidden="true" />
            <input id="archive-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="ادخل رقم الأوردر..." autoComplete="off" spellCheck={false} className="archive-input" />
          </span>
        </label>
        <label>
          <span className="archive-label">من تاريخ</span>
          <span className="archive-input-wrap archive-date-wrap">
            <Calendar aria-hidden="true" />
            <input id="archive-from" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setActivePreset(null) }} className="archive-input" />
          </span>
        </label>
        <label>
          <span className="archive-label">إلى تاريخ</span>
          <span className="archive-input-wrap archive-date-wrap">
            <Calendar aria-hidden="true" />
            <input id="archive-to" type="date" value={to} onChange={(event) => { setTo(event.target.value); setActivePreset(null) }} className="archive-input" />
          </span>
        </label>
        <Button type="submit" className="archive-search-button"><Search className="size-6" aria-hidden="true" />بحث</Button>
      </form>

      <div className="archive-presets">
        {RANGE_PRESETS.map((preset, index) => (
          <Button key={preset.label} variant="ghost" onClick={() => applyPreset(index)} aria-pressed={activePreset === index} className={cn('archive-preset', activePreset === index && 'archive-preset-active')}>
            {index === 1 ? <Clock className="size-4" aria-hidden="true" /> : <CalendarRange className="size-4" aria-hidden="true" />}
            {preset.label}<RotateCcw className="size-3.5 archive-preset-reset" aria-hidden="true" />
          </Button>
        ))}
      </div>

      {error ? <p className="py-4 text-sm text-bad" role="alert">{error}</p> : null}
      <div className="archive-table-scroll">
        <table className="archive-table">
          <thead><tr>
            <th><span><Hash />وقت الإنشاء</span></th>
            <th><span><Clock />الحالة الحالية</span></th>
            <th><span><Hourglass />وقت الانتظار</span></th>
            <th><span><CircleCheck />جاهز للاستلام</span></th>
            <th><span><Check />وقت الاستلام</span></th>
            <th><span className="sr-only">تفاصيل الأوردر</span></th>
          </tr></thead>
          <tbody>
            {orders === null && !error ? <tr><td colSpan={6} className="archive-empty" role="status">بنحمّل الأرشيف...</td></tr> : null}
            {orders && orders.length === 0 && !error ? <tr><td colSpan={6} className="archive-empty">مفيش أوردرات في الفترة دي.</td></tr> : null}
            {pageOrders.map((order) => (
              <tr key={order.id}>
                <td><div className="archive-created"><span className="archive-code" dir="ltr">{order.code}</span><Clock className="size-3.5 shrink-0 text-muted" aria-hidden="true" /><span>{formatArchiveDateTime(order.createdAt)}</span></div></td>
                <td><StatusPill label={cashierStatusLabel(order.status)} tone={statusTone(order.status)} /></td>
                <td><span className="inline-flex items-center gap-2 tabular-nums"><Hourglass className="size-4 text-muted" aria-hidden="true" />{formatDurationMs(order.waitMs)}</span></td>
                <td>{order.readyAt ? formatArchiveDateTime(order.readyAt) : '—'}</td>
                <td>{order.pickedUpAt ? formatArchiveDateTime(order.pickedUpAt) : '—'}</td>
                <td><Button variant="ghost" className="archive-row-action" aria-label={`تفاصيل الأوردر ${order.code}`} title="تفاصيل الأوردر" onClick={() => setSelectedOrder(order)}><Eye className="size-5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="archive-footer">
        <p className="archive-footer-note"><Info className="size-4 shrink-0 text-info" aria-hidden="true" />وقت الاستلام فاضي لأن الكاشير بيسجّل جاهز للاستلام من غير خطوة تسليم منفصلة.</p>
        <nav aria-label="تصفح الأرشيف" className="archive-pagination">
          <Button variant="ghost" aria-label="الصفحة السابقة" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronRight className="size-5" /></Button>
          <span className="archive-page-number">{formatNumber(safePage + 1)}</span>
          <Button variant="ghost" aria-label="الصفحة التالية" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}><ChevronLeft className="size-5" /></Button>
        </nav>
        <p className="text-xs tabular-nums">عرض {formatNumber(shownFrom)} - {formatNumber(shownTo)} من {formatNumber(total)} طلب</p>
      </div>
      <Modal open={selectedOrder !== null} title={`الأوردر ${selectedOrder?.code ?? ''}`} onClose={() => setSelectedOrder(null)}>
        {selectedOrder ? <dl className="grid grid-cols-2 gap-4 text-sm">
          <dt className="text-muted">وقت الإنشاء</dt><dd>{formatArchiveDateTime(selectedOrder.createdAt)}</dd>
          <dt className="text-muted">الحالة الحالية</dt><dd>{cashierStatusLabel(selectedOrder.status)}</dd>
          <dt className="text-muted">وقت الانتظار</dt><dd>{formatDurationMs(selectedOrder.waitMs)}</dd>
          <dt className="text-muted">جاهز للاستلام</dt><dd>{selectedOrder.readyAt ? formatArchiveDateTime(selectedOrder.readyAt) : '—'}</dd>
          <dt className="text-muted">وقت الاستلام</dt><dd>{selectedOrder.pickedUpAt ? formatArchiveDateTime(selectedOrder.pickedUpAt) : '—'}</dd>
        </dl> : null}
      </Modal>
    </section>
  )
}
