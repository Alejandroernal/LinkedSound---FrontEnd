import { useState } from 'react'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ConversationSidebar from '../components/ConversationSidebar'
import ChatThread from '../components/ChatThread'
import UnmatchModal from '../components/UnmatchModal'
import SpamReportModal from '../components/SpamReportModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import {
  conversations as initialConversations,
  messagesByConversation as initialMessages,
  initialNewMatches,
  exploreCards,
  recommendations,
  mockUsers,
  type Message,
  type Conversation,
  type ProfileCard,
  type NewMatchItem,
} from '../data/mockData'
import type { AppPage, Profile, NotificationItem } from '../types'
import {
  PiSparkleFill,
  PiChatCircleDotsBold,
  PiPaperPlaneRightFill,
  PiWarningCircleBold,
} from 'react-icons/pi'

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
  const [localActiveId, setLocalActiveId] = useState('')

  const [newMatchesList, setNewMatchesList] = useState<NewMatchItem[]>(initialNewMatches)
  const [selectedNewMatchId, setSelectedNewMatchId] = useState<string | null>(null)
  const [spamReportingMatch, setSpamReportingMatch] = useState<NewMatchItem | null>(null)
  const [firstMessageText, setFirstMessageText] = useState('')

  const conversationsList = propConversationsList ?? localConversationsList
  const setConversationsList = propSetConversationsList ?? setLocalConversationsList

  const messagesMap = propMessagesMap ?? localMessagesMap
  const setMessagesMap = propSetMessagesMap ?? setLocalMessagesMap

  const activeId = propActiveId ?? localActiveId
  const setActiveId = propSetActiveId ?? setLocalActiveId

  const [unmatchingTarget, setUnmatchingTarget] = useState<Conversation | null>(null)
  const [inspectedProfileCard, setInspectedProfileCard] = useState<ProfileCard | null>(null)

  const activeConversation = conversationsList.find((item) => item.id === activeId) ?? null
  const selectedNewMatch = newMatchesList.find((m) => m.id === selectedNewMatchId) ?? null

  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    setSelectedNewMatchId(null)
    setConversationsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    )
  }

  const handleSelectNewMatch = (id: string) => {
    setSelectedNewMatchId(id)
    setActiveId('')
    setFirstMessageText('')
  }

  const handleSendFirstMessage = (match: NewMatchItem) => {
    if (!firstMessageText.trim()) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const newConv: Conversation = {
      id: match.id,
      name: match.name,
      role: match.role,
      avatar: match.name.substring(0, 2).toUpperCase(),
      accent: match.accent,
      status: 'Online',
      preview: firstMessageText.trim(),
      time: timeStr,
      unread: 0,
      profileImage: match.profileImage,
      location: match.location,
    }

    const initialMsg: Message = {
      id: String(Date.now()),
      sender: 'me',
      text: firstMessageText.trim(),
      time: timeStr,
    }

    setConversationsList((prev) => [newConv, ...prev])
    setMessagesMap((prev) => ({
      ...prev,
      [match.id]: [initialMsg],
    }))
    setNewMatchesList((prev) => prev.filter((m) => m.id !== match.id))
    setSelectedNewMatchId(null)
    setFirstMessageText('')
    handleSelectConversation(match.id)
  }

  const handleConfirmReportSpam = () => {
    if (!spamReportingMatch) return
    const matchId = spamReportingMatch.id
    setNewMatchesList((prev) => prev.filter((m) => m.id !== matchId))
    if (selectedNewMatchId === matchId) {
      setSelectedNewMatchId(null)
    }
    setSpamReportingMatch(null)
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

      const fallbackCard: ProfileCard = {
        firstName,
        lastName,
        nickname: activeConversation.name,
        role: activeConversation.role || 'Productor y Artista',
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
      }

      setInspectedProfileCard(fallbackCard)
    }
  }

  const handleConfirmUnmatch = () => {
    if (!unmatchingTarget) return
    const targetId = unmatchingTarget.id

    setConversationsList((prev) => {
      const updated = prev.filter((c) => c.id !== targetId)
      if (activeId === targetId) {
        setActiveId('')
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
    if (!activeId) return
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

    setConversationsList((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, preview: previewText, time: timeStr, unread: 0 }
          : c
      )
    )

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

  const unreadMessagesCount = conversationsList.reduce((acc, c) => acc + (c.unread || 0), 0)

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
        unreadMessagesCount={unreadMessagesCount}
      />

      <div className="ls-messages-layout">
        <ConversationSidebar
          conversations={conversationsList}
          newMatches={newMatchesList}
          activeId={activeId}
          selectedMatchId={selectedNewMatchId}
          onSelectConversation={handleSelectConversation}
          onSelectNewMatch={handleSelectNewMatch}
          messagesMap={messagesMap}
          onTogglePin={handleTogglePin}
          onToggleMute={handleToggleMute}
          onClearChat={handleClearChat}
          onToggleBlock={handleToggleBlock}
          onUnmatch={(conv) => setUnmatchingTarget(conv)}
        />

        {selectedNewMatch ? (
          <div className="ls-chat-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div className={`ls-avatar ${selectedNewMatch.accent}`} style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden' }}>
                <img src={selectedNewMatch.profileImage} alt={selectedNewMatch.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>{selectedNewMatch.name}</h2>
                  <span style={{ padding: '3px 8px', borderRadius: '999px', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#f472b6', fontSize: '0.75rem', fontWeight: 600 }}>
                    {selectedNewMatch.match} Match
                  </span>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>{selectedNewMatch.role} • {selectedNewMatch.location}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 8px', color: '#c084fc', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Acerca de este Match</h4>
              <p style={{ margin: '0 0 12px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5', fontSize: '0.92rem' }}>{selectedNewMatch.bio}</p>
              {selectedNewMatch.genres && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedNewMatch.genres.map((g) => (
                    <span key={g} style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)', color: '#d8b4fe', fontSize: '0.75rem' }}>
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(124, 58, 237, 0.04))', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '16px', padding: '20px', marginBottom: 'auto' }}>
              <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PiPaperPlaneRightFill style={{ color: '#a855f7' }} /> Enviar primer mensaje a {selectedNewMatch.name}
              </h4>
              <p style={{ margin: '0 0 14px', color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.86rem' }}>
                Al enviar un mensaje, este match se trasladará automáticamente a tu sección de chats activos.
              </p>

              <textarea
                rows={3}
                placeholder={`¡Hola ${selectedNewMatch.name}! Me gustaría colaborar en...`}
                value={firstMessageText}
                onChange={(e) => setFirstMessageText(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#fff',
                  padding: '12px',
                  fontSize: '0.92rem',
                  outline: 'none',
                  resize: 'none',
                  marginBottom: '14px',
                }}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="ls-danger-button"
                  onClick={() => setSpamReportingMatch(selectedNewMatch)}
                  style={{ fontSize: '0.88rem', padding: '10px 16px' }}
                >
                  <PiWarningCircleBold style={{ marginRight: '6px' }} /> Reportar como Spam
                </button>
                <button
                  type="button"
                  className="ls-primary-button"
                  onClick={() => handleSendFirstMessage(selectedNewMatch)}
                  disabled={!firstMessageText.trim()}
                  style={{ opacity: firstMessageText.trim() ? 1 : 0.5, fontSize: '0.88rem', padding: '10px 20px' }}
                >
                  Enviar mensaje
                </button>
              </div>
            </div>
          </div>
        ) : activeConversation ? (
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
          <div className="ls-chat-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(124, 58, 237, 0.1))', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'grid', placeItems: 'center', color: '#c084fc', marginBottom: '20px' }}>
              <PiChatCircleDotsBold style={{ fontSize: '2.4rem' }} />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.4rem', color: '#fff' }}>Centro de Mensajes</h2>
            <p style={{ margin: '0 0 28px', maxWidth: '420px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: '1.6', fontSize: '0.94rem' }}>
              Selecciona un chat activo de la barra lateral o explora tus nuevos matches para iniciar una conversación directa.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', width: '100%', maxWidth: '520px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px', textAlign: 'left' }}>
                <span style={{ color: '#ec4899', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <PiSparkleFill /> Nuevos Matches
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.5rem', color: '#fff' }}>{newMatchesList.length}</h3>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.78rem' }}>Sin conversación previa</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px', textAlign: 'left' }}>
                <span style={{ color: '#a855f7', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mensajes Nuevos</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.5rem', color: '#fff' }}>{conversationsList.filter(c => c.unread > 0).length}</h3>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.78rem' }}>Sin leer</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <UnmatchModal
        isOpen={Boolean(unmatchingTarget)}
        targetName={unmatchingTarget?.name ?? ''}
        onClose={() => setUnmatchingTarget(null)}
        onConfirmUnmatch={handleConfirmUnmatch}
      />

      <SpamReportModal
        isOpen={Boolean(spamReportingMatch)}
        targetName={spamReportingMatch?.name ?? ''}
        onClose={() => setSpamReportingMatch(null)}
        onConfirmReport={handleConfirmReportSpam}
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
