import { useState, useRef, useEffect } from 'react'
import {
  PiPushPinFill,
  PiPushPinBold,
  PiBellSimpleSlashBold,
  PiBellBold,
  PiProhibitBold,
  PiBroomBold,
  PiUserMinusBold,
  PiDotsThreeVerticalBold,
} from 'react-icons/pi'
import type { Conversation, Message } from '../data/mockData'

type ConversationSidebarProps = {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
  messagesMap?: Record<string, Message[]>
  onTogglePin?: (id: string) => void
  onToggleMute?: (id: string) => void
  onClearChat?: (id: string) => void
  onToggleBlock?: (id: string) => void
  onUnmatch?: (conversation: Conversation) => void
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  messagesMap,
  onTogglePin,
  onToggleMute,
  onClearChat,
  onToggleBlock,
  onUnmatch,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'new'>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const newMatchesCount = conversations.filter((c) => c.unread > 0).length

  // Sort: Pinned conversations first
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })

  const filteredConversations = sortedConversations.filter((conv) => {
    // Tab filter
    if (filterTab === 'new' && conv.unread === 0) {
      return false
    }

    // Search query filter
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true

    const matchesName = conv.name.toLowerCase().includes(query)
    const matchesPreview = conv.preview.toLowerCase().includes(query)
    const matchesRole = conv.role.toLowerCase().includes(query)

    // Also check if any message text in this conversation matches
    const conversationMessages = messagesMap ? messagesMap[conv.id] : undefined
    const matchesMessages = conversationMessages?.some((m) =>
      m.text.toLowerCase().includes(query)
    )

    return matchesName || matchesPreview || matchesRole || matchesMessages
  })

  return (
    <aside className="ls-messages-sidebar">
      <div className="ls-message-search" style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search conversations, stems, tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="ls-search-clear-btn"
            style={{
              position: 'absolute',
              right: '26px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            onClick={() => setSearchQuery('')}
          >
            ✕
          </button>
        )}
      </div>

      <div className="ls-message-filters">
        <button
          type="button"
          className={filterTab === 'new' ? 'is-active' : ''}
          onClick={() => setFilterTab('new')}
        >
          New matches ({newMatchesCount})
        </button>
        <button
          type="button"
          className={filterTab === 'all' ? 'is-active' : ''}
          onClick={() => setFilterTab('all')}
        >
          View all
        </button>
      </div>

      <div className="ls-conversation-list">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => {
            const convMessages = messagesMap ? messagesMap[conversation.id] : undefined
            const lastMsg = convMessages && convMessages.length > 0 ? convMessages[convMessages.length - 1] : null
            const displayTime = lastMsg ? lastMsg.time : conversation.time
            const lastMessageDisplay = conversation.blocked
              ? '[Usuario bloqueado]'
              : lastMsg
              ? (lastMsg.text || (lastMsg.attachment ? `📎 ${lastMsg.attachment.name}` : ''))
              : conversation.preview

            return (
              <div
                key={conversation.id}
                className={`ls-conversation-item ${activeId === conversation.id ? 'is-selected' : ''}`}
                onClick={() => onSelect(conversation.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(conversation.id)
                  }
                }}
                role="button"
                tabIndex={0}
                style={{
                  opacity: conversation.blocked ? 0.6 : 1,
                  position: 'relative',
                  zIndex: openMenuId === conversation.id ? 100 : 1,
                  cursor: 'pointer',
                }}
              >
                {conversation.profileImage ? (
                  <div className={`ls-avatar ${conversation.accent} small`} style={{ overflow: 'hidden', padding: 0 }}>
                    <img
                      src={conversation.profileImage}
                      alt={conversation.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                ) : (
                  <div className={`ls-avatar ${conversation.accent} small`}>{conversation.avatar}</div>
                )}
                <div className="ls-conversation-copy">
                  <div className="ls-conversation-head">
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {conversation.pinned && <PiPushPinFill style={{ color: '#a855f7', fontSize: '0.8rem' }} title="Fijado" />}
                      {conversation.name}
                    </strong>
                    <span>{displayTime}</span>
                  </div>
                  <div className="ls-conversation-meta">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lastMessageDisplay}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', position: 'relative' }}>
                  {conversation.muted && (
                    <PiBellSimpleSlashBold style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9rem' }} title="Silenciado" />
                  )}
                  {conversation.blocked && (
                    <PiProhibitBold style={{ color: '#ef4444', fontSize: '0.9rem' }} title="Bloqueado" />
                  )}
                  {conversation.unread > 0 && <span className="ls-unread">{conversation.unread}</span>}

                  {/* 3 puntitos que aparecen al pasar el mouse (hover) */}
                  <button
                    type="button"
                    className={`ls-conv-dots-btn ${openMenuId === conversation.id ? 'is-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === conversation.id ? null : conversation.id)
                    }}
                    style={{
                      background: openMenuId === conversation.id ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '3px 5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Opciones de chat"
                  >
                    <PiDotsThreeVerticalBold size={15} />
                  </button>

                  {/* Desplegable de opciones */}
                  {openMenuId === conversation.id && (
                    <div
                      ref={menuRef}
                      className="ls-conv-menu-dropdown"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '4px',
                        background: '#141628',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85)',
                        width: '180px',
                        zIndex: 1000,
                        padding: '6px 0',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="ls-menu-option"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTogglePin?.(conversation.id)
                          setOpenMenuId(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {conversation.pinned ? <PiPushPinFill style={{ color: '#a855f7' }} /> : <PiPushPinBold />}
                        <span>{conversation.pinned ? 'Desfijar chat' : 'Fijar chat'}</span>
                      </button>

                      <button
                        type="button"
                        className="ls-menu-option"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleMute?.(conversation.id)
                          setOpenMenuId(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {conversation.muted ? <PiBellBold style={{ color: '#00e5ff' }} /> : <PiBellSimpleSlashBold />}
                        <span>{conversation.muted ? 'Dessilenciar' : 'Silenciar'}</span>
                      </button>

                      <button
                        type="button"
                        className="ls-menu-option"
                        onClick={(e) => {
                          e.stopPropagation()
                          onClearChat?.(conversation.id)
                          setOpenMenuId(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <PiBroomBold style={{ color: '#ffb703' }} />
                        <span>Vaciar chat</span>
                      </button>

                      <button
                        type="button"
                        className="ls-menu-option"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleBlock?.(conversation.id)
                          setOpenMenuId(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <PiProhibitBold style={{ color: '#ef4444' }} />
                        <span>{conversation.blocked ? 'Desbloquear' : 'Bloquear'}</span>
                      </button>

                      <button
                        type="button"
                        className="ls-menu-option danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUnmatch?.(conversation)
                          setOpenMenuId(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#ff3c6e',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <PiUserMinusBold style={{ color: '#ff3c6e' }} />
                        <span>Desconectar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div
            style={{
              padding: '28px 16px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.8rem',
            }}
          >
            No conversations found {searchQuery ? `for "${searchQuery}"` : ''}
          </div>
        )}
      </div>
    </aside>
  )
}

