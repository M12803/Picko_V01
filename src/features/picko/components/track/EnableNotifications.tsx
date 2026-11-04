import { useEffect, useState } from 'react'
import { Bell, LoaderCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { ApiError, fetchPushPublicKey, savePushSubscription } from '../../services/api/ordersApi.ts'
import { pushBlockReason, readPushCapability } from '../../utils/pushCapability.ts'

const OPTIONAL_HINT = 'اختياري. تقدر تتابع الحالة من الصفحة دي حتى لو ما فعّلتش الإشعارات.'

export function EnableNotifications({ token }: { token: string }) {
  const [message, setMessage] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (pushBlockReason(readPushCapability()) !== null) return
    void fetchPushPublicKey().then((key) => {
      const bytes = urlBase64ToUint8Array(key)
      if (active && bytes.length === 65 && bytes[0] === 0x04) setPublicKey(key)
    }).catch(() => { /* Unavailable push must not ask for an unnecessary permission. */ })
    return () => { active = false }
  }, [])

  async function enable() {
    if (busy || enabled || !publicKey) return
    setBusy(true)
    setMessage(null)
    try {
      const reason = pushBlockReason(readPushCapability())
      if (reason !== null) {
        setMessage('تعذر تفعيل الإشعارات على الجهاز ده. تقدر تتابع الأوردر من الصفحة.')
        return
      }

      if (Notification.permission === 'denied') {
        setMessage('الإشعارات محظورة من إعدادات المتصفح. الصوت داخل الصفحة يفضل متاح.')
        return
      }
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
      if (permission !== 'granted') {
        setMessage(
          permission === 'denied'
            ? 'تم رفض إذن الإشعارات. تقدر تتابع الأوردر من الصفحة، أو تسمح بالإشعارات من إعدادات المتصفح.'
            : 'ما تمش السماح بالإشعارات. تقدر تتابع الأوردر من الصفحة.',
        )
        return
      }

      let registration: ServiceWorkerRegistration
      try {
        registration = await waitForActiveWorker()
      } catch {
        setMessage('تعذر تفعيل الإشعارات على الجهاز ده. تقدر تتابع الأوردر من الصفحة.')
        return
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey)
      if (applicationServerKey.length !== 65 || applicationServerKey[0] !== 0x04) {
        setMessage('تعذر تفعيل الإشعارات على الجهاز ده. تقدر تتابع الأوردر من الصفحة.')
        return
      }

      let subscription: PushSubscription
      try {
        subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })
      } catch {
        setMessage('تعذر تفعيل الإشعارات على الجهاز ده. تقدر تتابع الأوردر من الصفحة.')
        return
      }

      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.['p256dh'] || !json.keys['auth']) {
        setMessage('تعذر تفعيل الإشعارات على الجهاز ده. تقدر تتابع الأوردر من الصفحة.')
        return
      }

      try { await savePushSubscription({
        token,
        endpoint: json.endpoint,
        p256dh: json.keys['p256dh'],
        auth: json.keys['auth'],
        expiration: subscription.expirationTime,
      }) } catch (error) {
        await subscription.unsubscribe().catch(() => false)
        throw error
      }
      setEnabled(true)
      setMessage('تمام. لو الأوردر جهز والإشعار ما ظهرش، الحالة هتتحدث هنا على الصفحة.')
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : 'تعذر تفعيل الإشعارات. تقدر تتابع الأوردر من الصفحة.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!publicKey) return null

  return (
    <div className="mt-6 space-y-3 border-t border-line pt-5">
      {enabled ? null : (
        <Button
          variant="secondary"
          className="min-h-12 w-full"
          disabled={busy}
          onClick={() => void enable()}
        >
          {busy ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Bell className="size-4" />}
          {busy ? 'بيتم التفعيل...' : 'السماح بإشعارات المتصفح'}
        </Button>
      )}
      <p className="text-sm leading-6 text-muted" role="status">
        {message ?? OPTIONAL_HINT}
      </p>
    </div>
  )
}

async function waitForActiveWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  const worker = registration.installing ?? registration.waiting ?? registration.active
  if (worker && worker.state !== 'activated') {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error('Service worker did not activate.'))
      }, 10_000)
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') {
          window.clearTimeout(timer)
          resolve()
        }
        if (worker.state === 'redundant') {
          window.clearTimeout(timer)
          reject(new Error('Service worker became redundant.'))
        }
      })
    })
  }
  return navigator.serviceWorker.ready
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index)
  }
  return output
}
