export type PushCapability = {
  origin: string
  hostname: string
  protocol: string
  isSecureContext: boolean
  hasNotification: boolean
  hasServiceWorker: boolean
  hasPushManager: boolean
}

export type PushBlockReason = 'insecure' | 'unsupported' | null

export function readPushCapability(): PushCapability {
  return {
    origin: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    isSecureContext: window.isSecureContext === true,
    hasNotification: 'Notification' in window,
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager:
      'PushManager' in window ||
      (typeof ServiceWorkerRegistration !== 'undefined' &&
        'pushManager' in ServiceWorkerRegistration.prototype),
  }
}

/**
 * Insecure HTTP hides Service Worker in Chromium, Brave, and Safari.
 * That is not the same as a browser that lacks Web Push on HTTPS.
 */
export function pushBlockReason(capability: PushCapability): PushBlockReason {
  if (!capability.isSecureContext) return 'insecure'
  if (
    !capability.hasNotification ||
    !capability.hasServiceWorker ||
    !capability.hasPushManager
  ) {
    return 'unsupported'
  }
  return null
}

export function pushBlockMessage(reason: PushBlockReason): string | null {
  if (reason === 'insecure') {
    return 'الصفحة مش على سياق آمن. العنوان الحالي HTTP، فالمتصفح بيخفي Service Worker وما يفعّلش الإشعارات. Brave وSafari يحتاجان HTTPS، أو localhost على نفس الجهاز. QR الحالي يستخدم عنوان الشبكة المحلية ولن يكفي.'
  }
  if (reason === 'unsupported') {
    return 'المتصفح ده لا يدعم إشعارات الدفع في الوضع الحالي.'
  }
  return null
}

export function failedPushChecks(capability: PushCapability): string[] {
  const failed: string[] = []
  if (!capability.isSecureContext) failed.push('isSecureContext')
  if (!capability.hasNotification) failed.push('Notification')
  if (!capability.hasServiceWorker) failed.push('serviceWorker')
  if (!capability.hasPushManager) failed.push('PushManager')
  return failed
}

export function classifySubscribeError(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : ''
  const lower = message.toLowerCase()
  if (lower.includes('push service not available')) {
    return 'خدمة دفع الإشعارات غير متاحة في هذا المتصفح. المفتاح وService Worker تمام، لكن المتصفح ما عندهوش اتصال بخدمة الدفع. جرّب Chrome، وفي Brave فعّل خدمات Google لدفع الإشعارات.'
  }
  if (name === 'NotAllowedError') {
    return 'المتصفح منع إنشاء اشتراك الإشعار.'
  }
  if (name === 'AbortError') {
    return 'تعذر تفعيل الإشعارات على الجهاز ده. تقدر تتابع الأوردر من الصفحة.'
  }
  if (name === 'NotSupportedError') {
    return 'المتصفح رفض اشتراك الدفع في هذا السياق.'
  }
  if (name === 'SecurityError' || lower.includes('secure')) {
    return 'المتصفح رفض الاشتراك لأن الصفحة ليست على سياق آمن.'
  }
  return 'تعذر إنشاء اشتراك الإشعار.'
}

export function subscribeErrorDetail(error: unknown): string {
  const name = error instanceof Error && error.name.trim() !== '' ? error.name : 'Error'
  const message = error instanceof Error ? error.message.trim() : ''
  const safe = message
    .replace(/https?:\/\/\S+/giu, '[url]')
    .replace(/[A-Za-z0-9_-]{40,}/gu, '[redacted]')
    .slice(0, 180)
  return safe === '' ? name : `${name}: ${safe}`
}
