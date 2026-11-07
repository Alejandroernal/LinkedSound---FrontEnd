export type AppPage = 'Discovery' | 'Explorer' | 'Messages' | 'Profile' | 'Login' | 'Register' | 'Validation' | 'Onboarding' | 'Admin'

export type SoundCloudTrack = {
  id?: string
  title: string
  plays?: string | number
  duration?: string
  genre?: string
  audioUrl?: string
  soundcloudLink?: string
  format?: string
  snippetType?: string
  bpm?: string
  key?: string
  fileSize?: string
  order?: number
}

export function isLocalAudioTrack(track?: SoundCloudTrack | null): boolean {
  if (!track) return false

  const scLink = (track.soundcloudLink || '').toLowerCase().trim()
  const aUrl = (track.audioUrl || '').toLowerCase().trim()

  // Si tiene enlace directo a soundcloud.com y no posee un archivo local en audioUrl
  if (scLink.includes('soundcloud.com') && (!aUrl || aUrl.includes('soundcloud.com'))) {
    return false
  }

  // Si tiene URL de archivo de audio local (Storage, blob, mp3, wav, flac, ogg)
  if (aUrl && !aUrl.includes('soundcloud.com')) {
    return true
  }

  // Si tiene formato de archivo local explicito
  const fmt = (track.format || '').toUpperCase().trim()
  if (['WAV', 'MP3', 'FLAC', 'OGG'].includes(fmt)) {
    return true
  }

  // Si tiene metadata generada por el uploader de muestras locales
  if (track.snippetType || track.fileSize || track.bpm || track.key) {
    return true
  }

  if (track.id && (track.id.startsWith('sample_track_') || track.id.startsWith('local_'))) {
    return true
  }

  return false
}

export function isSoundCloudTrack(track?: SoundCloudTrack | null): boolean {
  if (!track) return false

  // Si es un track local de audio subido, queda excluido de SoundCloud
  if (isLocalAudioTrack(track)) {
    return false
  }

  const scLink = (track.soundcloudLink || '').toLowerCase().trim()
  const aUrl = (track.audioUrl || '').toLowerCase().trim()

  if (scLink.includes('soundcloud.com') || aUrl.includes('soundcloud.com')) {
    return true
  }

  if (track.duration?.toLowerCase().includes('soundcloud') || track.genre?.toLowerCase().includes('soundcloud')) {
    return true
  }

  return false
}

export type UserReport = {
  id: string
  reportedUser: string
  reporterUser: string
  reason: string
  details: string
  date: string
  status: 'Pending' | 'Resolved' | 'Dismissed'
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
  exactTimestamp?: string
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

export type ImageItem = {
  id?: string
  url: string
  alt?: string
  order?: number
}

export type EventCommentItem = {
  id: string
  eventId: string
  userId: string
  content: string
  createdAt: string
  updatedAt?: string
  user?: {
    id: string
    nickname: string
    firstName?: string
    lastName?: string
    profileImage?: string
  } | null
}

export type SnippetTypeItem = {
  id: string
  name: string
  description?: string
  order?: number
}

export type MusicalKeyItem = {
  id: string
  name: string
  description?: string
  order?: number
}

// Entidad normalizada para Ubicaciones y Lugares
export type LocationItem = {
  id?: string
  name?: string
  formattedAddress: string
  country?: string
  province?: string
  city?: string
  streetAddress?: string
  latitude?: number
  longitude?: number
  createdAt?: string
  updatedAt?: string
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

  // Perfil Profesional y Rol de Cuenta
  role?: 'Productor' | 'Artista' | 'Productor y Artista' | string
  accountRole?: 'Usuario' | 'Administrador' | string
  isAdmin?: boolean
  interestGenres?: string[]
  commonGenres?: string[]
  affinityReason?: string
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
  userImages?: ImageItem[]

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
  locationId?: string
  locationData?: LocationItem

  // Administración y Estado
  status?: 'Active' | 'Suspended' | 'Pending Approval' | 'Banned'
  joinedDate?: string
  reportsCount?: number

  // Reglas de negocio y permisos xs
  allowEdit?: boolean
  allowPostRegister?: boolean
  teamDecision?: string
  statusJustification?: string
  validationRule?: string
  eliminationPolicy?: string
  finalAction?: string

  // Estado de Match recíproco previo
  preLiked?: boolean

  // Identificación del creador / auditoría
  owner?: string
  ownerId?: string
  ownerNickname?: string
  createdAt?: string
  updatedAt?: string
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
  images?: string[]
  eventImages?: ImageItem[]

  // Géneros y etiquetas
  interestGenres: string[]
  commonGenres?: string[]
  affinityReason?: string
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
  locationId?: string
  locationData?: LocationItem

  // Administración y Estado
  status?: 'Active' | 'Suspended' | 'Pending Approval' | 'Banned'
  createdDate?: string
  reportsCount?: number

  // Identificación del organizador y auditoría
  ownerId?: string
  ownerNickname?: string
  createdAt?: string
  updatedAt?: string

  // Enlaces o temas opcionales del evento
  soundcloudUrl?: string
  spotifyUrl?: string
  instagramUrl?: string
  tracks?: SoundCloudTrack[]
  comments?: EventCommentItem[]

  // Estado de Match recíproco previo
  preLiked?: boolean
}

// Tipo de unión para Explorer y visualización general de tarjetas
export type ExplorerItemCard = UserProfile | EventItem

// Type Guard para diferenciar Perfiles de Usuarios de Eventos
export function isUserProfile(card: ExplorerItemCard): card is UserProfile {
  return !('eventDate' in card)
}

export type NotificationItem = {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'match' | 'message' | 'system' | 'report' | 'like' | 'match_request'
  linkPage?: AppPage
}

export type Message = {
  id: string
  sender: 'me' | 'them'
  text: string
  time: string
  attachment?: {
    url: string
    name: string
    type: 'audio' | 'image'
    size?: string
    format?: string
  }
}

export type Conversation = {
  id: string
  name: string
  role: string
  avatar: string
  accent: 'purple' | 'pink' | 'cyan' | 'gold'
  status: string
  preview: string
  time: string
  unread: number
  pinned?: boolean
  muted?: boolean
  blocked?: boolean
  profileImage?: string
  location?: string
}

export type NewMatchItem = {
  id: string
  name: string
  role: string
  location: string
  match: string
  profileImage: string
  bio?: string
  genres?: string[]
  accent: 'purple' | 'pink' | 'cyan' | 'gold'
  date: string
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

export type ProfileCard = ExplorerItemCard

export type NavItem = {
  label: AppPage
  active?: boolean
}

export const navItems: NavItem[] = [
  { label: 'Discovery' },
  { label: 'Explorer' },
  { label: 'Messages' },
  { label: 'Profile' },
]

