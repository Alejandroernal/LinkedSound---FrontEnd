export type AppPage = 'Discovery' | 'Explorer' | 'Messages' | 'Profile' | 'Login' | 'Register' | 'Validation' | 'Onboarding' | 'Admin'

export type SoundCloudTrack = {
  id: string
  title: string
  plays: string
  duration: string
  genre: string
  audioUrl?: string
  soundcloudLink?: string
}

export type UserReport = {
  id: string
  reportedUser: string
  reporterUser: string
  reason: string
  details: string
  date: string
  status: 'Pending' | 'Reviewed' | 'Resolved' | 'Dismissed'
  severity: 'Low' | 'Medium' | 'High'
  origin: 'Discovery' | 'Explorer'
  targetType: 'Perfil' | 'Evento'
  adminComment?: string
}

export type UserActivityLog = {
  id: string
  user: string
  action: string
  timestamp: string
  ip: string
  device: string
  module: 'Perfil' | 'Explorer' | 'Sistema'
}

export type ExplorerItem = {
  id: string
  title: string
  type: 'Perfil' | 'Evento'
  owner: string
  location: string
  genres: string[]
  status: 'Active' | 'Under Review' | 'Hidden'
  createdDate: string
  views: number
  description: string
  image?: string
}

export type UserProfile = {
  // Identificación y Registro
  id?: string
  nickname: string
  firstName: string
  lastName: string
  email?: string
  password?: string
  profileImage?: string

  // Perfil Profesional y Descripción
  role: string
  interestGenres?: string[]
  description?: string
  match?: string
  badge?: string
  category?: string
  tags?: string[]

  // Enlaces y Redes Sociales
  soundcloudUrl?: string
  spotifyUrl?: string
  instagramUrl?: string
  spotify?: string
  instagram?: string
  soundcloud?: string

  // Campos específicos de CREADORES / PERFILES
  soundcloudHandle?: string
  tracks?: SoundCloudTrack[]

  // Discriminador de tipo
  itemRole?: 'Perfil'
  isProfile?: true

  // Localización detallada
  location: string
  country?: string // País
  province?: string // Provincia / Estado
  city?: string // Localidad / Ciudad
  streetAddress?: string // Calle y Altura
  latitude?: number
  longitude?: number

  // Administración y Estado
  status?: 'Active' | 'Suspended' | 'Pending Approval' | 'Banned'
  joinedDate?: string
  reportsCount?: number

  // Reglas de negocio y permisos xs
  allowEdit?: boolean
  allowPostRegister?: boolean
  teamDecision?: string
  validationRule?: string
  eliminationPolicy?: string
  finalAction?: string
}

// Backward compatibility alias
export type Profile = UserProfile

// Clase/Tipo dedicado exclusivamente para EVENTOS
export type EventItem = {
  id?: string
  title?: string // Nombre del evento
  nickname: string // Nombre / Título del evento para renderizado uniforme
  owner?: string // Organizador / Creador
  role: string // Subtítulo del evento (ej: "Berlin Live Session")

  // Atributos de fecha, hora y lugar del Evento
  eventDate: string // Formato YYYY-MM-DD
  eventTime?: string // Formato HH:MM
  venue?: string // Nombre del club / venue
  ticketUrl?: string // Enlace para compra de entradas
  isFinished?: boolean // Estado si expiró el evento

  // Descripción e imágenes
  description?: string
  profileImage?: string

  // Géneros y etiquetas
  interestGenres: string[]
  match?: string
  badge?: string
  category?: string
  tags?: string[]

  // Discriminador de tipo
  itemRole?: 'Evento'
  isProfile?: false

  // Localización detallada del evento
  location: string
  country?: string // País
  province?: string // Provincia / Estado
  city?: string // Localidad / Ciudad
  streetAddress?: string // Calle y Altura
  latitude?: number
  longitude?: number

  // Administración y Estado
  status?: 'Active' | 'Suspended' | 'Pending Approval' | 'Banned'
  createdDate?: string
  reportsCount?: number

  // Enlaces o temas opcionales del evento
  soundcloudUrl?: string
  spotifyUrl?: string
  instagramUrl?: string
  tracks?: SoundCloudTrack[]
}

// Tipo de unión para Explorer y visualización general de tarjetas
export type ExplorerItemCard = UserProfile | EventItem

// Type Guard para diferenciar Perfiles de Usuarios de Eventos
export function isUserProfile(card: ExplorerItemCard): card is UserProfile {
  return !('eventDate' in card) && card.itemRole !== 'Evento'
}

export type NotificationItem = {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'match' | 'message' | 'system' | 'report' | 'like'
  linkPage?: AppPage
}

// Función helper para formatear fechas a DD/MM/YYYY
export function formatEventDate(dateStr?: string): string {
  if (!dateStr) return ''
  const parts = dateStr.trim().split('-')
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  return dateStr
}

