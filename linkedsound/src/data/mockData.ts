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
        id: 'kd0_rec',
        title: 'Step back - !Deoro',
        plays: '158',
        duration: '2:22',
        genre: 'HardTrap',
        soundcloudLink: 'https://soundcloud.com/goldennnnnnnnnnnnnnn',
      },
      {
        id: 'kd1_rec',
        title: '0ffl1n3 - !Deoro',
        plays: '156',
        duration: '2:43',
        genre: 'HardTrap',
        soundcloudLink: 'https://soundcloud.com/goldennnnnnnnnnnnnnn/4nd0-0ffl1n3-deoro?si=e618d823716e4d25a3bb80ea3f627bfd&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing',
      },
    ],
  },
]

export const exploreCards: ProfileCard[] = [
  {
    nickname: 'Circuito Nocturno',
    role: 'Berlin live session',
    location: 'Berlin, Germany',
    interestGenres: ['Live', 'Techno', 'Cinematic', 'Experimental'],
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    // Required social media URLs (empty for now)
    soundcloudUrl: '',
    spotifyUrl: '',
    instagramUrl: '',
    match: '96%',
    bio: 'A dark, rhythmic fusion of techno textures and gritty vocal layers.',
    badge: 'Featured',
    itemRole: 'Evento',
    isProfile: false, // Event / Jam session, no SoundCloud profile linked
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
