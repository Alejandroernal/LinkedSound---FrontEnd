import type { AppPage, UserProfile, EventItem, ExplorerItemCard, SoundCloudTrack } from '../types'

export type { SoundCloudTrack, EventItem, UserProfile }

export type NavItem = {
  label: AppPage
  active?: boolean
}

export type FilterOption = {
  label: string
  checked?: boolean
}

export type ProfileCard = ExplorerItemCard


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

export const navItems: NavItem[] = [
  { label: 'Discovery' },
  { label: 'Explorer' },
  { label: 'Messages' },
  { label: 'Profile' },
]

export const defaultUserProfile: UserProfile = {
  profileImage: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
  firstName: 'Kaelen',
  lastName: 'Voss',
  nickname: 'Kaelen Voss',
  email: 'kaelen@linkedsound.app',
  password: 'password123',
  role: 'Productor/Artista',
  interestGenres: ['Synthwave', 'Electronic', 'Dark Pop'],
  soundcloudUrl: 'https://soundcloud.com/kaelen-voss',
  spotifyUrl: 'https://open.spotify.com/artist/kaelenvoss',
  instagramUrl: 'https://instagram.com/kaelenvoss',
  location: 'Berlin, Germany',
  description: 'Building cinematic soundscapes with modular synths, analog drums, and hybrid live vocals.',
  allowEdit: true,
  allowPostRegister: true,
  teamDecision: 'Permitir cambiar el rol (Productor/Artista) después del alta, y si eso recalcula los matches generados por afinidad. -> Sí, permite cambiar el rol y recalcularía matches.',
  validationRule: 'Definir el formato de validación de la URL de SoundCloud cargada manualmente (ej. exigir dominio soundcloud.com) antes de aceptarla como válida. -> Sí, que cargue manualmente y después que sea verificado ese link.',
  eliminationPolicy: 'Definir si "eliminar perfil" implica baja total de la cuenta o una desactivación temporal reversible. -> Baja total de la cuenta.',
  finalAction: 'Navegación tras confirmar la eliminación → pantalla de Login. -> Correcto, cuando se elimina el perfil que te direccione al login.',
}

export const tags = ['Synthwave', 'DarkElectro', 'Cyberpunk', 'IndustrialVocals', 'AnalogMod']

export const formFilters: FilterOption[] = [
  { label: 'Artist', checked: true },
  { label: 'Producers' },
]

export const soundFilters = ['Darkwave X', 'Industrial X', '+ Trap Metal', '+ EBM', 'Ambient']

export const queueItems = [
  { name: 'Alex Vance', percent: '94%', color: 'purple', avatar: 'AV' },
  { name: 'Nomi', percent: '87%', color: 'pink', avatar: 'N' },
  { name: 'Soren', percent: '81%', color: 'cyan', avatar: 'S' },
  { name: 'Kira M.', percent: '78%', color: 'gold', avatar: 'K' },
]



export const recommendations: ProfileCard[] = [
  {
    firstName: 'Kylian',
    lastName: 'Mbappé',
    nickname: 'Kylian Dictador',
    role: 'Productor/Artista',
    location: 'Francia, paris',
    interestGenres: ['ModularSynth', 'Live', 'Drone'],
    soundcloudUrl: 'https://soundcloud.com/jesus-922347355',
    spotifyUrl: 'https://open.spotify.com/artist/kylian',
    instagramUrl: 'https://instagram.com/kyliandictador',
    profileImage:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRk3D-J2lE2LLanWoFeEkrMec5OB_tRjxzqgg_Y9w7iNXOUAjPCWDTrICZ8&s=10',
    match: '22%',
    description: 'Analog textures and harsh synth design.',
    badge: 'Producer',
    isProfile: true,
    soundcloudHandle: 'jesus-922347355',
    tracks: [
      {
        id: 'kd0_rec',
        title: 'pink_mew_laughing_d...',
        plays: '249',
        duration: '0:42',
        genre: 'Último tema subido',
        soundcloudLink: 'https://soundcloud.com/jesus-922347355',
      },
      {
        id: 'kd1_rec',
        title: 'KYLIAN MBAPPE #808',
        plays: '24.5k',
        duration: '6:20',
        genre: 'Eurorack',
        soundcloudLink: 'https://soundcloud.com/jesus-922347355/kylian-mbappe-dictador-anthem?si=19e7123b5b73411cb1db73c20ee79e73&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing',
      },
    ],
  },
  {
    firstName: 'Luna',
    lastName: 'Sol',
    nickname: 'sOLEDADlUNA',
    role: 'Artista',
    location: 'New York, NY',
    interestGenres: ['Vocal', 'Alt Pop', 'Analog'],
    soundcloudUrl: 'https://soundcloud.com/lunasol_official',
    spotifyUrl: 'https://open.spotify.com/artist/lunasol',
    instagramUrl: 'https://instagram.com/lunasol',
    profileImage:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    match: '96%',
    description: 'Warm vocals with cinematic melodic hooks.',
    badge: 'Artist',
    isProfile: true,
    soundcloudHandle: 'lunasol_official',
    tracks: [
      {
        id: 'ls1',
        title: 'Cinematic Melodies (Acapella Stems)',
        plays: '52.8k',
        duration: '3:30',
        genre: 'Vocal',
        soundcloudLink: 'https://soundcloud.com/search?q=lunasol',
      },
      {
        id: 'ls2',
        title: 'Hypnotic Tape Delays (R&B Edit)',
        plays: '31.4k',
        duration: '4:05',
        genre: 'Alt Pop',
        soundcloudLink: 'https://soundcloud.com/search?q=lunasol',
      },
    ],
  },
  {
    firstName: 'Facundo',
    lastName: 'Doro',
    nickname: 'Golden Boy',
    role: 'Productor/Artista',
    location: 'Entre Rios, Argentina',
    interestGenres: ['HardTrap', 'Producer', 'Artist'],
    soundcloudUrl: 'https://soundcloud.com/goldennnnnnnnnnnnnnn',
    spotifyUrl: 'https://open.spotify.com/artist/goldenboy',
    instagramUrl: 'https://instagram.com/goldenboy',
    profileImage:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-sWJbrWmlA-PfqSy_6YhFu-bsy0Lz8zK8Vy-p36sVb6kM3qgCeWhDIUNI&s=10',
    match: '100%',
    description: 'HardTrap Specialist, Producer, Artist.',
    badge: 'Producer',
    isProfile: true,
    soundcloudHandle: 'goldennnnnnnnnnnnnnn',
    tracks: [
      {
        id: 'gb0_rec',
        title: 'Step back - !Deoro',
        plays: '158',
        duration: '2:22',
        genre: 'HardTrap',
        soundcloudLink: 'https://soundcloud.com/goldennnnnnnnnnnnnnn',
      },
      {
        id: 'gb1_rec',
        title: '0ffl1n3 - !Deoro',
        plays: '156',
        duration: '2:43',
        genre: 'HardTrap',
        soundcloudLink: 'https://soundcloud.com/goldennnnnnnnnnnnnnn/4nd0-0ffl1n3-deoro?si=e618d823716e4d25a3bb80ea3f627bfd&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing',
      },
    ],
  },
  {
    firstName: 'Elena',
    lastName: 'Rostova',
    nickname: 'Elena Rostova',
    role: 'Artista',
    location: 'Berlin, Germany',
    interestGenres: ['Darkwave', 'Synthwave', 'Vocal'],
    soundcloudUrl: 'https://soundcloud.com/elena-rostova',
    spotifyUrl: 'https://open.spotify.com/artist/elenarostova',
    instagramUrl: 'https://instagram.com/elenarostova',
    profileImage:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    match: '91%',
    description: 'Ethereal Gothic vocals layered over heavy retro-futuristic basslines.',
    badge: 'Artist',
    isProfile: true,
    soundcloudHandle: 'elena-rostova',
    tracks: [
      {
        id: 'er1',
        title: 'Neon Shadows (Vocal Cut)',
        plays: '18.3k',
        duration: '3:45',
        genre: 'Darkwave',
        soundcloudLink: 'https://soundcloud.com/search?q=elena-rostova',
      },
    ],
  },
  {
    firstName: 'Marcus',
    lastName: 'Cyber',
    nickname: 'Marcus Cyber',
    role: 'Productor',
    location: 'Tokyo, Japan',
    interestGenres: ['Cyberpunk', 'Industrial', 'EBM'],
    soundcloudUrl: 'https://soundcloud.com/marcus-cyber',
    spotifyUrl: 'https://open.spotify.com/artist/marcuscyber',
    instagramUrl: 'https://instagram.com/marcuscyber',
    profileImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
    match: '88%',
    description: 'Futuristic Cyberpunk beats and distorted industrial basslines.',
    badge: 'Producer',
    isProfile: true,
    soundcloudHandle: 'marcus-cyber',
    tracks: [
      {
        id: 'mc1',
        title: 'Neo Tokyo 2099',
        plays: '42.1k',
        duration: '5:12',
        genre: 'Cyberpunk',
        soundcloudLink: 'https://soundcloud.com/search?q=marcus-cyber',
      },
    ],
  },
  {
    firstName: 'Mateo',
    lastName: 'Sound',
    nickname: 'Mateo Sound',
    role: 'Productor',
    location: 'Buenos Aires, Argentina',
    interestGenres: ['Tech House', 'Electronic', 'Minimal'],
    soundcloudUrl: 'https://soundcloud.com/mateosound',
    spotifyUrl: 'https://open.spotify.com/artist/mateosound',
    instagramUrl: 'https://instagram.com/mateosound',
    profileImage:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    match: '84%',
    description: 'Groovy underground minimal & tech house producer based in BA.',
    badge: 'Producer',
    isProfile: true,
    soundcloudHandle: 'mateosound',
    tracks: [
      {
        id: 'ms1',
        title: 'Subterranean Groove',
        plays: '12.4k',
        duration: '6:02',
        genre: 'Tech House',
        soundcloudLink: 'https://soundcloud.com/search?q=mateosound',
      },
    ],
  },
  {
    firstName: 'Aria',
    lastName: 'Vibe',
    nickname: 'Aria Vibe',
    role: 'Artista',
    location: 'London, UK',
    interestGenres: ['Ambient', 'Lo-Fi', 'Vocal'],
    soundcloudUrl: 'https://soundcloud.com/ariavibe',
    spotifyUrl: 'https://open.spotify.com/artist/ariavibe',
    instagramUrl: 'https://instagram.com/ariavibe',
    profileImage:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    match: '79%',
    description: 'Atmospheric ambient textures and dream-pop vocal loops.',
    badge: 'Artist',
    isProfile: true,
    soundcloudHandle: 'ariavibe',
    tracks: [
      {
        id: 'av1',
        title: 'Midnight Rain Echoes',
        plays: '8.9k',
        duration: '2:50',
        genre: 'Ambient',
        soundcloudLink: 'https://soundcloud.com/search?q=ariavibe',
      },
    ],
  },
]


export const eventCards: ProfileCard[] = [
  {
    nickname: 'Circuito Nocturno',
    role: 'Berlin live session',
    location: 'Berlin, Germany',
    interestGenres: ['Live', 'Techno', 'Cinematic', 'Experimental'],
    profileImage:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    match: '96%',
    description: 'A dark, rhythmic fusion of techno textures and gritty vocal layers.',
    badge: 'Featured',
    itemRole: 'Evento',
    isProfile: false,

    eventDate: '2026-10-15',
    eventTime: '23:00',
    venue: 'Watergate Club Berlin',
    ticketUrl: 'https://ra.co/events/berlin-circuito-nocturno',
    isFinished: false,
    country: 'Alemania',
    province: 'Berlín',
    city: 'Mitte',
    streetAddress: 'Köpenicker Str. 70',

    soundcloudUrl: '',
    spotifyUrl: '',
    instagramUrl: '',
    tracks: undefined,
  },
  {
    nickname: 'Cyberpunk Sound Expo 2026',
    role: 'Festival & Workshop',
    location: 'Tokyo, Japan',
    interestGenres: ['Cyberpunk', 'Industrial', 'Synthwave'],
    profileImage:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
    match: '92%',
    description: 'Un encuentro masivo de música electrónica industrial, sintetizadores analógicos e instalaciones audiovisuales.',
    badge: 'Evento',
    itemRole: 'Evento',
    isProfile: false,

    eventDate: '2026-11-20',
    eventTime: '18:00',
    venue: 'AGEHA Tokyo Dome Arena',
    ticketUrl: 'https://eventbrite.com/e/cyberpunk-sound-expo-2026',
    isFinished: false,
    country: 'Japón',
    province: 'Tokio',
    city: 'Shinkiba',
    streetAddress: '2 Chome-4-38 Shinkiba',

    soundcloudUrl: '',
    spotifyUrl: '',
    instagramUrl: '',
  },
  {
    nickname: 'Buenos Aires Underground Jam',
    role: 'Jam Session Live',
    location: 'Buenos Aires, Argentina',
    interestGenres: ['Tech House', 'Minimal', 'Electronic'],
    profileImage:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
    match: '85%',
    description: 'Jam libre para productores y DJs locales de minimal y tech house en Palermo.',
    badge: 'Evento',
    itemRole: 'Evento',
    isProfile: false,

    eventDate: '2026-09-15',
    eventTime: '22:00',
    venue: 'Niceto Club Palermo',
    ticketUrl: 'https://passline.com/eventos/buenos-aires-underground-jam',
    isFinished: true,
    country: 'Argentina',
    province: 'Buenos Aires',
    city: 'Palermo (CABA)',
    streetAddress: 'Niceto Vega 5510',

    soundcloudUrl: '',
    spotifyUrl: '',
    instagramUrl: '',
  },
]

export const exploreCards: ProfileCard[] = [
  eventCards[0],
  ...recommendations,
  eventCards[1],
  eventCards[2],
]

export const conversations: Conversation[] = [
  {
    id: 'luna-sol',
    name: 'Luna Sol',
    role: 'Artista',
    avatar: 'LS',
    accent: 'purple',
    status: 'Online',
    preview: '¡Recibido! Le echo un ojo a las maquetas de sintetizador.',
    time: '14:32',
    unread: 2,
    profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'golden-boy',
    name: 'Golden Boy',
    role: 'Productor/Artista',
    avatar: 'GB',
    accent: 'gold',
    status: 'Online',
    preview: 'Perfecto, te pasé los stems con el 808 ajustado.',
    time: '13:18',
    unread: 0,
    profileImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-sWJbrWmlA-PfqSy_6YhFu-bsy0Lz8zK8Vy-p36sVb6kM3qgCeWhDIUNI&s=10',
  },
  {
    id: 'elena-rostova',
    name: 'Elena Rostova',
    role: 'Artista',
    avatar: 'ER',
    accent: 'pink',
    status: 'Offline',
    preview: 'Me encanta esa progresión de acordes. Grabando tomas de voz.',
    time: 'Ayer',
    unread: 1,
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'marcus-cyber',
    name: 'Marcus Cyber',
    role: 'Productor',
    avatar: 'MC',
    accent: 'cyan',
    status: 'Offline',
    preview: '¿Tuviste tiempo de escuchar el beat industrial?',
    time: '10 May',
    unread: 0,
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
  },
]

export const messagesByConversation: Record<string, Message[]> = {
  'luna-sol': [
    { id: 'm1', sender: 'them', text: '¡Hola Kaelen! Qué genial conectar. Me encantaron tus producciones de synthwave.', time: '14:15' },
    { id: 'm2', sender: 'me', text: '¡Gracias Luna! Tu voz cinematográfica quedaría tremenda con unos sintetizadores analógicos.', time: '14:21' },
    { id: 'm3', sender: 'them', text: 'Totalmente. Te pasé unas tomas acapella para que pruebes.', time: '14:28' },
    { id: 'm4', sender: 'me', text: '¡Recibido! Le echo un ojo a las maquetas de sintetizador.', time: '14:31' },
  ],
  'golden-boy': [
    { id: 'g1', sender: 'them', text: 'Bro! Escuché tu último track. Ese 808 suena potentísimo.', time: '13:10' },
    { id: 'g2', sender: 'me', text: '¡Mil gracias! Le bajé un poco al ancho estéreo para limpiar el sub-bass.', time: '13:12' },
    { id: 'g3', sender: 'them', text: 'Perfecto, te pasé los stems con el 808 ajustado.', time: '13:18' },
  ],
  'elena-rostova': [
    { id: 'e1', sender: 'them', text: 'Me encanta esa progresión de acordes. Grabando tomas de voz.', time: 'Ayer' },
  ],
  'marcus-cyber': [
    { id: 'mc1', sender: 'them', text: '¿Tuviste tiempo de escuchar el beat industrial?', time: '10 May' },
  ],
}

// ── Admin Mock Data ──────────────────────────────────────────────────────────

export const mockReports: import('../types').UserReport[] = [
  {
    id: 'REP-101',
    reportedUser: 'Alex Vibe',
    reporterUser: 'Kaelen Voss',
    reason: 'Spam / Mensajes no solicitados',
    details: 'Envía enlaces sospechosos por mensajes privados ofreciendo seguidores falsos.',
    date: '2026-09-29 18:40',
    status: 'Pending',
    severity: 'High',
    origin: 'Discovery',
    targetType: 'Perfil',
  },
  {
    id: 'REP-102',
    reportedUser: 'Circuito Nocturno (Berlin Session)',
    reporterUser: 'CyberPulse',
    reason: 'Derechos de autor / Audio no autorizado en evento',
    details: 'Subió un evento promocionando música que no cuenta con licencias para su emisión.',
    date: '2026-09-28 14:15',
    status: 'Reviewed',
    severity: 'Medium',
    origin: 'Explorer',
    targetType: 'Evento',
  },
  {
    id: 'REP-103',
    reportedUser: 'Mark Studio',
    reporterUser: 'Elena Rostova',
    reason: 'Comportamiento Inapropiado en perfil público',
    details: 'Uso de lenguaje ofensivo en la descripción del perfil y comentarios de proyectos.',
    date: '2026-09-27 09:30',
    status: 'Resolved',
    severity: 'Low',
    origin: 'Discovery',
    targetType: 'Perfil',
    adminComment: 'Se advirtió al usuario sobre las normas comunitarias y modificó los comentarios inapropiados.',
  },
  {
    id: 'REP-104',
    reportedUser: 'Synthwave Night Festival',
    reporterUser: 'Kylian Dictador',
    reason: 'Información Falsa de Ubicación',
    details: 'El evento figura en Buenos Aires pero el organizador cobra entradas para un show virtual cancelado.',
    date: '2026-09-26 21:10',
    status: 'Pending',
    severity: 'High',
    origin: 'Explorer',
    targetType: 'Evento',
  },
  {
    id: 'REP-105',
    reportedUser: 'Mark Studio',
    reporterUser: 'Kaelen Voss',
    reason: 'Derechos de autor / Contenido copiado',
    details: 'Ha publicado como propio un proyecto de sonido registrado por otro usuario.',
    date: '2026-09-25 11:20',
    status: 'Pending',
    severity: 'High',
    origin: 'Discovery',
    targetType: 'Perfil',
  }
]

export const mockActivity: import('../types').UserActivityLog[] = [
  { id: 'ACT-01', user: 'Kaelen Voss', action: 'Inicio de sesión exitoso', timestamp: 'Hace 5 minutos', ip: '192.168.1.45', device: 'Chrome / Windows', module: 'Sistema' },
  { id: 'ACT-02', user: 'Alex Vibe', action: 'Actualizó su foto de perfil y SoundCloud link', timestamp: 'Hace 12 minutos', ip: '185.220.101.4', device: 'Firefox / MacOS', module: 'Perfil' },
  { id: 'ACT-03', user: 'Circuito Nocturno', action: 'Creó nuevo artículo de evento en Explorer', timestamp: 'Hace 30 minutos', ip: '190.45.12.88', device: 'Safari / iOS', module: 'Explorer' },
  { id: 'ACT-04', user: 'Luna Beats', action: 'Modificó biografía e interés de géneros', timestamp: 'Hace 45 minutos', ip: '200.89.44.12', device: 'Chrome / Android', module: 'Perfil' },
  { id: 'ACT-05', user: 'CyberPulse', action: 'Publicó artículo "Synth Lab Sessions" en Explorer', timestamp: 'Hace 2 horas', ip: '181.12.90.11', device: 'Edge / Windows', module: 'Explorer' },
]

export const mockUsers: import('../types').UserProfile[] = [
  {
    id: 'USR-01',
    nickname: 'Kaelen Voss',
    firstName: 'Kaelen',
    lastName: 'Voss',
    email: 'kaelen@linkedsound.app',
    role: 'Productor',
    location: 'Berlin, Germany',
    status: 'Active',
    joinedDate: '2026-01-15',
    reportsCount: 0,
    interestGenres: ['Synthwave', 'Electronic', 'Dark Pop'],
    spotifyUrl: 'https://spotify.com/artist/kaelen',
    instagramUrl: 'https://instagram.com/kaelen',
    soundcloudUrl: 'https://soundcloud.com/kaelen',
    description: 'Building cinematic soundscapes with modular synths.'
  },
  {
    id: 'USR-02',
    nickname: 'Alex Vibe',
    firstName: 'Alex',
    lastName: 'Vibe',
    email: 'alex.vibe@music.io',
    role: 'Artista',
    location: 'Madrid, España',
    status: 'Pending Approval',
    joinedDate: '2026-09-20',
    reportsCount: 1,
    interestGenres: ['Tech House', 'Techno'],
    spotifyUrl: 'https://spotify.com/artist/alexvibe',
    instagramUrl: 'https://instagram.com/alexvibe',
    soundcloudUrl: 'https://soundcloud.com/alexvibe',
    description: 'Tech house & minimal DJ.'
  },
  {
    id: 'USR-03',
    nickname: 'Luna Beats',
    firstName: 'Luna',
    lastName: 'Rios',
    email: 'luna.beats@sound.com',
    role: 'Productor/Artista',
    location: 'Buenos Aires, Argentina',
    status: 'Active',
    joinedDate: '2026-05-10',
    reportsCount: 1,
    interestGenres: ['Ambient', 'Lo-Fi'],
    spotifyUrl: 'https://spotify.com/artist/lunabeats',
    instagramUrl: 'https://instagram.com/lunabeats',
    soundcloudUrl: 'https://soundcloud.com/lunabeats',
    description: 'Chilled beats & atmospheric sounds.'
  },
  {
    id: 'USR-04',
    nickname: 'Mark Studio',
    firstName: 'Mark',
    lastName: 'Taylor',
    email: 'mark@studio.org',
    role: 'Productor',
    location: 'London, UK',
    status: 'Suspended',
    joinedDate: '2026-03-04',
    reportsCount: 2,
    interestGenres: ['Rock', 'Industrial'],
    spotifyUrl: 'https://spotify.com/artist/markstudio',
    instagramUrl: 'https://instagram.com/markstudio',
    soundcloudUrl: 'https://soundcloud.com/markstudio',
    description: 'Audio engineer & mixing master.'
  },
]

export const mockExplorerItems: import('../types').ExplorerItem[] = [
  {
    id: 'EXP-01',
    title: 'Circuito Nocturno Live Session',
    type: 'Evento',
    owner: 'Circuito Nocturno',
    location: 'Berlin, Germany',
    genres: ['Live', 'Techno', 'Experimental'],
    status: 'Active',
    createdDate: '2026-09-25',
    views: 1420,
    description: 'Sesión en vivo de sintetizadores analógicos y techno experimental en club subterráneo.'
  },
  {
    id: 'EXP-02',
    title: 'LunaSol Acoustic Duo',
    type: 'Perfil',
    owner: 'Luna Beats',
    location: 'Buenos Aires, Argentina',
    genres: ['Acoustic', 'Vocal', 'Alt Pop'],
    status: 'Active',
    createdDate: '2026-09-20',
    views: 890,
    description: 'Proyecto duo de música acústica con paisajes sonoros de lo-fi.'
  },
  {
    id: 'EXP-03',
    title: 'Synthwave Night Showcase',
    type: 'Evento',
    owner: 'Golden Boy',
    location: 'Entre Ríos, Argentina',
    genres: ['Synthwave', 'HardTrap'],
    status: 'Under Review',
    createdDate: '2026-09-18',
    views: 350,
    description: 'Encuentro nacional de productores de synthwave y sintetizadores vintage.'
  },
  {
    id: 'EXP-04',
    title: 'Industrial Noise Workshop',
    type: 'Evento',
    owner: 'Mark Studio',
    location: 'London, UK',
    genres: ['Industrial', 'Noise'],
    status: 'Hidden',
    createdDate: '2026-09-10',
    views: 120,
    description: 'Taller de producción e ingeniería de sonido industrial pesado.'
  }
]

export const userNotifications: import('../types').NotificationItem[] = [
  {
    id: 'notif-1',
    title: '¡Nuevo Match Musical! 🎵',
    message: 'Has conectado con Luna Sol. Puedes enviarle un mensaje para iniciar una colaboración.',
    timestamp: 'Hace 10 min',
    read: false,
    type: 'match',
    linkPage: 'Messages',
  },
  {
    id: 'notif-2',
    title: 'Nuevo mensaje recibido 💬',
    message: 'Metro Boomin: "I can get your mix ready by Friday."',
    timestamp: 'Hace 25 min',
    read: false,
    type: 'message',
    linkPage: 'Messages',
  },
  {
    id: 'notif-3',
    title: 'Bienvenido a LinkedSound ✨',
    message: 'Tu perfil ha sido verificado con éxito. Comienza a descubrir productores cerca de ti.',
    timestamp: 'Hace 2 horas',
    read: true,
    type: 'system',
    linkPage: 'Profile',
  },
]

export const adminNotifications: import('../types').NotificationItem[] = [
  {
    id: 'adm-notif-1',
    title: '⚠️ Nuevo reporte pendiente',
    message: 'Kaelen Voss reportó a Alex Vibe por "Spam / Mensajes no solicitados".',
    timestamp: 'Hace 5 min',
    read: false,
    type: 'report',
    linkPage: 'Admin',
  },
  {
    id: 'adm-notif-2',
    title: '⚠️ Reporte de derechos de autor',
    message: 'Se ha registrado un reporte de severidad Alta sobre Synthwave Night Festival.',
    timestamp: 'Hace 40 min',
    read: false,
    type: 'report',
    linkPage: 'Admin',
  },
  {
    id: 'adm-notif-3',
    title: '🛡️ Estado del Sistema',
    message: 'El sistema de moderación automática revisó 12 publicaciones recientes sin infracciones.',
    timestamp: 'Hace 3 horas',
    read: true,
    type: 'system',
    linkPage: 'Admin',
  },
]

