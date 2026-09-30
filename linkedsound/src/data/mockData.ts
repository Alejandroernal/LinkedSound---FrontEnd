import type { AppPage, UserProfile, SoundCloudTrack } from '../types'

export type { SoundCloudTrack }

export type NavItem = {
  label: AppPage
  active?: boolean
}

export type FilterOption = {
  label: string
  checked?: boolean
}

export type ProfileCard = UserProfile


export type Conversation = {
  id: string
  name: string
  role: string
  avatar: string
  accent: 'purple' | 'pink' | 'cyan' | 'gold'
  status: string
  type: string
  preview: string
  time: string
  unread: number
}

export type Message = {
  id: string
  sender: 'me' | 'them'
  text: string
  time: string
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
  descript: 'Building cinematic soundscapes with modular synths, analog drums, and hybrid live vocals.',
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
    nickname: 'Kylian Dictador',
    role: 'Productor/Artista',
    location: 'Francia, paris',
    interestGenres: ['ModularSynth', 'Live', 'Drone'],
    soundcloudUrl: 'https://soundcloud.com/jesus-922347355',
    spotifyUrl: 'https://open.spotify.com/artist/kylian',
    instagramUrl: 'https://instagram.com/kyliandictador',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRk3D-J2lE2LLanWoFeEkrMec5OB_tRjxzqgg_Y9w7iNXOUAjPCWDTrICZ8&s=10',
    match: '22%',
    bio: 'Analog textures and harsh synth design.',
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
    nickname: 'Luna Sol',
    role: 'Artista',
    location: 'New York, NY',
    interestGenres: ['Vocal', 'Alt Pop', 'Analog'],
    soundcloudUrl: 'https://soundcloud.com/lunasol_official',
    spotifyUrl: 'https://open.spotify.com/artist/lunasol',
    instagramUrl: 'https://instagram.com/lunasol',
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    match: '96%',
    bio: 'Warm vocals with cinematic melodic hooks.',
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
    nickname: 'Golden Boy',
    role: 'Productor/Artista',
    location: 'Entre Rios, Argentina',
    interestGenres: ['HardTrap', 'Producer', 'Artist'],
    soundcloudUrl: 'https://soundcloud.com/goldennnnnnnnnnnnnnn',
    spotifyUrl: 'https://open.spotify.com/artist/goldenboy',
    instagramUrl: 'https://instagram.com/goldenboy',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-sWJbrWmlA-PfqSy_6YhFu-bsy0Lz8zK8Vy-p36sVb6kM3qgCeWhDIUNI&s=10',
    match: '100%',
    bio: 'HardTrap Specialist, Producer, Artist.',
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
    nickname: 'Elena Rostova',
    role: 'Artista',
    location: 'Berlin, Germany',
    interestGenres: ['Darkwave', 'Synthwave', 'Vocal'],
    soundcloudUrl: 'https://soundcloud.com/elena-rostova',
    spotifyUrl: 'https://open.spotify.com/artist/elenarostova',
    instagramUrl: 'https://instagram.com/elenarostova',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    match: '91%',
    bio: 'Ethereal Gothic vocals layered over heavy retro-futuristic basslines.',
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
    nickname: 'Marcus Cyber',
    role: 'Productor',
    location: 'Tokyo, Japan',
    interestGenres: ['Cyberpunk', 'Industrial', 'EBM'],
    soundcloudUrl: 'https://soundcloud.com/marcus-cyber',
    spotifyUrl: 'https://open.spotify.com/artist/marcuscyber',
    instagramUrl: 'https://instagram.com/marcuscyber',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
    match: '88%',
    bio: 'Futuristic Cyberpunk beats and distorted industrial basslines.',
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
    nickname: 'Mateo Sound',
    role: 'Productor',
    location: 'Buenos Aires, Argentina',
    interestGenres: ['Tech House', 'Electronic', 'Minimal'],
    soundcloudUrl: 'https://soundcloud.com/mateosound',
    spotifyUrl: 'https://open.spotify.com/artist/mateosound',
    instagramUrl: 'https://instagram.com/mateosound',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    match: '84%',
    bio: 'Groovy underground minimal & tech house producer based in BA.',
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
    nickname: 'Aria Vibe',
    role: 'Artista',
    location: 'London, UK',
    interestGenres: ['Ambient', 'Lo-Fi', 'Vocal'],
    soundcloudUrl: 'https://soundcloud.com/ariavibe',
    spotifyUrl: 'https://open.spotify.com/artist/ariavibe',
    instagramUrl: 'https://instagram.com/ariavibe',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    match: '79%',
    bio: 'Atmospheric ambient textures and dream-pop vocal loops.',
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
  }
]

export const exploreCards: ProfileCard[] = [
  {
    nickname: 'Circuito Nocturno',
    role: 'Berlin live session',
    location: 'Berlin, Germany',
    interestGenres: ['Live', 'Techno', 'Cinematic', 'Experimental'],
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    match: '96%',
    bio: 'A dark, rhythmic fusion of techno textures and gritty vocal layers.',
    badge: 'Featured',
    itemRole: 'Evento',
    isProfile: false,

    // Atributos específicos de Evento (Campos de Perfil son undefined / null)
    eventDate: '2026-10-15',
    eventTime: '23:00',
    venue: 'Watergate Club Berlin',
    ticketUrl: 'https://ra.co/events/berlin-circuito-nocturno',
    isFinished: false,

    // Atributos de Perfil (nulos en eventos)
    soundcloudUrl: '',
    spotifyUrl: '',
    instagramUrl: '',
    tracks: undefined,
  },
  {
    nickname: 'Kylian Dictador',
    role: 'Productor/Artista',
    location: 'Francia, paris',
    interestGenres: ['ModularSynth', 'Live', 'Drone'],
    soundcloudUrl: 'https://soundcloud.com/jesus-922347355',
    spotifyUrl: 'https://open.spotify.com/artist/kylian',
    instagramUrl: 'https://instagram.com/kyliandictador',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRk3D-J2lE2LLanWoFeEkrMec5OB_tRjxzqgg_Y9w7iNXOUAjPCWDTrICZ8&s=10',
    match: '22%',
    bio: 'Analog textures and harsh synth design.',
    badge: 'Producer',
    itemRole: 'Perfil',
    isProfile: true,
    soundcloudHandle: 'jesus-922347355',

    // Atributos de Evento (nulos en perfiles)
    eventDate: undefined,
    eventTime: undefined,
    venue: undefined,
    ticketUrl: undefined,
    isFinished: undefined,

    tracks: [
      {
        id: 'kd0_exp',
        title: 'pink_mew_laughing_d...',
        plays: '249',
        duration: '0:42',
        genre: 'Último tema subido',
        soundcloudLink: 'https://soundcloud.com/jesus-922347355',
      },
      {
        id: 'kd1_exp',
        title: 'KYLIAN MBAPPE #808',
        plays: '24.5k',
        duration: '6:20',
        genre: 'Eurorack',
        soundcloudLink: 'https://soundcloud.com/jesus-922347355/kylian-mbappe-dictador-anthem?si=19e7123b5b73411cb1db73c20ee79e73&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing',
      },
    ],
  },
  {
    nickname: 'Luna Sol',
    role: 'Artista',
    location: 'New York, NY',
    interestGenres: ['Vocal', 'Alt Pop', 'Analog'],
    soundcloudUrl: 'https://soundcloud.com/lunasol_official',
    spotifyUrl: 'https://open.spotify.com/artist/lunasol',
    instagramUrl: 'https://instagram.com/lunasol',
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    match: '96%',
    bio: 'Warm vocals with cinematic melodic hooks.',
    badge: 'Artist',
    itemRole: 'Perfil',
    isProfile: true,
    soundcloudHandle: 'lunasol_official',

    // Atributos de Evento
    eventDate: undefined,
    eventTime: undefined,
    venue: undefined,
    ticketUrl: undefined,

    tracks: [
      {
        id: 'ls1_exp',
        title: 'Cinematic Melodies (Acapella Stems)',
        plays: '52.8k',
        duration: '3:30',
        genre: 'Vocal',
        soundcloudLink: 'https://soundcloud.com/search?q=lunasol',
      },
      {
        id: 'ls2_exp',
        title: 'Hypnotic Tape Delays (R&B Edit)',
        plays: '31.4k',
        duration: '4:05',
        genre: 'Alt Pop',
        soundcloudLink: 'https://soundcloud.com/search?q=lunasol',
      },
    ],
  },
  {
    nickname: 'Golden Boy',
    role: 'Productor/Artista',
    location: 'Entre Rios, Argentina',
    interestGenres: ['HardTrap', 'Producer', 'Artist'],
    soundcloudUrl: 'https://soundcloud.com/goldennnnnnnnnnnnnnn',
    spotifyUrl: 'https://open.spotify.com/artist/goldenboy',
    instagramUrl: 'https://instagram.com/goldenboy',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-sWJbrWmlA-PfqSy_6YhFu-bsy0Lz8zK8Vy-p36sVb6kM3qgCeWhDIUNI&s=10',
    match: '100%',
    bio: 'HardTrap Specialist, Producer, Artist.',
    badge: 'Producer',
    itemRole: 'Perfil',
    isProfile: true,
    soundcloudHandle: 'goldennnnnnnnnnnnnnn',

    tracks: [
      {
        id: 'gb0_exp',
        title: 'Step back - !Deoro',
        plays: '158',
        duration: '2:22',
        genre: 'HardTrap',
        soundcloudLink: 'https://soundcloud.com/goldennnnnnnnnnnnnnn',
      },
      {
        id: 'gb1_exp',
        title: '0ffl1n3 - !Deoro',
        plays: '156',
        duration: '2:43',
        genre: 'HardTrap',
        soundcloudLink: 'https://soundcloud.com/goldennnnnnnnnnnnnnn/4nd0-0ffl1n3-deoro?si=e618d823716e4d25a3bb80ea3f627bfd&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing',
      },
    ],
  },
  {
    nickname: 'Elena Rostova',
    role: 'Artista',
    location: 'Berlin, Germany',
    interestGenres: ['Darkwave', 'Synthwave', 'Vocal'],
    soundcloudUrl: 'https://soundcloud.com/elena-rostova',
    spotifyUrl: 'https://open.spotify.com/artist/elenarostova',
    instagramUrl: 'https://instagram.com/elenarostova',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    match: '91%',
    bio: 'Ethereal Gothic vocals layered over heavy retro-futuristic basslines.',
    badge: 'Artist',
    itemRole: 'Perfil',
    isProfile: true,
    soundcloudHandle: 'elena-rostova',
  },
  {
    nickname: 'Marcus Cyber',
    role: 'Productor',
    location: 'Tokyo, Japan',
    interestGenres: ['Cyberpunk', 'Industrial', 'EBM'],
    soundcloudUrl: 'https://soundcloud.com/marcus-cyber',
    spotifyUrl: 'https://open.spotify.com/artist/marcuscyber',
    instagramUrl: 'https://instagram.com/marcuscyber',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
    match: '88%',
    bio: 'Futuristic Cyberpunk beats and distorted industrial basslines.',
    badge: 'Producer',
    itemRole: 'Perfil',
    isProfile: true,
    soundcloudHandle: 'marcus-cyber',
  },
  {
    nickname: 'Cyberpunk Sound Expo 2026',
    role: 'Festival & Workshop',
    location: 'Tokyo, Japan',
    interestGenres: ['Cyberpunk', 'Industrial', 'Synthwave'],
    image:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
    match: '92%',
    bio: 'Un encuentro masivo de música electrónica industrial, sintetizadores analógicos e instalaciones audiovisuales.',
    badge: 'Evento',
    itemRole: 'Evento',
    isProfile: false,

    // Atributos de Evento Activo
    eventDate: '2026-11-20',
    eventTime: '18:00',
    venue: 'AGEHA Tokyo Dome Arena',
    ticketUrl: 'https://eventbrite.com/e/cyberpunk-sound-expo-2026',
    isFinished: false,

    soundcloudUrl: '',
    spotifyUrl: '',
    instagramUrl: '',
  },
  {
    nickname: 'Buenos Aires Underground Jam',
    role: 'Jam Session Live',
    location: 'Buenos Aires, Argentina',
    interestGenres: ['Tech House', 'Minimal', 'Electronic'],
    image:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
    match: '85%',
    bio: 'Jam libre para productores y DJs locales de minimal y tech house en Palermo.',
    badge: 'Evento',
    itemRole: 'Evento',
    isProfile: false,

    // Atributos de Evento Expirado / Finalizado (Fecha pasada en 2026)
    eventDate: '2026-09-15',
    eventTime: '22:00',
    venue: 'Niceto Club Palermo',
    ticketUrl: 'https://passline.com/eventos/buenos-aires-underground-jam',
    isFinished: true,

    soundcloudUrl: '',
    spotifyUrl: '',
    instagramUrl: '',
  },
  {
    nickname: 'Aria Vibe',
    role: 'Artista',
    location: 'London, UK',
    interestGenres: ['Ambient', 'Lo-Fi', 'Vocal'],
    soundcloudUrl: 'https://soundcloud.com/ariavibe',
    spotifyUrl: 'https://open.spotify.com/artist/ariavibe',
    instagramUrl: 'https://instagram.com/ariavibe',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    match: '79%',
    bio: 'Atmospheric ambient textures and dream-pop vocal loops.',
    badge: 'Artist',
    itemRole: 'Perfil',
    isProfile: true,
    soundcloudHandle: 'ariavibe',
  }
]

export const conversations: Conversation[] = [
  {
    id: 'metro-boomin',
    name: 'Metro Boomin',
    role: 'Producer',
    avatar: 'M',
    accent: 'purple',
    status: 'Online',
    type: 'Direct',
    preview: 'I can get your mix ready by Friday.',
    time: '14:32',
    unread: 2,
  },
  {
    id: 'techno-collective',
    name: 'Techno Collective',
    role: 'Group',
    avatar: 'T',
    accent: 'cyan',
    status: '2 online',
    type: 'Group',
    preview: 'Alex shared a beat for the Berlin EP.',
    time: '13:18',
    unread: 0,
  },
  {
    id: 'midnight-band',
    name: 'The Midnight Band',
    role: 'Band',
    avatar: 'B',
    accent: 'pink',
    status: 'Rehearsal',
    type: 'Band',
    preview: 'Let’s check the stems for track 3.',
    time: 'Yesterday',
    unread: 1,
  },
  {
    id: 'fka-twigs',
    name: 'FKA Twigs',
    role: 'Artist',
    avatar: 'F',
    accent: 'gold',
    status: 'Inbox',
    type: 'Direct',
    preview: 'Need a vocal pass for the chorus.',
    time: 'May 10',
    unread: 0,
  },
]

export const messagesByConversation: Record<string, Message[]> = {
  'metro-boomin': [
    { id: 'm1', sender: 'them', text: 'Yo Kaelen! I tweaked the 808 distortion in the second verse like we talked about on yesterday’s call.', time: '14:15' },
    { id: 'm2', sender: 'me', text: 'Massive! Did you keep the pitch glide at bar 36 or bounce it? I want to make sure the sidechain ducking on the lead synth doesn’t get masked.', time: '14:21' },
    { id: 'm3', sender: 'them', text: 'I kept the glide but reduced the stereo width a little in bar 42. The low-end feels more clean.', time: '14:28' },
    { id: 'm4', sender: 'me', text: 'Perfect. Send the updated stems and I’ll match the final master against the reference.', time: '14:31' },
  ],
  'techno-collective': [
    { id: 't1', sender: 'them', text: 'The new kick pattern is ready for review.', time: '13:10' },
    { id: 't2', sender: 'me', text: 'Nice. I’ll check it tonight.', time: '13:12' },
  ],
  'midnight-band': [
    { id: 'b1', sender: 'them', text: 'Let’s plan the vocal stack for the bridge.', time: 'Yesterday' },
  ],
  'fka-twigs': [
    { id: 'f1', sender: 'them', text: 'Could you share a rough vocal pass?', time: 'May 10' },
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
    bio: 'Building cinematic soundscapes with modular synths.'
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
    bio: 'Tech house & minimal DJ.'
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
    bio: 'Chilled beats & atmospheric sounds.'
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
    bio: 'Audio engineer & mixing master.'
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
