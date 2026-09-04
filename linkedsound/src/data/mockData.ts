import type { AppPage } from '../types'

export type NavItem = {
  label: AppPage
  active?: boolean
}

export type FilterOption = {
  label: string
  checked?: boolean
}

export type ProfileCard = {
  name: string
  role: string
  location: string
  tags: string[]
  image: string
  match: string
  description: string
  badge: string
}

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

export const recentMatches = [
  { name: 'Nomi', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?...' },
  { name: 'Soren', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?...' },
  { name: 'Kira M.', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?...' },
  { name: 'Inbox', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?...' },
]

export const recommendations: ProfileCard[] = [
  {
    name: 'Alex Vance',
    role: 'Modular hardware specialist',
    location: 'Los Angeles, CA',
    tags: ['ModularSynth', 'Live', 'Drone'],
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    match: '98%',
    description: 'Analog textures and harsh synth design.',
    badge: 'Producer',
  },
  {
    name: 'Luna Sol',
    role: 'Synth-pop vocalist',
    location: 'New York, NY',
    tags: ['Vocal', 'Alt Pop', 'Analog'],
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    match: '96%',
    description: 'Warm vocals with cinematic melodic hooks.',
    badge: 'Vocalist',
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
