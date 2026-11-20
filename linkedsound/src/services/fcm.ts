import { api } from './api'

/**
 * Solicita permiso de notificaciones y registra el Service Worker de FCM.
 */
export async function initializeFCM(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return null
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      return null
    }

    // Registrar token simulado o real si está disponible
    const token = registration.active?.scriptURL || 'fcm_web_token'
    if (token) {
      api.notifications.registerFCMToken(token).catch(() => {})
    }

    return registration.scope
  } catch (error) {
    console.warn('FCM registration skipped or failed:', error)
    return null
  }
}
