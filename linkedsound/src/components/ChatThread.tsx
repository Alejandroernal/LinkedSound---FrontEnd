import { useState, useRef, useEffect } from 'react'
import type { Message, Conversation } from '../data/mockData'

type ChatThreadProps = {
  conversation: Conversation
  messages: Message[]
  onSendMessage?: (text: string) => void
}

export default function ChatThread({
  conversation,
  messages,
  onSendMessage,
}: ChatThreadProps) {
  const [text, setText] = useState('')
  const threadEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSendMessage?.(trimmed)
    setText('')
  }

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
        <div ref={threadEndRef} />
      </div>

      <form
        className="ls-chat-composer"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
      >
        <button type="button" className="ls-composer-attach" title="Attach stems or audio file">
          +
        </button>
        <input
          type="text"
          placeholder={`Message ${conversation.name} or drag-and-drop .wav`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="ls-send-btn" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </section>
  )
}
