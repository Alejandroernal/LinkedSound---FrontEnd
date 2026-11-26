import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  isSupported,
  type Messaging,
} from 'firebase/messaging'
import { api, getToken as getAuthToken } from './api'

// Configuracion de cliente web de Firebase Cloud Messaging desde variables de entorno
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null
let inFlightInit: Promise<string | null> | null = null
let activeNotificationHandler: FCMNotificationHandler | null = null
let unsubscribeOnMessage: (() => void) | null = null
let lastSyncedFcmToken: string | null = null
let lastSyncedAuthToken: string | null = null

export type FCMNotificationHandler = (payload: {
  title?: string
  body?: string
  data?: Record<string, any>
}) => void

/**
 * Inicializa Firebase App y Firebase Cloud Messaging de manera segura.
 */
function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.projectId ||
    !firebaseConfig.messagingSenderId ||
    !firebaseConfig.appId
  ) {
    console.warn('[FCM] Variables VITE_FIREBASE_* incompletas; se omite inicializacion.')
    return null
  }

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }

  if (!messaging && app) {
    try {
      messaging = getMessaging(app)
    } catch (e) {
      console.warn('[FCM] Firebase Messaging no disponible en este entorno:', e)
    }
  }

  return messaging
}

/**
 * Espera a que la registracion del Service Worker tenga un worker activo.
 * Evita bloqueos de navigator.serviceWorker.ready en recargas forzadas (hard reload)
 * y garantiza que pushManager.subscribe se invoque sobre un SW ya activado.
 */
async function waitForServiceWorkerActive(
  registration: ServiceWorkerRegistration,
  timeoutMs = 10000
): Promise<ServiceWorkerRegistration> {
  const incomingWorker = registration.installing || registration.waiting

  if (!incomingWorker && registration.active?.state === 'activated') {
    return registration
  }

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      if (registration.active) {
        resolve()
      } else {
        reject(new Error(`Timeout esperando activacion del Service Worker (${timeoutMs} ms).`))
      }
    }, timeoutMs)

    const targetWorker = incomingWorker || registration.active
    if (!targetWorker) {
      window.clearTimeout(timer)
      reject(new Error('No se encontro un Service Worker en instalacion o activo.'))
      return
    }

    if (targetWorker.state === 'activated') {
      window.clearTimeout(timer)
      resolve()
      return
    }

    const onStateChange = () => {
      if (targetWorker.state === 'activated') {
        targetWorker.removeEventListener('statechange', onStateChange)
        window.clearTimeout(timer)
        resolve()
      } else if (targetWorker.state === 'redundant') {
        targetWorker.removeEventListener('statechange', onStateChange)
        window.clearTimeout(timer)
        if (registration.active) {
          resolve()
        } else {
          reject(new Error('El Service Worker paso a estado redundante antes de activarse.'))
        }
      }
    }

    targetWorker.addEventListener('statechange', onStateChange)
  })

  return registration
}

/**
 * Registra el Service Worker oficial de Firebase Messaging pasando los parametros de configuracion
 * y asegurando que quede activo antes de solicitar el token.
 */
async function registerFirebaseServiceWorker(): Promise<ServiceWorkerRegistration> {
  const swParams = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  })

  const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`
  const registration = await navigator.serviceWorker.register(swUrl, {
    scope: '/',
    updateViaCache: 'none',
  })

  return waitForServiceWorkerActive(registration)
}

/**
 * Obtiene el token FCM usando getToken(). Si existe una suscripcion push previa danada o con
 * distinta VAPID key, limpia la suscripcion y reintenta una vez.
 */
async function requestFCMTokenWithRetry(
  fcmInstance: Messaging,
  registration: ServiceWorkerRegistration,
  vapidKey?: string
): Promise<string | null> {
  const tokenOptions = {
    serviceWorkerRegistration: registration,
    ...(vapidKey ? { vapidKey } : {}),
  }

  try {
    const token = await getToken(fcmInstance, tokenOptions)
    return token || null
  } catch (firstErr: any) {
    const errName = firstErr?.name || ''
    const errMsg = String(firstErr?.message || firstErr || '')

    console.warn('[FCM] Primer intento de getToken fallo, limpiando suscripcion push previa y reintentando:', firstErr)

    try {
      const existingSub = await registration.pushManager?.getSubscription()
      if (existingSub) {
        await existingSub.unsubscribe()
      }
      await deleteToken(fcmInstance).catch(() => {})
    } catch {
      // Continuar con el reintento incluso si la limpieza previa falla
    }

    await new Promise((resolve) => window.setTimeout(resolve, 400))

    try {
      const retryToken = await getToken(fcmInstance, tokenOptions)
      return retryToken || null
    } catch (retryErr: any) {
      if (errName === 'AbortError' || errMsg.includes('push service error')) {
        console.warn(
          '[FCM] Error del servicio push del navegador (AbortError). Verifica que el navegador tenga habilitados los servicios push de Google (no modo incognito, ni bloqueo de Google Push en Brave/red):',
          retryErr
        )
      } else {
        console.warn('[FCM] No se pudo obtener el token FCM tras reintento:', retryErr)
      }
      return null
    }
  }
}

/**
 * Limpia el estado sincronizado en memoria al cerrar sesion para que el proximo usuario
 * registre su token correctamente en el backend.
 */
export function resetFCMState(): void {
  lastSyncedFcmToken = null
  lastSyncedAuthToken = null
  activeNotificationHandler = null
  if (unsubscribeOnMessage) {
    unsubscribeOnMessage()
    unsubscribeOnMessage = null
  }
}

/**
 * Solicita permisos de notificacion al usuario, registra el Service Worker de Firebase Messaging,
 * obtiene el token real de FCM y lo persiste en el backend mediante POST /api/notifications/fcm-token.
 */
export async function initializeFCM(onNotification?: FCMNotificationHandler): Promise<string | null> {
  if (onNotification) {
    activeNotificationHandler = onNotification
  }

  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null
  }

  // Serializar llamadas concurrentes (ej. React StrictMode o actualizacion de profile.id)
  if (inFlightInit) {
    return inFlightInit
  }

  const runInitialization = async (): Promise<string | null> => {
    const supported = await isSupported().catch(() => false)
    if (!supported) {
      console.warn('[FCM] Firebase Cloud Messaging no esta soportado en este navegador.')
      return null
    }

    try {
      // 1. Verificar o solicitar permiso explicito al usuario en el navegador
      let permission: NotificationPermission = Notification.permission
      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }
      if (permission !== 'granted') {
        console.info('[FCM] Permiso de notificaciones push no concedido por el usuario.')
        return null
      }

      // 2. Inicializar SDK de Firebase Messaging
      const fcmInstance = getFirebaseMessaging()
      if (!fcmInstance) return null

      // 3. Registrar el Service Worker de Firebase Messaging y esperar a que este activo
      const registration = await registerFirebaseServiceWorker()

      // 4. Registrar listener unico de mensajes en primer plano
      if (!unsubscribeOnMessage) {
        unsubscribeOnMessage = onMessage(fcmInstance, (payload) => {
          console.log('[FCM Foreground Push]', payload)
          if (activeNotificationHandler) {
            activeNotificationHandler({
              title: payload.notification?.title || payload.data?.title,
              body: payload.notification?.body || payload.data?.body || payload.data?.message,
              data: payload.data,
            })
          }
        })
      }

      // 5. Obtener token FCM real usando la VAPID key publica configurada
      const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim() || undefined
      const fcmToken = await requestFCMTokenWithRetry(fcmInstance, registration, vapidKey)

      if (!fcmToken) {
        return null
      }

      console.log('[FCM] Token de registro obtenido:', fcmToken.slice(0, 20) + '...')

      // 6. Persistir el token en el backend mediante POST /api/notifications/fcm-token
      const currentAuthToken = getAuthToken()
      if (
        currentAuthToken &&
        (lastSyncedFcmToken !== fcmToken || lastSyncedAuthToken !== currentAuthToken)
      ) {
        const res = await api.notifications.registerFCMToken(fcmToken)
        if (res?.success) {
          lastSyncedFcmToken = fcmToken
          lastSyncedAuthToken = currentAuthToken
          console.log('[FCM] Token persistido correctamente en el backend.')
        } else {
          console.warn('[FCM] El backend rechazo el registro del token FCM:', res?.message || res)
        }
      }

      return fcmToken
    } catch (error) {
      console.warn('[FCM] Error durante la inicializacion de FCM:', error)
      return null
    }
  }

  inFlightInit = runInitialization().finally(() => {
    inFlightInit = null
  })

  return inFlightInit
}
