import { Check } from 'lucide-react'
import { canUndoReadyHandoff, ORDER_STATUSES } from '../../types/order.ts'
import type { Order } from '../../types/order.ts'
import { formatRelativeAgo } from '../../utils/format.ts'
import { cn } from '../../utils/cn.ts'
import { UndoReadyButton } from './UndoReadyButton.tsx'
import { Button } from '../ui/Button.tsx'

export function OrderTicket({
  order,
  now,
  pending,
  blocked,
  selected,
  compact = false,
  square = false,
  error = null,
  undoPending = false,
  onOpen,
  onReady,
  onUndo,
}: {
  order: Order
  now: number
  pending: boolean
  blocked: boolean
  selected: boolean
  compact?: boolean
  square?: boolean
  error?: string | null
  undoPending?: boolean
  onOpen: (order: Order) => void
  onReady: (id: string) => void
  onUndo?: (id: string) => void
}) {
  const undoable = canUndoReadyHandoff(order.status, order.updatedAt, now)
  const handedOff = order.status === ORDER_STATUSES.completed && !undoable
  const showUndo = Boolean(onUndo) && undoable

  if (square) {
    return (
      <li>
        <div
          className={cn(
            'order-tile flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2',
            selected ? 'border-ready ring-2 ring-ready/40' : 'border-line hover:border-accent/60',
            error && 'border-rose-400/60',
          )}
        >
          <Button variant="ghost"
            type="button"
            className="order-tile-open flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-1.5"
            aria-pressed={selected}
            onClick={() => onOpen(order)}
          >
            <span className="text-2xl font-bold leading-none tabular-nums" dir="ltr">
              {order.code}
            </span>
            <span className="text-[11px] text-muted">{formatRelativeAgo(order.createdAt, now)}</span>
          </Button>
          {handedOff ? null : showUndo && onUndo ? (
            <UndoReadyButton
              key={order.updatedAt}
              updatedAt={order.updatedAt}
              pending={undoPending}
              onUndo={() => onUndo(order.id)}
            />
          ) : (
            <Button
              type="button"
              className="order-ticket-ready inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-xl bg-mint px-2 text-sm font-semibold text-on-mint hover:bg-mint-hover disabled:pointer-events-none disabled:opacity-70"
              disabled={pending || blocked}
              aria-busy={pending}
              onClick={() => {
                if (pending || blocked) return
                onReady(order.id)
              }}
            >
              {pending ? (
                'بيتحفظ...'
              ) : (
                <>
                  جاهز
                  <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                </>
              )}
            </Button>
          )}
        </div>
        {error ? (
          <p className="pt-1 text-xs leading-5 text-rose-400" role="alert">
            {error}
          </p>
        ) : null}
      </li>
    )
  }

  if (compact) {
    return (
      <li>
        <Button variant="ghost"
          type="button"
          className={cn(
            'flex h-16 w-full flex-col items-center justify-center gap-0.5 rounded-xl border-2 bg-elevated px-2 shadow-sm',
            selected ? 'border-ready ring-2 ring-ready/40' : 'border-line hover:border-accent/60',
            error && 'border-rose-400/70',
          )}
          aria-pressed={selected}
          onClick={() => onOpen(order)}
        >
          <span className="text-lg font-semibold leading-none tabular-nums" dir="ltr">
            {order.code}
          </span>
          <span className="text-[11px] text-muted">{formatRelativeAgo(order.createdAt, now)}</span>
        </Button>
        {error ? (
          <p className="px-1 pt-1 text-xs leading-5 text-rose-400" role="alert">
            {error}
          </p>
        ) : null}
      </li>
    )
  }

  return (
    <li>
      <div
        className={cn(
          'order-ticket flex items-stretch rounded-2xl border-2',
          compact ? 'gap-2 px-2.5 py-1.5' : 'gap-2 p-1.5 ps-3',
          handedOff
            ? 'border-line/60 bg-elevated'
            : 'border-line bg-elevated',
          selected && 'border-ready/80 ring-2 ring-ready/40',
          error && 'border-rose-400/60',
        )}
      >
        <Button variant="ghost"
          type="button"
          className={cn(
            'order-ticket-open flex min-w-0 flex-1 items-center justify-start gap-3 text-start',
            compact ? 'py-1' : 'py-2',
          )}
          aria-pressed={selected}
          onClick={() => onOpen(order)}
        >
          <span
            className={cn(
              'min-w-0 shrink-0 truncate font-semibold tabular-nums',
              compact ? 'text-sm' : 'text-lg font-bold',
            )}
            dir="ltr"
          >
            {order.code}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-app px-2.5 py-1 text-[11px] font-medium text-muted">
            <span className="size-1 rounded-full bg-muted/60" aria-hidden="true" />
            {formatRelativeAgo(order.createdAt, now)}
          </span>
          {handedOff && !compact ? (
            <span className="inline-flex min-h-8 shrink-0 items-center rounded-xl bg-app px-3 text-xs font-medium text-muted">
              تم التسليم
            </span>
          ) : null}
        </Button>
        {handedOff ? null : showUndo && onUndo ? (
          <UndoReadyButton
            key={order.updatedAt}
            updatedAt={order.updatedAt}
            pending={undoPending}
            onUndo={() => onUndo(order.id)}
          />
        ) : (
          <Button
            type="button"
            className="order-ticket-ready inline-flex min-h-10 min-w-20 shrink-0 items-center justify-center gap-1.5 self-stretch rounded-xl bg-mint px-3 text-sm font-semibold text-on-mint hover:bg-mint-hover disabled:pointer-events-none disabled:opacity-70"
            disabled={pending || blocked}
            aria-busy={pending}
            onClick={() => {
              if (pending || blocked) return
              onReady(order.id)
            }}
          >
            {pending ? (
              'بيتحفظ...'
            ) : (
              <>
                جاهز
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
              </>
            )}
          </Button>
        )}
      </div>
      {error ? (
        <p className="px-1 pt-1.5 text-sm leading-6 text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}
