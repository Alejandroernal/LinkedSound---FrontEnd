export type AppPage = 'Discovery' | 'Explorer' | 'Messages' | 'Profile' | 'Login' | 'Register' | 'Validation'

export type SoundCloudTrack = {
  id: string
  title: string
  plays: string
  duration: string
  genre: string
  audioUrl?: string
  soundcloudLink?: string
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

  // Campos adicionales para presentación e interactividad
  id?: string
  image?: string
  match?: string
  badge?: string
  itemRole?: 'Perfil' | 'Evento'
  isProfile?: boolean
  soundcloudHandle?: string
  tracks?: SoundCloudTrack[]
  
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
}

// Backward compatibility alias
export type Profile = UserProfile


