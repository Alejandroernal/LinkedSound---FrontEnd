/* eslint-disable no-restricted-globals */
// Scripts y Service Worker de Firebase Cloud Messaging para LinkedSound

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Manejo de recepción de eventos Push en segundo plano
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const payload = event.data.json()
    const notificationTitle = payload.notification?.title || payload.title || 'LinkedSound'
    const notificationOptions = {
      body: payload.notification?.body || payload.body || 'Tienes una nueva notificacion en LinkedSound.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {},
      tag: payload.tag || 'linkedsound-notification',
    }

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    )
  } catch (err) {
    console.warn('Error al procesar payload push:', err)
  }
})

// Interacción al hacer clic en la notificación del sistema
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
