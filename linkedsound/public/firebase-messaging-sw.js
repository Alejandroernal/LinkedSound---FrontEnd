/* eslint-disable no-restricted-globals */
/* global importScripts, firebase */
// Service Worker de Firebase Cloud Messaging para LinkedSound

importScripts('https://www.gstatic.com/firebasejs/13.4.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/13.4.0/firebase-messaging-compat.js')

const swUrl = new URL(self.location.href)
const params = swUrl.searchParams

const resolveConfigValue = (paramKey, injectedValue) => {
  const fromQuery = params.get(paramKey)
  if (fromQuery) return fromQuery
  if (injectedValue && !injectedValue.startsWith('__VITE_')) return injectedValue
  return ''
}

const firebaseConfig = {
  apiKey: resolveConfigValue('apiKey', '__VITE_FIREBASE_API_KEY__'),
  authDomain: resolveConfigValue('authDomain', '__VITE_FIREBASE_AUTH_DOMAIN__'),
  projectId: resolveConfigValue('projectId', '__VITE_FIREBASE_PROJECT_ID__'),
  storageBucket: resolveConfigValue('storageBucket', '__VITE_FIREBASE_STORAGE_BUCKET__'),
  messagingSenderId: resolveConfigValue('messagingSenderId', '__VITE_FIREBASE_MESSAGING_SENDER_ID__'),
  appId: resolveConfigValue('appId', '__VITE_FIREBASE_APP_ID__'),
}

const hasValidFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
)

if (hasValidFirebaseConfig) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }

  const messaging = firebase.messaging()

  // Manejo de mensajes recibidos en segundo plano (cuando ninguna pestana esta visible)
  messaging.onBackgroundMessage((payload) => {
    // Si payload.notification existe, el SDK de Firebase Messaging ya muestra la notificacion automaticamente.
    // Solo mostramos manualmente cuando el mensaje llega solo con payload.data para evitar duplicados.
    if (payload.notification) {
      return
    }

    const notificationTitle = payload.data?.title || 'LinkedSound'
    const notificationOptions = {
      body: payload.data?.body || payload.data?.message || 'Tienes una nueva notificacion en LinkedSound.',
      icon: '/4147b18c-9b5d-49fe-86fe-07a9023d1d1e.png',
      badge: '/4147b18c-9b5d-49fe-86fe-07a9023d1d1e.png',
      data: payload.data || {},
      tag: payload.data?.notificationId || 'linkedsound-notification',
    }

    self.registration.showNotification(notificationTitle, notificationOptions)
  })
} else {
  console.warn('[FCM SW] Configuracion de Firebase incompleta en el Service Worker.')
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Interaccion al hacer clic en una notificacion del sistema sin enlace gestionado por FCM
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
      return undefined
    })
  )
})
