// Exportacion de tipos oficiales del sistema desde types.ts
// No se almacenan objetos ni arrays hardcodeados en el codigo fuente.
// Todos los datos de la plataforma se consultan dinamicamente desde Supabase.

export type {
  SoundCloudTrack,
  EventItem,
  UserProfile,
  Conversation,
  Message,
  NewMatchItem,
  ProfileCard,
  NavItem,
  NotificationItem,
} from '../types'

export { navItems } from '../types'
