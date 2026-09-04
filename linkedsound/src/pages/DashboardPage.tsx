import { useState } from 'react'
import TopBar from '../components/TopBar'
import StatusBar from '../components/StatusBar'
import { RadarFilters, MatchesPanel, LivePanel } from '../components/SidebarPanels'
import Footer from '../components/Footer'
import { recommendations } from '../data/mockData'
import type { AppPage } from '../types'

type DashboardPageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
}

export default function DashboardPage({ activePage, onNavigate }: DashboardPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentProfile = recommendations[currentIndex] ?? recommendations[0]

  const handleDecision = (liked: boolean) => {
    if (liked) {
      console.log(`Liked ${currentProfile.name}`)
    }

    setCurrentIndex((prev) => (prev + 1) % recommendations.length)
  }

  return (
    <div className="ls-app-shell">
      <TopBar activePage={activePage} onNavigate={onNavigate} />
      <StatusBar />

      <main className="ls-layout ls-discovery-swipe-layout">
        <section className="ls-discovery-panel">
          <div className="ls-swipe-stage">
            <div className="ls-swipe-card">
              <div className="ls-swipe-image-wrap">
                <img src={currentProfile.image} alt={currentProfile.name} />
                <span className="ls-card-badge">{currentProfile.match}</span>
                <div className="ls-swipe-overlay">
                  <div>
                    <h2>{currentProfile.name}</h2>
                    <p>{currentProfile.role}</p>
                  </div>
                  <span>{currentProfile.location}</span>
                </div>
              </div>

              <div className="ls-swipe-body">
                <div className="ls-swipe-head">
                  <span className="ls-tag">{currentProfile.badge}</span>
                  <span className="ls-swipe-score">{currentProfile.match}</span>
                </div>

                <p className="ls-card-desc">{currentProfile.description}</p>

                <div className="ls-profile-interest-block">
                  <span className="ls-interest-label">Intereses de género</span>
                  <div className="ls-mini-tags">
                    {currentProfile.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ls-swipe-actions">
              <button type="button" className="ls-swipe-pass" onClick={() => handleDecision(false)}>
                No thanks
              </button>
              <button type="button" className="ls-swipe-like" onClick={() => handleDecision(true)}>
                Like
              </button>
            </div>
          </div>
        </section>

        <aside className="ls-sidebar">
          <RadarFilters />
          <MatchesPanel />
          <LivePanel />
        </aside>
      </main>

      <Footer />
    </div>
  )
}
