export type AppPage = 'Discovery' | 'Explorer' | 'Messages' | 'Profile' | 'Login' | 'Register' | 'Validation'

export type Profile = {
  nickname: string
  category: string
  role: string
  location: string
  bio: string
  genres: string
  interestGenres: string[]
  tags: string
  spotify: string
  instagram: string
  soundcloud: string
  profileImage: string
  allowEdit: boolean
  allowPostRegister: boolean
  teamDecision: string
  validationRule: string
  eliminationPolicy: string
  finalAction: string
}

