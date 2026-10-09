import { useState } from 'react'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ConversationSidebar from '../components/ConversationSidebar'
import ChatThread from '../components/ChatThread'
import UnmatchModal from '../components/UnmatchModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import {
  conversations as initialConversations,
  messagesByConversation as initialMessages,
  exploreCards,
  recommendations,
  mockUsers,
  type Message,
  type Conversation,
  type ProfileCard,
} from '../data/mockData'
import type { AppPage, Profile, NotificationItem } from '../types'

type MessagesPageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile: Profile
  isAdminSession?: boolean
  notifications?: NotificationItem[]
  onMarkNotificationAsRead?: (id: string) => void
  onMarkAllNotificationsAsRead?: () => void
  onClearNotifications?: () => void
  onSignOut?: () => void
  conversationsList?: Conversation[]
  setConversationsList?: React.Dispatch<React.SetStateAction<Conversation[]>>
  messagesMap?: Record<string, Message[]>
  setMessagesMap?: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>
  activeId?: string
  setActiveId?: (id: string) => void
}

export default function MessagesPage({
  activePage,
  onNavigate,
  profile,
  isAdminSession,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearNotifications,
  onSignOut,
  conversationsList: propConversationsList,
  setConversationsList: propSetConversationsList,
  messagesMap: propMessagesMap,
  setMessagesMap: propSetMessagesMap,
  activeId: propActiveId,
  setActiveId: propSetActiveId,
}: MessagesPageProps) {
  const [localConversationsList, setLocalConversationsList] = useState<Conversation[]>(initialConversations)
  const [localMessagesMap, setLocalMessagesMap] = useState<Record<string, Message[]>>(initialMessages)
  const [localActiveId, setLocalActiveId] = useState('luna-sol')

  const conversationsList = propConversationsList ?? localConversationsList
  const setConversationsList = propSetConversationsList ?? setLocalConversationsList

  const messagesMap = propMessagesMap ?? localMessagesMap
  const setMessagesMap = propSetMessagesMap ?? setLocalMessagesMap

  const activeId = propActiveId ?? localActiveId
  const setActiveId = propSetActiveId ?? setLocalActiveId

  const [unmatchingTarget, setUnmatchingTarget] = useState<Conversation | null>(null)
  const [inspectedProfileCard, setInspectedProfileCard] = useState<ProfileCard | null>(null)

  const activeConversation =
    conversationsList.find((item) => item.id === activeId) ?? conversationsList[0]

  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    // Mark unread as 0 when opened
    setConversationsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    )
  }

  const handleInspectProfile = () => {
    if (!activeConversation) return
    const targetName = activeConversation.name.toLowerCase().trim()
    const foundCard =
      exploreCards.find((c) => c.nickname?.toLowerCase().trim() === targetName) ??
      recommendations.find((c) => c.nickname?.toLowerCase().trim() === targetName) ??
      mockUsers.find((c) => c.nickname?.toLowerCase().trim() === targetName)

    if (foundCard) {
      setInspectedProfileCard(foundCard)
    } else {
      const nameParts = activeConversation.name.trim().split(' ')
      const firstName = nameParts[0] || activeConversation.name
      const lastName = nameParts.slice(1).join(' ') || 'Artista'
      const cleanHandle = activeConversation.name.toLowerCase().replace(/\s+/g, '')

      setInspectedProfileCard({
        firstName,
        lastName,
        nickname: activeConversation.name,
        role: activeConversation.role || 'Productor/Artista',
        location: activeConversation.location || 'LinkedSound HQ',
        profileImage: activeConversation.profileImage || 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
        isProfile: true,
        itemRole: 'Perfil',
        description: `Perfil oficial de ${activeConversation.name} en LinkedSound. Creador y colaborador de la comunidad musical.`,
        match: '94%',
        badge: 'Creador',
        interestGenres: ['Electronic', 'Synthwave', 'Ambient'],
        tags: ['Electronic', 'Synthwave'],
        soundcloudUrl: `https://soundcloud.com/${cleanHandle}`,
        spotifyUrl: `https://open.spotify.com/artist/${cleanHandle}`,
        instagramUrl: `https://instagram.com/${cleanHandle}`,
        soundcloudHandle: cleanHandle,
        tracks: [
          {
            id: 'tr-msg-1',
            title: `${activeConversation.name} - Official Single`,
            plays: '15.4k',
            duration: '3:45',
            genre: 'Electronic',
            soundcloudLink: `https://soundcloud.com/${cleanHandle}`,
          },
        ],
      })
    }
  }

  const handleConfirmUnmatch = () => {
    if (!unmatchingTarget) return
    const targetId = unmatchingTarget.id

    setConversationsList((prev) => {
      const updated = prev.filter((c) => c.id !== targetId)
      if (activeId === targetId && updated.length > 0) {
        setActiveId(updated[0].id)
      }
      return updated
    })

    setMessagesMap((prev) => {
      const copy = { ...prev }
      delete copy[targetId]
      return copy
    })
  }

  const handleSendMessage = (text: string, attachment?: Message['attachment']) => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newMessage: Message = {
      id: String(Date.now()),
      sender: 'me',
      text,
      time: timeStr,
      attachment,
    }

    const previewText = text || (attachment ? `📎 ${attachment.name}` : '')

    setMessagesMap((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), newMessage],
    }))

    // Update conversation preview and time in sidebar
    setConversationsList((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, preview: previewText, time: timeStr, unread: 0 }
          : c
      )
    )

    // Optional simulated reply after 1.2s
    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const replies = [
        '¡Recibido! Le echo un ojo ahora mismo y te aviso.',
        'Suena potente esa idea. Ajusto el máster y te paso el nuevo bounce.',
        'Totalmente de acuerdo, vamos a fijar esa sesión para esta semana.',
      ]
      const randomReply = replies[Math.floor(Math.random() * replies.length)]

      const simulatedReply: Message = {
        id: String(Date.now() + 1),
        sender: 'them',
        text: randomReply,
        time: replyTime,
      }

      setMessagesMap((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] ?? []), simulatedReply],
      }))

      setConversationsList((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, preview: randomReply, time: replyTime }
            : c
        )
      )
    }, 1200)
  }

  const handleClearChat = (id?: string) => {
    const targetId = id ?? activeId
    if (!targetId) return
    setMessagesMap((prev) => ({ ...prev, [targetId]: [] }))
    setConversationsList((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, preview: '[Chat vaciado]', unread: 0 } : c))
    )
  }

  const handleToggleMute = (id?: string) => {
    const targetId = id ?? activeId
    if (!targetId) return
    setConversationsList((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, muted: !c.muted } : c))
    )
  }

  const handleTogglePin = (id?: string) => {
    const targetId = id ?? activeId
    if (!targetId) return
    setConversationsList((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, pinned: !c.pinned } : c))
    )
  }

  const handleToggleBlock = (id?: string) => {
    const targetId = id ?? activeId
    if (!targetId) return
    setConversationsList((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, blocked: !c.blocked } : c))
    )
  }

  return (
    <div className="ls-app-shell ls-messages-shell">
      <TopBar
        activePage={activePage}
        onNavigate={onNavigate}
        profile={profile}
        isAdminSession={isAdminSession}
        notifications={notifications}
        onMarkNotificationAsRead={onMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
        onClearNotifications={onClearNotifications}
        onSignOut={onSignOut}
      />

      <div className="ls-messages-layout">
        <ConversationSidebar
          conversations={conversationsList}
          activeId={activeId}
          onSelect={handleSelectConversation}
          messagesMap={messagesMap}
          onTogglePin={handleTogglePin}
          onToggleMute={handleToggleMute}
          onClearChat={handleClearChat}
          onToggleBlock={handleToggleBlock}
          onUnmatch={(conv) => setUnmatchingTarget(conv)}
        />

        {activeConversation ? (
          <ChatThread
            conversation={activeConversation}
            messages={messagesMap[activeConversation.id] ?? []}
            onSendMessage={handleSendMessage}
            onUnmatch={() => setUnmatchingTarget(activeConversation)}
            onClearChat={handleClearChat}
            onToggleMute={handleToggleMute}
            onTogglePin={handleTogglePin}
            onToggleBlock={handleToggleBlock}
            onInspectProfile={handleInspectProfile}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            No tienes matches o conversaciones activas.
          </div>
        )}
      </div>

      <UnmatchModal
        isOpen={Boolean(unmatchingTarget)}
        targetName={unmatchingTarget?.name ?? ''}
        onClose={() => setUnmatchingTarget(null)}
        onConfirmUnmatch={handleConfirmUnmatch}
      />

      <SoundCloudPreviewModal
        isOpen={Boolean(inspectedProfileCard)}
        card={inspectedProfileCard}
        onClose={() => setInspectedProfileCard(null)}
      />

      <Footer />
    </div>
  )
}
