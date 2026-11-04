import { useEffect, useRef, useState } from 'react'
import { useParams } from '../router-adapter.tsx'
import { io } from 'socket.io-client'
import { socketOrigin } from '../config/apiBase.ts'
import { BrandLogo } from '../components/brand/BrandLogo.tsx'
import { EnableNotifications } from '../components/track/EnableNotifications.tsx'
import { SoundPrompt } from '../components/track/SoundPrompt'
import { Button } from '../components/ui/Button'
import { Check, CheckCircle2, ChefHat, CircleCheck, LoaderCircle, ShoppingBag, Volume2, Wifi, WifiOff } from 'lucide-react'
import { PlaceRatingForm } from '../components/track/PlaceRatingForm.tsx'
import { createReadyRing } from '../components/track/readyRing.ts'
import {
  ApiError,
  confirmPickup,
  fetchPublicOrder,
  RATING_STATES,
  type PublicOrder,
} from '../services/api/ordersApi.ts'
import { isOrderStatus, cashierStatusLabel, ORDER_STATUSES } from '../types/order.ts'
import type { OrderStatus } from '../types/order.ts'

const POLL_MS = 8_000

type LookupState =
  | { phase: 'loading' }
  | { phase: 'found'; order: PublicOrder }
  | { phase: 'missing' }
  | { phase: 'error'; message: string }

function isStatusPayload(value: unknown): value is Pick<PublicOrder, 'code' | 'status'> {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record['code'] === 'string' &&
    record['code'].trim() !== '' &&
    typeof record['status'] === 'string' &&
    isOrderStatus(record['status'])
  )
}

function TrackOrderLookup({ token }: { token: string }) {
  const [state, setState] = useState<LookupState>({ phase: 'loading' })
  const [connection, setConnection] = useState<'connecting' | 'live' | 'offline'>('connecting')
  const [ringing, setRinging] = useState(false)
  const [ringBlocked, setRingBlocked] = useState(false)
  const [pickingUp, setPickingUp] = useState(false)
  const [pickupError, setPickupError] = useState<string | null>(null)
  const lastStatus = useRef<OrderStatus | null>(null)
  const ringRef = useRef(createReadyRing())
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [soundBusy, setSoundBusy] = useState(false)
  const [soundError, setSoundError] = useState<string | null>(null)
  const [promptOpen, setPromptOpen] = useState(true)

  const found = state.phase === 'found' ? state.order : null
  const readyForPickup = found?.status === ORDER_STATUSES.completed
  useEffect(() => {
    const ring = ringRef.current
    return () => ring.close()
  }, [])

  useEffect(() => {
    const ring = ringRef.current
    if (!readyForPickup) {
      ring.stop()
      setRinging(false)
      setRingBlocked(false)
      return
    }

    let cancelled = false
    void ring.start().then((result) => {
      if (cancelled) return
      setRinging(result === 'playing')
      setRingBlocked(result === 'blocked')
      if (result === 'playing') { setSoundEnabled(true); setPromptOpen(false) }
    })
    return () => {
      cancelled = true
      ring.stop()
    }
  }, [readyForPickup])

  useEffect(() => {
    let active = true
    const origin = socketOrigin()
    const socket = origin ? io(origin, { reconnection: true }) : null

    function applyOrder(order: { code: string; status: OrderStatus; rating?: PublicOrder['rating'] }) {
      if (
        lastStatus.current === ORDER_STATUSES.completed &&
        order.status !== ORDER_STATUSES.completed &&
        order.status !== ORDER_STATUSES.pickedUp
      ) {
        return
      }
      lastStatus.current = order.status
      setState((current) => ({
        phase: 'found',
        order: {
          code: order.code,
          status: order.status,
          rating:
            order.rating ??
            (current.phase === 'found' ? current.order.rating : RATING_STATES.none),
        },
      }))
    }

    async function load() {
      try {
        const order = await fetchPublicOrder(token)
        if (active) { applyOrder(order); setConnection('live') }
      } catch (error) {
        if (!active) return
        setConnection('offline')
        if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
          setState((current) => (current.phase === 'found' ? current : { phase: 'missing' }))
          return
        }
        setState((current) =>
          current.phase === 'found'
            ? current
            : {
                phase: 'error',
                message: error instanceof ApiError ? error.message : 'تعذر قراءة الأوردر من الخادم.',
              },
        )
      }
    }

    void load()
    const poll = window.setInterval(() => {
      void load()
    }, POLL_MS)

    socket?.on('connect', () => {
      if (!active) return
      setConnection('live')
      socket?.emit('track:join', token)
    })
    socket?.on('disconnect', () => {
      if (active) setConnection('offline')
    })
    socket?.on('order:status', (payload: unknown) => {
      if (!active || !isStatusPayload(payload)) return
      applyOrder(payload)
    })
    socket?.on('track:error', (payload: unknown) => {
      if (!active) return
      const message =
        payload &&
        typeof payload === 'object' &&
        'error' in payload &&
        typeof payload.error === 'string'
          ? payload.error
          : 'تعذر متابعة الأوردر.'
      setState((current) => (current.phase === 'found' ? current : { phase: 'error', message }))
    })

    return () => {
      active = false
      window.clearInterval(poll)
      socket?.close()
    }
  }, [token])

  async function enableSound() {
    if (soundBusy) return
    setSoundBusy(true)
    setSoundError(null)
    const enabled = readyForPickup
      ? await ringRef.current.start().then((result) => {
          setRinging(result === 'playing')
          setRingBlocked(result !== 'playing')
          return result === 'playing'
        })
      : await ringRef.current.unlock()
    setSoundEnabled(enabled)
    setSoundBusy(false)
    if (enabled) setPromptOpen(false)
    else setSoundError('المتصفح منع تشغيل الصوت. اضغط تفعيل الصوت للمحاولة مرة تانية.')
  }

  async function stopRing() {
    if (pickingUp) return
    setPickingUp(true)
    setPickupError(null)
    try {
      const order = await confirmPickup(token)
      ringRef.current.stop()
      setRinging(false)
      setRingBlocked(false)
      lastStatus.current = order.status
      setState((current) =>
        current.phase === 'found'
          ? { phase: 'found', order: { ...current.order, ...order } }
          : { phase: 'found', order },
      )
    } catch (error) {
      setPickupError(error instanceof ApiError ? error.message : 'تعذر تأكيد الاستلام. الرنين لسه شغّال.')
    } finally {
      setPickingUp(false)
    }
  }

  const delivered = found?.status === ORDER_STATUSES.pickedUp

  const cancelled = found?.status === ORDER_STATUSES.cancelled
  const stage = delivered ? 2 : readyForPickup ? 1 : 0
  const steps = [{ label: 'قيد التحضير', icon: ChefHat }, { label: 'جاهز للاستلام', icon: ShoppingBag }, { label: 'تم الاستلام', icon: CheckCircle2 }]

  const pill = cancelled ? 'border-bad/30 bg-bad-dim text-bad' : readyForPickup || delivered ? 'border-ok/30 bg-ok-dim text-ok' : 'border-ready/30 bg-elevated text-ready'

  return (
    <div dir="rtl" className="min-h-svh px-4 py-6 text-ink sm:py-10">
      <main className="track-card track-fade mx-auto w-full max-w-lg overflow-hidden rounded-[28px] border border-line/70 p-5 sm:p-7">
        <header className="flex items-center justify-between">
          <span className="flex items-center gap-2 rounded-full border border-line bg-app/60 px-3 py-1.5 text-xs text-ink">
            <span className={`size-2 rounded-full ${connection === 'offline' ? 'bg-ready' : 'bg-ok track-pulse'}`} />
            {connection === 'offline' ? 'إعادة الاتصال…' : 'متصل بالانترنت'}
            {connection === 'offline' ? <WifiOff className="size-3.5 text-ready" /> : <Wifi className="sr-only" />}
          </span>
          <div className="flex items-center gap-2"><span className="text-xl font-bold" dir="ltr">Picko</span><BrandLogo alt="" className="size-10" /></div>
        </header>
        {state.phase === 'loading' ? <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-muted"><LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />بنراجع طلبك…</div> : null}
        {state.phase === 'error' ? <p className="mt-12 text-center text-bad" role="alert">{state.message}</p> : null}
        {state.phase === 'missing' ? <section className="py-16 text-center"><ShoppingBag className="mx-auto size-12 text-muted" /><h1 className="mt-5 text-xl font-semibold">الطلب غير موجود</h1><p className="mt-3 text-sm text-muted">راجع رمز الطلب وحاول مرة تانية.</p></section> : null}
        {found ? <>
          <section className="track-fade pt-8 pb-6 text-center" style={{ animationDelay: '80ms' }}>
            <div className="relative mx-auto flex size-24 items-center justify-center rounded-full bg-mint/10 ring-1 ring-mint/20">
              <div className="track-float flex size-20 items-center justify-center rounded-full bg-gradient-to-b from-mint-hover to-mint text-on-mint shadow-[0_10px_40px_-8px] shadow-mint/70">
                {readyForPickup || delivered ? <ShoppingBag className="size-9" /> : <ChefHat className="size-9" />}
              </div>
              {!cancelled ? <span className="absolute bottom-1 end-1 flex size-7 items-center justify-center rounded-full bg-ok text-app ring-4 ring-surface"><Check className="size-4" strokeWidth={3} /></span> : null}
            </div>
            <p className="mt-5 text-sm text-muted">رقم الأوردر</p>
            <h1 className="mt-1 break-all text-6xl font-extrabold tabular-nums" dir="ltr">{found.code}</h1>
            <div className={`mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${pill}`}><span className="size-2 rounded-full bg-current track-pulse" />{cashierStatusLabel(found.status)}</div>
            <p className="mt-4 text-sm leading-7 text-muted">{cancelled ? 'تم إلغاء الأوردر. راجع الكاشير لو محتاج مساعدة.' : delivered ? 'بالهناء والشفاء، نورتنا!' : readyForPickup ? 'أوردرك جاهز، مستنيك عند كاونتر الاستلام.' : 'بنحضّر أوردرك بكل اهتمام.'}</p>
          </section>
          {!cancelled ? <ol className="track-fade grid grid-cols-3 rounded-2xl border border-line/70 bg-app/50 py-5" style={{ animationDelay: '160ms' }} aria-label="مراحل الأوردر">{steps.map(({ label, icon: Icon }, index) => <li key={label} aria-current={stage === index ? 'step' : undefined} className={`relative text-center ${index > 0 ? 'border-s border-line/60' : ''}`}><span className={`mx-auto flex size-12 items-center justify-center rounded-xl transition-all duration-500 ${stage > index ? 'bg-ok-dim text-ok' : stage === index ? 'bg-mint text-on-mint shadow-[0_6px_24px_-6px] shadow-mint/70' : 'bg-elevated text-muted'}`}>{stage > index ? <Check className="size-5" /> : <Icon className="size-5" />}</span><p className={`mt-3 text-xs font-medium sm:text-sm ${stage >= index ? 'text-ink' : 'text-muted'}`}>{label}</p>{stage === index ? <span className="absolute -bottom-5 start-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-mint rtl:translate-x-1/2" /> : null}</li>)}</ol> : null}
          {!readyForPickup && !delivered && !cancelled ? <section className="track-fade mt-5 rounded-2xl border border-ok/20 bg-gradient-to-l from-ok-dim/60 to-transparent p-5" style={{ animationDelay: '240ms' }}>
            {soundEnabled ? <p className="flex items-center justify-center gap-2 text-sm text-ok" role="status"><CircleCheck className="size-5" />الصوت مفعّل</p> : <Button className="min-h-12 w-full rounded-xl text-base" onClick={() => setPromptOpen(true)}><Volume2 className="size-5" />تفعيل الصوت</Button>}
            <p className="mt-3 text-center text-xs leading-6 text-muted">خلّي الصفحة مفتوحة لحد ما أوردرك يجهز.</p>
            <EnableNotifications token={token} />
          </section> : null}
          {readyForPickup ? <section className="track-fade py-7 text-center" aria-live="assertive">
            <div className="relative mx-auto flex size-24 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-ok/15 track-ping" />
              <span className="track-float relative flex size-20 items-center justify-center rounded-3xl bg-gradient-to-b from-elevated to-surface text-ok ring-1 ring-ok/30"><ShoppingBag className="size-9" /><span className="absolute -bottom-2 -end-2 flex size-8 items-center justify-center rounded-full bg-ok text-app"><Check className="size-5" strokeWidth={3} /></span></span>
            </div>
            <h2 className="mt-5 text-2xl font-bold">أوردرك جاهز للاستلام</h2>
            {ringBlocked ? <Button className="mt-5 min-h-12 w-full rounded-xl" onClick={() => void enableSound()} disabled={soundBusy}><Volume2 className="size-5" />تفعيل الصوت</Button> : <p role="status" className="mt-2 flex items-center justify-center gap-2 text-sm text-ok"><Volume2 className="size-4" />{ringing ? 'الرنين شغّال' : 'جاري تشغيل الرنين…'}</p>}
            <Button className="mt-6 min-h-14 w-full rounded-2xl bg-gradient-to-l from-mint to-mint-hover text-base font-semibold shadow-[0_10px_30px_-10px] shadow-mint/80" data-stop-ring="" disabled={pickingUp} onClick={() => void stopRing()}>{pickingUp ? <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" /> : <CheckCircle2 className="size-5" />}{pickingUp ? 'جاري تأكيد الاستلام…' : 'استلمت الأوردر'}</Button>
            {pickupError || soundError ? <p className="mt-3 text-sm text-bad" role="alert">{pickupError || soundError}</p> : null}
          </section> : null}
          {delivered ? <p role="status" className="track-fade mt-6 flex items-center justify-center gap-2 text-sm text-ok"><CheckCircle2 className="size-5" />تم تأكيد الاستلام وإيقاف الرنين</p> : null}
          {readyForPickup || delivered ? <div className="track-fade mt-2"><PlaceRatingForm token={token} rating={found.rating} onRated={(rating) => setState({ phase: 'found', order: { ...found, rating } })} /></div> : null}
          <SoundPrompt open={promptOpen && !soundEnabled && !readyForPickup && !delivered && !cancelled} onOpenChange={setPromptOpen} code={found.code} busy={soundBusy} error={soundError} onEnable={() => void enableSound()} />
        </> : null}
        <footer className="mt-8 border-t border-line/60 pt-5 text-center text-xs text-muted"><span dir="ltr">Picko</span> · استلام أسهل</footer>
      </main>
    </div>
  )
}

export function TrackOrderPage() {
  const { token = '' } = useParams()
  return <TrackOrderLookup key={token} token={token} />
}
