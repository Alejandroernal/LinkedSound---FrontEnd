import { useState, useEffect, useRef, useCallback } from 'react'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ConversationSidebar from '../components/ConversationSidebar'
import ChatThread from '../components/ChatThread'
import UnmatchModal from '../components/UnmatchModal'
import SpamReportModal from '../components/SpamReportModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import type { Message, Conversation, ProfileCard, NewMatchItem } from '../data/mockData'
import { type AppPage, type Profile, type NotificationItem, normalizeMusicalRole } from '../types'
import { api, getToken } from '../services/api'
import { formatUserLocalTime } from '../utils/formatTime'
import { getProfileAvatarUrl, handleAvatarError } from '../utils/avatar'
import {
  PiSparkleFill,
  PiChatCircleDotsBold,
  PiPaperPlaneRightFill,
  PiWarningCircleBold,
  PiArrowLeftBold,
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
  onAcceptMatch?: (notification: NotificationItem) => void
  onOpenMatchChat?: (notification: NotificationItem) => void
  onNotificationClick?: (notification: NotificationItem) => void
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
  onAcceptMatch,
  onOpenMatchChat,
  onNotificationClick,
}: MessagesPageProps) {
  const [localConversationsList, setLocalConversationsList] = useState<Conversation[]>([])
  const [localMessagesMap, setLocalMessagesMap] = useState<Record<string, Message[]>>({})
  const [localActiveId, setLocalActiveId] = useState('')

  const [newMatchesList, setNewMatchesList] = useState<NewMatchItem[]>([])
  const [selectedNewMatchId, setSelectedNewMatchId] = useState<string | null>(null)
  const [spamReportingMatch, setSpamReportingMatch] = useState<NewMatchItem | null>(null)
  const [firstMessageText, setFirstMessageText] = useState('')
  const [dbUsersList, setDbUsersList] = useState<ProfileCard[]>([])

  const conversationsList = propConversationsList ?? localConversationsList
  const setConversationsList = propSetConversationsList ?? setLocalConversationsList

  const messagesMap = propMessagesMap ?? localMessagesMap
  const setMessagesMap = propSetMessagesMap ?? setLocalMessagesMap

  const activeId = propActiveId ?? localActiveId
  const setActiveId = propSetActiveId ?? setLocalActiveId

  const [unmatchingTarget, setUnmatchingTarget] = useState<Conversation | null>(null)
  const [inspectedProfileCard, setInspectedProfileCard] = useState<ProfileCard | null>(null)

  const activeIdRef = useRef<string>(activeId)
  activeIdRef.current = activeId
  const isFetchingMessagesRef = useRef(false)
  const isFetchingConvsRef = useRef(false)

  const syncConversationMessages = useCallback(async (conversationId: string) => {
    if (!conversationId || !getToken() || isFetchingMessagesRef.current) return
    isFetchingMessagesRef.current = true
    try {
      const mRes = await api.conversations.getMessages(conversationId)
      if (mRes.success && Array.isArray(mRes.messages)) {
        const fetchedMessages: Message[] = mRes.messages.map((m: any) => ({
          ...m,
          time: formatUserLocalTime(m.createdAt, m.time),
        }))

        setMessagesMap((prev) => {
          const existing = prev[conversationId] || []
          // Preservar mensajes optimistas aun en vuelo (prefijo temp-)
          const pendingOptimistic = existing.filter((m) => String(m.id).startsWith('temp-'))
          const merged = pendingOptimistic.length > 0
            ? [...fetchedMessages, ...pendingOptimistic]
            : fetchedMessages

          const isUnchanged =
            existing.length === merged.length &&
            existing.every(
              (item, idx) =>
                item.id === merged[idx].id &&
                item.text === merged[idx].text &&
                item.attachment?.url === merged[idx].attachment?.url
            )

          if (isUnchanged) return prev
          return {
            ...prev,
            [conversationId]: merged,
          }
        })

        // Como getMessages marca como leidos los mensajes entrantes en backend, reflejar unread = 0 localmente
        setConversationsList((prev) => {
          const hasUnread = prev.some((c) => c.id === conversationId && c.unread > 0)
          if (!hasUnread) return prev
          return prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c))
        })
      }
    } catch {
      // Silenciar errores transitorios de polling
    } finally {
      isFetchingMessagesRef.current = false
    }
  }, [setMessagesMap, setConversationsList])

  const syncConversationsAndMatches = useCallback(async () => {
    if (!getToken() || isFetchingConvsRef.current) return
    isFetchingConvsRef.current = true
    try {
      const [convRes, matchesRes] = await Promise.all([
        api.conversations.getAll().catch(() => ({ success: false, conversations: undefined })),
        api.interactions.getMatches().catch(() => ({ success: false, matches: undefined })),
      ])

      if (convRes.success && Array.isArray(convRes.conversations)) {
        const currentOpenId = activeIdRef.current
        const mappedConvs: Conversation[] = convRes.conversations.map((c: any) => ({
          ...c,
          role: normalizeMusicalRole(c.role),
          time: formatUserLocalTime(c.lastMessageCreatedAt || c.updatedAt, c.time),
          unread: currentOpenId && c.id === currentOpenId ? 0 : c.unread,
        }))
        setConversationsList(mappedConvs)
      }

      if (matchesRes.success && Array.isArray(matchesRes.matches)) {
        const mappedMatches: NewMatchItem[] = matchesRes.matches.map((m: any) => ({
          id: m.partnerId,
          name: m.name,
          role: normalizeMusicalRole(m.role),
          location: m.location || 'No especificada',
          match: m.affinityPercent || m.affinity || '95%',
          profileImage: getProfileAvatarUrl(m.profileImage || m.avatar),
          accent: 'purple' as const,
          date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Hoy',
        }))
        setNewMatchesList(mappedMatches)
      }
    } finally {
      isFetchingConvsRef.current = false
    }
  }, [setConversationsList])

  useEffect(() => {
    syncConversationsAndMatches()
    if (activeIdRef.current) {
      syncConversationMessages(activeIdRef.current)
    }

    // Cargar usuarios para perfil inspeccionado
    api.auth.getUsers().then((res) => {
      if (res.success && Array.isArray(res.users)) {
        const mapped: ProfileCard[] = res.users.map((u: any) => ({
          id: u.id,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          nickname: u.nickname || `${u.firstName} ${u.lastName}`.trim(),
          role: normalizeMusicalRole(u.role),
          location: u.location || 'No especificada',
          description: u.description || '',
          interestGenres: u.interestGenres || [],
          tags: u.interestGenres || [],
          soundcloudUrl: u.soundcloudUrl || '',
          spotifyUrl: u.spotifyUrl || '',
          profileImage: getProfileAvatarUrl(u.profileImage),
          match: '94%',
          isProfile: true,
          itemRole: 'Perfil',
          tracks: Array.isArray(u.tracks) && u.tracks.length > 0 ? u.tracks : [],
        }))
        setDbUsersList(mapped)
      }
    }).catch(() => {})
  }, [syncConversationsAndMatches, syncConversationMessages])

  // Cargar mensajes automaticamente cuando cambia activeId (por ejemplo al abrir un chat desde notificaciones)
  useEffect(() => {
    if (!activeId) return
    setSelectedNewMatchId(null)
    syncConversationMessages(activeId)
  }, [activeId, syncConversationMessages])

  // Polling en tiempo real para el chat activo, lista de conversaciones y nuevos matches
  useEffect(() => {
    if (!getToken()) return

    const pollTick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      if (activeIdRef.current) {
        syncConversationMessages(activeIdRef.current)
      }
      syncConversationsAndMatches()
    }

    const interval = setInterval(pollTick, 3500)

    const handleVisibilityOrFocus = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        pollTick()
      }
    }

    const handleIncomingPushMessage = (event: Event) => {
      const customEvent = event as CustomEvent<{ conversationId?: string | null }>
      const targetConvId = customEvent.detail?.conversationId
      if (targetConvId && targetConvId === activeIdRef.current) {
        syncConversationMessages(targetConvId)
      } else if (activeIdRef.current) {
        syncConversationMessages(activeIdRef.current)
      }
      syncConversationsAndMatches()
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)
    window.addEventListener('linkedsound:new-message', handleIncomingPushMessage)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      window.removeEventListener('linkedsound:new-message', handleIncomingPushMessage)
    }
  }, [syncConversationMessages, syncConversationsAndMatches])

  const activeConversation = conversationsList.find((item) => item.id === activeId) ?? null
  const selectedNewMatch = newMatchesList.find((m) => m.id === selectedNewMatchId) ?? null

  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    setSelectedNewMatchId(null)
    setConversationsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    )
    syncConversationMessages(id)
  }

  const handleSelectNewMatch = (id: string) => {
    setSelectedNewMatchId(id)
    setActiveId('')
    setFirstMessageText('')
  }

  const handleSendFirstMessage = (match: NewMatchItem) => {
    const trimmedText = firstMessageText.trim()
    if (!trimmedText) return

    const now = new Date()
    const timeStr = formatUserLocalTime(now)
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const existingConv = conversationsList.find(
      (c) => c.name.toLowerCase() === match.name.toLowerCase() || c.id === match.id
    )
    const convId = existingConv ? existingConv.id : match.id

    const newConv: Conversation = existingConv || {
      id: convId,
      name: match.name,
      role: normalizeMusicalRole(match.role),
      avatar: match.name.substring(0, 2).toUpperCase(),
      accent: match.accent,
      status: 'Online',
      preview: trimmedText,
      time: timeStr,
      lastMessageCreatedAt: now.toISOString(),
      unread: 0,
      profileImage: match.profileImage,
      location: match.location,
    }

    const initialMsg: Message = {
      id: tempId,
      sender: 'me',
      text: trimmedText,
      time: timeStr,
      createdAt: now.toISOString(),
    }

    if (!existingConv) {
      setConversationsList((prev) => [newConv, ...prev])
    }
    setMessagesMap((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), initialMsg],
    }))
    setNewMatchesList((prev) => prev.filter((m) => m.id !== match.id))
    setSelectedNewMatchId(null)
    setFirstMessageText('')
    handleSelectConversation(convId)

    // Enviar mensaje persistente a la base de datos y reconciliar el ID temporal
    api.conversations.sendMessage(convId, { text: trimmedText }).then((res) => {
      if (res.success) {
        const savedMsg = res.formattedMessage || res.data
        setMessagesMap((prev) => {
          const currentList = prev[convId] || []
          if (savedMsg?.id && currentList.some((m) => m.id === savedMsg.id)) {
            return { ...prev, [convId]: currentList.filter((m) => m.id !== tempId) }
          }
          return {
            ...prev,
            [convId]: currentList.map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    id: savedMsg?.id || m.id,
                    createdAt: savedMsg?.createdAt || m.createdAt,
                    time: formatUserLocalTime(savedMsg?.createdAt, timeStr),
                  }
                : m
            ),
          }
        })
      }
    }).catch(() => {})
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
    const foundCard = dbUsersList.find((c) => c.nickname?.toLowerCase().trim() === targetName)

    if (foundCard) {
      setInspectedProfileCard(foundCard)
    } else {
      const nameParts = activeConversation.name.trim().split(' ')
      const firstName = nameParts[0] || activeConversation.name
      const lastName = nameParts.slice(1).join(' ') || ''

      const cleanCard: ProfileCard = {
        firstName,
        lastName,
        nickname: activeConversation.name,
        role: normalizeMusicalRole(activeConversation.role),
        location: activeConversation.location || 'No especificada',
        profileImage: getProfileAvatarUrl(activeConversation.profileImage),
        isProfile: true,
        itemRole: 'Perfil',
        description: '',
        match: '100%',
        badge: 'Contacto',
        interestGenres: [],
        tags: [],
        soundcloudUrl: '',
        spotifyUrl: '',
        soundcloudHandle: '',
        tracks: [],
      }

      setInspectedProfileCard(cleanCard)
    }
  }

  const handleConfirmUnmatch = async () => {
    if (!unmatchingTarget) return
    const targetId = unmatchingTarget.id
    const partnerId = (unmatchingTarget as any).partnerId || (unmatchingTarget as any).partnerUserId

    try {
      await api.conversations.delete(targetId)
    } catch (err) {
      console.error('Error al desconectar conversación:', err)
      if (partnerId) {
        api.interactions.unmatch(partnerId).catch(() => {})
      }
    }

    setConversationsList((prev) => {
      const updated = prev.filter((c) => c.id !== targetId)
      if (activeId === targetId) {
        setActiveId('')
      }
      return updated
    })

    setNewMatchesList((prev) => {
      if (!partnerId) return prev
      return prev.filter((m) => m.id !== partnerId)
    })

    setMessagesMap((prev) => {
      const copy = { ...prev }
      delete copy[targetId]
      return copy
    })
  }

  const handleSendMessage = (text: string, attachment?: Message['attachment']) => {
    if (!activeId) return
    const targetConvId = activeId
    const now = new Date()
    const timeStr = formatUserLocalTime(now)
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newMessage: Message = {
      id: tempId,
      sender: 'me',
      text,
      time: timeStr,
      createdAt: now.toISOString(),
      attachment,
    }

    const previewText = text || (attachment ? `[Archivo] ${attachment.name}` : '')

    setMessagesMap((prev) => ({
      ...prev,
      [targetConvId]: [...(prev[targetConvId] ?? []), newMessage],
    }))

    setConversationsList((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? { ...c, preview: previewText, time: timeStr, lastMessageCreatedAt: now.toISOString(), unread: 0 }
          : c
      )
    )

    api.conversations.sendMessage(targetConvId, {
      text,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
      attachmentSize: attachment?.size,
    }).then((res) => {
      if (res.success) {
        const savedMsg = res.formattedMessage || res.data
        if (savedMsg) {
          const finalTime = formatUserLocalTime(savedMsg.createdAt, timeStr)
          setMessagesMap((prev) => {
            const currentList = prev[targetConvId] || []
            const alreadyPersisted = Boolean(savedMsg.id && currentList.some((m) => m.id === savedMsg.id))
            if (alreadyPersisted) {
              return {
                ...prev,
                [targetConvId]: currentList.filter((m) => m.id !== tempId),
              }
            }
            return {
              ...prev,
              [targetConvId]: currentList.map((m) =>
                m.id === tempId
                  ? {
                      ...m,
                      id: savedMsg.id || m.id,
                      createdAt: savedMsg.createdAt || m.createdAt,
                      time: finalTime,
                      attachment: savedMsg.attachment
                        ? {
                            ...m.attachment!,
                            url: savedMsg.attachment.url || m.attachment?.url,
                          }
                        : m.attachment,
                    }
                  : m
              ),
            }
          })
        }
      }
    }).catch(() => {})
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
    const targetConv = conversationsList.find((c) => c.id === targetId)
    const nextVal = targetConv ? !targetConv.muted : true

    setConversationsList((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, muted: nextVal } : c))
    )

    api.conversations.update(targetId, { muted: nextVal }).catch((err) => {
      console.error('Error al actualizar silencio de conversación:', err)
      setConversationsList((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, muted: !nextVal } : c))
      )
    })
  }

  const handleTogglePin = (id?: string) => {
    const targetId = id ?? activeId
    if (!targetId) return
    const targetConv = conversationsList.find((c) => c.id === targetId)
    const nextVal = targetConv ? !targetConv.pinned : true

    setConversationsList((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, pinned: nextVal } : c))
    )

    api.conversations.update(targetId, { pinned: nextVal }).catch((err) => {
      console.error('Error al actualizar fijado de conversación:', err)
      setConversationsList((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, pinned: !nextVal } : c))
      )
    })
  }

  const handleToggleBlock = (id?: string) => {
    const targetId = id ?? activeId
    if (!targetId) return
    const targetConv = conversationsList.find((c) => c.id === targetId)
    const nextVal = targetConv ? !targetConv.blocked : true

    setConversationsList((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, blocked: nextVal } : c))
    )

    api.conversations.update(targetId, { blocked: nextVal }).catch((err) => {
      console.error('Error al alternar bloqueo de conversación:', err)
      setConversationsList((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, blocked: !nextVal } : c))
      )
    })
  }

  const unreadMessagesCount = conversationsList.reduce((acc, c) => acc + (c.unread || 0), 0)
  const hasActiveChat = Boolean(activeConversation || selectedNewMatch)

  return (
    <div className={`ls-app-shell ls-messages-shell ${hasActiveChat ? 'has-active-chat' : 'no-active-chat'}`}>
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
        onAcceptMatch={onAcceptMatch}
        onOpenMatchChat={onOpenMatchChat}
        onNotificationClick={onNotificationClick}
      />

      <div className={`ls-messages-layout ${hasActiveChat ? 'has-active-chat' : 'no-active-chat'}`}>
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
          <div className="ls-chat-panel ls-selected-match-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <button
                type="button"
                className="ls-chat-back-btn"
                onClick={() => setSelectedNewMatchId(null)}
                title="Volver a los chats"
                aria-label="Volver a la lista de chats"
              >
                <PiArrowLeftBold />
              </button>
              <div className={`ls-avatar ${selectedNewMatch.accent}`} style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden' }}>
                <img
                  src={getProfileAvatarUrl(selectedNewMatch.profileImage)}
                  alt={selectedNewMatch.name}
                  onError={handleAvatarError}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
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
            onBack={() => setActiveId('')}
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
