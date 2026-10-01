import { useState } from 'react'
import { PiPushPinFill, PiBellSimpleSlashBold, PiProhibitBold } from 'react-icons/pi'
import type { Conversation, Message } from '../data/mockData'

type ConversationSidebarProps = {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
  messagesMap?: Record<string, Message[]>
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  messagesMap,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'new'>('all')

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
    const matchesType = conv.type.toLowerCase().includes(query)

    // Also check if any message text in this conversation matches
    const conversationMessages = messagesMap ? messagesMap[conv.id] : undefined
    const matchesMessages = conversationMessages?.some((m) =>
      m.text.toLowerCase().includes(query)
    )

    return matchesName || matchesPreview || matchesRole || matchesType || matchesMessages
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
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`ls-conversation-item ${activeId === conversation.id ? 'is-selected' : ''}`}
              onClick={() => onSelect(conversation.id)}
              style={{
                opacity: conversation.blocked ? 0.6 : 1,
                position: 'relative',
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
                  <span>{conversation.time}</span>
                </div>
                <div className="ls-conversation-meta">
                  <span>{conversation.type}</span>
                  <span className="ls-dot-inline">•</span>
                  <span>{conversation.blocked ? '[Usuario bloqueado]' : conversation.preview}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                {conversation.muted && (
                  <PiBellSimpleSlashBold style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9rem' }} title="Silenciado" />
                )}
                {conversation.blocked && (
                  <PiProhibitBold style={{ color: '#ef4444', fontSize: '0.9rem' }} title="Bloqueado" />
                )}
                {conversation.unread > 0 && <span className="ls-unread">{conversation.unread}</span>}
              </div>
            </button>
          ))
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
