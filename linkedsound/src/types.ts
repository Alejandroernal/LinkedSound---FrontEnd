export type AppPage = 'Discovery' | 'Explorer' | 'Messages' | 'Profile' | 'Login' | 'Register' | 'Validation' | 'Admin'

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
  // Campos estándar de registro / edición
  profileImage?: string
  firstName?: string
  lastName?: string
  nickname: string
  email?: string
  password?: string
  role: string
  interestGenres: string[]
  soundcloudUrl: string
  spotifyUrl: string
  instagramUrl: string
  location: string
  descript?: string

  // Campos adicionales para presentación e interactividad (Flexible Perfil vs Evento)
  id?: string
  image?: string
  match?: string
  badge?: string
  itemRole?: 'Perfil' | 'Evento'
  isProfile?: boolean

  // Campos específicos de PERFILES (null / undefined en Eventos)
  soundcloudHandle?: string
  tracks?: SoundCloudTrack[]

  // Campos específicos de EVENTOS (null / undefined en Perfiles)
  eventDate?: string // Formato YYYY-MM-DD
  eventTime?: string // Formato HH:MM
  venue?: string // Nombre del club / venue
  ticketUrl?: string // Enlace para compra de entradas
  isFinished?: boolean // Estado derivado o explícito si expiró

  // Compatibilidad hacia atrás y reglas administrativas
  bio?: string
  description?: string
  category?: string
  tags?: string[]
  spotify?: string
  instagram?: string
  soundcloud?: string
  allowEdit?: boolean
  allowPostRegister?: boolean
  teamDecision?: string
  validationRule?: string
  eliminationPolicy?: string
  finalAction?: string

  // Admin & Status
  status?: 'Active' | 'Suspended' | 'Pending Approval' | 'Banned'
  joinedDate?: string
  reportsCount?: number
}

// Backward compatibility alias
export type Profile = UserProfile
