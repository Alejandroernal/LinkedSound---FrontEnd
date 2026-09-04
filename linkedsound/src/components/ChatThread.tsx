import type { Message, Conversation } from '../data/mockData'

export default function ChatThread({
  conversation,
  messages,
}: {
  conversation: Conversation
  messages: Message[]
}) {
  return (
    <section className="ls-chat-panel">
      <header className="ls-chat-header">
        <div className="ls-chat-user">
          <div className={`ls-avatar ${conversation.accent}`}>{conversation.avatar}</div>
          <div>
            <h3>{conversation.name}</h3>
            <small>{conversation.role}</small>
          </div>
        </div>

        <div className="ls-chat-actions">
          <span className="ls-status-pill">{conversation.status}</span>
          <button type="button">Call</button>
          <button type="button">Video</button>
        </div>
      </header>

      <div className="ls-chat-thread">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ls-message-row ${message.sender === 'me' ? 'is-me' : 'is-them'}`}
          >
            {message.sender !== 'me' && (
              <div className={`ls-avatar ${conversation.accent} small`}>{conversation.avatar}</div>
            )}

            <div className={`ls-message-bubble ${message.sender === 'me' ? 'me' : 'them'}`}>
              {message.text}
              <span>{message.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ls-chat-composer">
        <button type="button" className="ls-composer-attach">
          +
        </button>
        <input type="text" placeholder="Message Metro Boomin or drag-and-drop.wav" />
        <button type="button" className="ls-send-btn">
          Send
        </button>
      </div>
    </section>
  )
}
