import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Undo2 } from 'lucide-react'
import { READY_UNDO_MS, remainingReadyUndoMs } from '../../types/order.ts'

const RING_SIZE = 52
const RING_RADIUS = 20
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function UndoReadyButton({
  updatedAt,
  pending,
  onUndo,
}: {
  updatedAt: string
  pending: boolean
  onUndo: () => void
}) {
  const remainingAtMount = useRef(remainingReadyUndoMs(updatedAt))
  const [visible, setVisible] = useState(remainingAtMount.current > 0)

  useEffect(() => {
    if (remainingAtMount.current <= 0) return
    const timer = window.setTimeout(() => setVisible(false), remainingAtMount.current)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  const startOffset =
    RING_CIRCUMFERENCE * (1 - remainingAtMount.current / READY_UNDO_MS)

  return (
    <button
      type="button"
      className="relative inline-flex min-h-12 min-w-[5.75rem] shrink-0 items-center justify-center gap-1.5 self-stretch overflow-hidden rounded-xl bg-ready/20 px-5 text-sm font-semibold text-ink hover:bg-ready/30 disabled:pointer-events-none disabled:opacity-70"
      disabled={pending}
      aria-label="تراجع. الأوردر هيفضل قيد التحضير، والإشعار مش هيتبعت."
      onClick={onUndo}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          className="stroke-line"
          strokeWidth="3"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          className="stroke-ready"
          strokeWidth="3"
          strokeLinecap="round"
          style={
            {
              '--undo-ring-end': String(RING_CIRCUMFERENCE),
              strokeDasharray: RING_CIRCUMFERENCE,
              strokeDashoffset: startOffset,
              animation: `smart-order-undo-ring ${remainingAtMount.current}ms linear forwards`,
            } as CSSProperties
          }
        />
      </svg>
      {pending ? (
        'بيرجع'
      ) : (
        <>
          تراجع
          <Undo2 className="size-4" strokeWidth={2.5} aria-hidden="true" />
        </>
      )}
    </button>
  )
}
