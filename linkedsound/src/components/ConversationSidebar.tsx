import type { Conversation } from '../data/mockData'

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <aside className="ls-messages-sidebar">
      <div className="ls-message-search">
        <input type="text" placeholder="Search conversations, stems, tags..." />
      </div>

      <div className="ls-message-filters">
        <button type="button">New matches (3)</button>
        <button type="button" className="is-active">
          View all
        </button>
      </div>

      <div className="ls-conversation-list">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            className={`ls-conversation-item ${activeId === conversation.id ? 'is-selected' : ''}`}
            onClick={() => onSelect(conversation.id)}
          >
            <div className={`ls-avatar ${conversation.accent}`}>{conversation.avatar}</div>
            <div className="ls-conversation-copy">
              <div className="ls-conversation-head">
                <strong>{conversation.name}</strong>
                <span>{conversation.time}</span>
              </div>
              <div className="ls-conversation-meta">
                <span>{conversation.type}</span>
                <span className="ls-dot-inline">•</span>
                <span>{conversation.preview}</span>
              </div>
            </div>
            {conversation.unread > 0 && <span className="ls-unread">{conversation.unread}</span>}
          </button>
        ))}
      </div>
    </aside>
  )
}
