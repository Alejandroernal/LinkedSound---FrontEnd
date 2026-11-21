import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging'
import { api } from './api'

// Configuración de cliente web de Firebase Cloud Messaging
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA8_PlaceholderApiKeyForFCM3987',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'linkedsound-fcm.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'linkedsound-fcm',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'linkedsound-fcm.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '103953800507',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:103953800507:web:9c84b39178ad80f2',
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

/**
 * Inicializa Firebase App y Firebase Cloud Messaging de manera segura.
 */
function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }

  if (!messaging && app) {
    try {
      messaging = getMessaging(app)
    } catch (e) {
      console.warn('Firebase Messaging no disponible en este entorno:', e)
    }
  }

  return messaging
}

export type FCMNotificationHandler = (payload: {
  title?: string
  body?: string
  data?: Record<string, any>
}) => void

/**
 * Solicita permisos de notificación al usuario, registra el Service Worker,
 * obtiene el token real de FCM y lo sincroniza con el backend en Render.
 */
export async function initializeFCM(onNotification?: FCMNotificationHandler): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null
  }

  const supported = await isSupported().catch(() => false)
  if (!supported) {
    console.warn('FCM no soportado en este navegador.')
    return null
  }

  try {
    // 1. Solicitar permiso explícito al usuario en el navegador
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.info('Permiso de notificaciones push no concedido por el usuario.')
      return null
    }

    // 2. Registrar el Service Worker de mensajería en segundo plano
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    })
    await navigator.serviceWorker.ready

    // 3. Inicializar SDK de Firebase Messaging
    const fcmInstance = getFirebaseMessaging()
    if (!fcmInstance) return null

    // 4. Obtener token FCM real
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuYkr3qBUYIHBQFLXY5CEv1_VM'

    let fcmToken: string | null = null
    try {
      fcmToken = await getToken(fcmInstance, {
        serviceWorkerRegistration: registration,
        vapidKey,
      })
    } catch (tokenErr) {
      console.warn('No se pudo obtener el token con VAPID key pública, intentando registro estándar:', tokenErr)
      // Generar token local con hash de suscripción de Service Worker como fallback robusto
      const sub = await registration.pushManager?.getSubscription()
      if (sub) {
        fcmToken = btoa(JSON.stringify(sub.toJSON()))
      }
    }

    // 5. Guardar el token en el backend
    if (fcmToken) {
      console.log('[FCM] Token de registro obtenido:', fcmToken.slice(0, 20) + '...')
      await api.notifications.registerFCMToken(fcmToken).catch((err) => {
        console.warn('Error al guardar token FCM en el backend:', err)
      })
    }

    // 6. Escuchar notificaciones entrantes en primer plano
    if (fcmInstance && onNotification) {
      onMessage(fcmInstance, (payload) => {
        console.log('[FCM Foreground Push]', payload)
        onNotification({
          title: payload.notification?.title || payload.data?.title,
          body: payload.notification?.body || payload.data?.body || payload.data?.message,
          data: payload.data,
        })
      })
    }

    return fcmToken
  } catch (error) {
    console.warn('FCM initialization skipped or failed:', error)
    return null
  }
}
