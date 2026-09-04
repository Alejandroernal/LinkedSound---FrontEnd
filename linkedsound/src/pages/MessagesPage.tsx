import { useState } from 'react'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ConversationSidebar from '../components/ConversationSidebar'
import ChatThread from '../components/ChatThread'
import { conversations, messagesByConversation } from '../data/mockData'
import type { AppPage } from '../types'

type MessagesPageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
}

export default function MessagesPage({ activePage, onNavigate }: MessagesPageProps) {
  const [activeId, setActiveId] = useState('metro-boomin')
  const activeConversation = conversations.find((item) => item.id === activeId) ?? conversations[0]

  return (
    <div className="ls-app-shell ls-messages-shell">
      <TopBar activePage={activePage} onNavigate={onNavigate} />

      <div className="ls-messages-layout">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
        />

        <ChatThread
          conversation={activeConversation}
          messages={messagesByConversation[activeConversation.id] ?? []}
        />
      </div>

      <Footer />
    </div>
  )
}
