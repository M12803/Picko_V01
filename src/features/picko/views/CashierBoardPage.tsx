import { Archive, Check, ChevronDown, ClipboardCheck, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NewOrderPanel } from '../components/qr/NewOrderPanel.tsx'
import { OrderTicket } from '../components/orders/OrderTicket.tsx'
import { ApiError } from '../services/api/ordersApi.ts'
import { useOrders } from '../state/useOrders.ts'
import { canUndoReadyHandoff, cashierBoardStatus, ORDER_STATUSES } from '../types/order.ts'
import type { Order } from '../types/order.ts'
import { localCalendarDate } from '../services/orders/dailyCollection.ts'
import { cn } from '../utils/cn.ts'
import { compareBoardOrders, type BoardSort } from '../utils/orders.ts'
import { Button } from '../components/ui/Button.tsx'

export function CashierBoardPage() {
  const { orders, status, errorMessage, reload, completeOrder, reopenOrder } = useOrders()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<BoardSort>('oldest')
  const [preview, setPreview] = useState<{ order: Order; trackingUrl: string } | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [undoingId, setUndoingId] = useState<string | null>(null)
  const [failedId, setFailedId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const pendingRef = useRef<string | null>(null)
  const undoingRef = useRef<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const undoActive = orders.some((order) => canUndoReadyHandoff(order.status, order.updatedAt, now))

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), undoActive ? 250 : 30_000)
    return () => window.clearInterval(timer)
  }, [undoActive])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }
      event.preventDefault()
      searchRef.current?.focus()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ar')
    const list = needle
      ? orders.filter((order) => order.code.toLocaleLowerCase('ar').includes(needle))
      : orders
    return [...list].sort(compareBoardOrders(sort))
  }, [orders, query, sort])

  const preparing = filtered.filter((order) => {
    const visible = cashierBoardStatus(order.status, order.updatedAt, now)
    return (
      visible === ORDER_STATUSES.pending ||
      visible === ORDER_STATUSES.preparing ||
      visible === ORDER_STATUSES.ready
    )
  })
  const ready = filtered.filter(
    (order) =>
      cashierBoardStatus(order.status, order.updatedAt, now) === ORDER_STATUSES.completed &&
      isLocalToday(order.createdAt, now),
  )

  async function markReady(id: string) {
    if (pendingRef.current) return
    pendingRef.current = id
    setPendingId(id)
    setFailedId(null)
    setRowError(null)
    try {
      await completeOrder(id)
    } catch (error) {
      setFailedId(id)
      setRowError(
        error instanceof ApiError
          ? `العملية لم تنجح. الأوردر لسه قيد التحضير. ${error.message}`
          : 'العملية لم تنجح. الأوردر لسه قيد التحضير. حاول مرة تانية.',
      )
    } finally {
      pendingRef.current = null
      setPendingId(null)
    }
  }

  async function undoReady(id: string) {
    if (undoingRef.current) return
    undoingRef.current = id
    setUndoingId(id)
    setFailedId(null)
    setRowError(null)
    try {
      await reopenOrder(id)
    } catch (error) {
      setFailedId(id)
      setRowError(
        error instanceof ApiError
          ? error.message
          : 'تعذر التراجع. الأوردر لسه جاهز للاستلام.',
      )
    } finally {
      undoingRef.current = null
      setUndoingId(null)
    }
  }

  function showOrder(order: Order, trackingUrl?: string) {
    setPreview({ order, trackingUrl: trackingUrl ?? order.trackingUrl ?? '' })
  }

  const livePreview = useMemo(() => {
    if (!preview) return null
    const live = orders.find((order) => order.id === preview.order.id)
    if (!live) return preview
    return { order: live, trackingUrl: live.trackingUrl ?? preview.trackingUrl }
  }, [orders, preview])

  return (
    <div className="orders-page">
      <NewOrderPanel
        preview={livePreview?.order ?? null}
        trackingUrl={livePreview?.trackingUrl || null}
        now={now}
        onIssued={(order, trackingUrl) => showOrder(order, trackingUrl)}
      />

      <section className="orders-board">
        <div className="orders-toolbar flex gap-2">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">بحث في الطلبات</span>
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="بحث..."
              className="h-11 w-full rounded-xl border border-line bg-elevated ps-10 pe-3 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            />
          </label>
          <label className="relative w-28 shrink-0">
            <span className="sr-only">ترتيب الطلبات</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as BoardSort)}
              className="h-11 w-full appearance-none rounded-xl border border-line bg-elevated px-3 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="oldest">الأقدم</option>
              <option value="newest">الأحدث</option>
              <option value="code">الرقم</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
          </label>
        </div>

        {status === 'loading' ? (
          <p className="text-sm text-muted" role="status">
            بنحمّل الطلبات...
          </p>
        ) : null}

        {status === 'error' ? (
          <div className="space-y-3">
            <p className="text-sm text-bad" role="alert">
              {errorMessage}
            </p>
            <Button
              type="button"
              className="min-h-10 rounded-xl border border-line bg-elevated px-3 text-sm"
              onClick={reload}
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : null}

        {status === 'ready' ? (
          <div className="orders-columns flex min-h-0 flex-1 flex-col gap-3">
            <BoardColumn
              title="قيد التحضير"
              count={preparing.length}
              tone="ready"
              empty="مفيش طلبات بتتحضّر."
              className="orders-preparing shrink-0"
              layout="grid"
            >
              {preparing.map((order) => (
                <OrderTicket
                  key={order.id}
                  order={order}
                  now={now}
                  square
                  pending={pendingId === order.id}
                  blocked={pendingId === order.id}
                  undoPending={undoingId === order.id}
                  error={failedId === order.id ? rowError : null}
                  selected={livePreview?.order.id === order.id}
                  onOpen={showOrder}
                  onReady={(id) => void markReady(id)}
                  onUndo={(id) => void undoReady(id)}
                />
              ))}
            </BoardColumn>
            <BoardColumn
              title="قيد الاستلام"
              count={ready.length}
              tone="ok"
              empty="مفيش طلبات جاهزة."
              className="orders-ready min-h-0"
              layout="grid"
            >
              {ready.map((order) => (
                <OrderTicket
                  key={order.id}
                  order={order}
                  now={now}
                  pending={false}
                  blocked
                  compact
                  error={failedId === order.id ? rowError : null}
                  selected={livePreview?.order.id === order.id}
                  onOpen={showOrder}
                  onReady={() => undefined}
                />
              ))}
            </BoardColumn>
            {ready.length === 0 && preparing.length === 0 ? (
              <div className="orders-empty">
                <span className="orders-empty-illustration" aria-hidden="true">
                  <ClipboardCheck />
                  <span><Check strokeWidth={3} /></span>
                </span>
                <p className="text-sm font-semibold">لا توجد المزيد من الطلبات</p>
                <p className="text-xs text-muted">حاول البحث بمعايير مختلفة</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function isLocalToday(iso: string, now: number): boolean {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return false
  return localCalendarDate(date) === localCalendarDate(new Date(now))
}

function BoardColumn({
  title,
  count,
  tone,
  empty,
  className,
  layout = 'list',
  children,
}: {
  title: string
  count: number
  tone: 'ready' | 'ok'
  empty: string
  className?: string
  layout?: 'list' | 'grid'
  children: ReactNode
}) {
  return (
    <section className={cn('flex min-h-0 flex-col', className)}>
      <div className="orders-column-title mb-2 flex items-center gap-2">
        <span
          className={`size-2.5 rounded-full ${tone === 'ok' ? 'bg-ok' : 'bg-ready'}`}
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span
          className={`inline-flex min-h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${
            tone === 'ok'
              ? 'bg-ok/20 text-ok'
              : 'bg-ready/25 text-ready'
          }`}
        >
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="orders-column-empty flex items-center justify-start gap-2 rounded-xl border border-line px-3 py-4 text-xs text-muted">
          <Archive className="size-4" aria-hidden="true" />
          {empty}
        </p>
      ) : (
        <ul
          className={cn(
            'min-h-0 overflow-y-auto pe-1',
            layout === 'grid'
              ? 'grid content-start gap-2 [grid-template-columns:repeat(auto-fill,minmax(7.25rem,1fr))]'
              : 'space-y-2',
          )}
        >
          {children}
        </ul>
      )}
    </section>
  )
}
