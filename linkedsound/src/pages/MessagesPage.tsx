import { useState } from 'react'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ConversationSidebar from '../components/ConversationSidebar'
import ChatThread from '../components/ChatThread'
import {
  conversations as initialConversations,
  messagesByConversation as initialMessages,
  type Message,
  type Conversation,
} from '../data/mockData'
import type { AppPage, Profile } from '../types'

type MessagesPageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile: Profile
  isAdminSession?: boolean
}

export default function MessagesPage({ activePage, onNavigate, profile, isAdminSession }: MessagesPageProps) {
  const [conversationsList, setConversationsList] = useState<Conversation[]>(initialConversations)
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(initialMessages)
  const [activeId, setActiveId] = useState('metro-boomin')

  const activeConversation =
    conversationsList.find((item) => item.id === activeId) ?? conversationsList[0]

  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    // Mark unread as 0 when opened
    setConversationsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    )
  }

  const handleSendMessage = (text: string) => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newMessage: Message = {
      id: String(Date.now()),
      sender: 'me',
      text,
      time: timeStr,
    }

    setMessagesMap((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), newMessage],
    }))

    // Update conversation preview and time in sidebar
    setConversationsList((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, preview: text, time: timeStr, unread: 0 }
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

  return (
    <div className="ls-app-shell ls-messages-shell">
      <TopBar activePage={activePage} onNavigate={onNavigate} profile={profile} isAdminSession={isAdminSession} />

      <div className="ls-messages-layout">
        <ConversationSidebar
          conversations={conversationsList}
          activeId={activeId}
          onSelect={handleSelectConversation}
          messagesMap={messagesMap}
        />

        <ChatThread
          conversation={activeConversation}
          messages={messagesMap[activeConversation.id] ?? []}
          onSendMessage={handleSendMessage}
        />
      </div>

      <Footer />
    </div>
  )
}
