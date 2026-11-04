self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let title = 'Picko'
  let body = ''
  let tag = 'smart-order-ready'
  let url = '/'
  let vibrate = [320, 140, 320, 140, 520]

  try {
    const payload = event.data ? event.data.json() : null
    if (payload && typeof payload.title === 'string' && payload.title.trim() !== '') {
      title = payload.title
    }
    if (payload && typeof payload.body === 'string') body = payload.body
    if (payload && typeof payload.tag === 'string' && payload.tag.trim() !== '') {
      tag = payload.tag
    }
    if (payload && typeof payload.url === 'string' && payload.url.startsWith('/')) {
      url = payload.url
    }
    if (payload && Array.isArray(payload.vibrate) && payload.vibrate.length > 0) {
      vibrate = payload.vibrate.filter((item) => typeof item === 'number')
    }
  } catch {
    body = ''
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      dir: 'rtl',
      lang: 'ar',
      tag,
      renotify: true,
      silent: false,
      requireInteraction: true,
      vibrate,
      data: { url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path =
    event.notification.data && typeof event.notification.data.url === 'string'
      ? event.notification.data.url
      : '/'
  const target = new URL(path, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.startsWith(target))
      if (existing) return existing.focus()
      if (self.clients.openWindow) return self.clients.openWindow(target)
      return undefined
    }),
  )
})
