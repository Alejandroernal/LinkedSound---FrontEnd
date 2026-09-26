import { useState } from 'react'
import TopBar from '../components/TopBar'
import StatusBar from '../components/StatusBar'
import { RadarFilters } from '../components/SidebarPanels'
import Footer from '../components/Footer'
import ReportModal from '../components/ReportModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import { PiFlagBold } from 'react-icons/pi'
import { recommendations, type ProfileCard } from '../data/mockData'
import type { AppPage, Profile } from '../types'

type DashboardPageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile: Profile
}

export default function DashboardPage({ activePage, onNavigate, profile }: DashboardPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reportingTarget, setReportingTarget] = useState<string | null>(null)
  const [previewProfile, setPreviewProfile] = useState<ProfileCard | null>(null)
  const currentProfile = recommendations[currentIndex] ?? recommendations[0]

  const handleDecision = (liked: boolean) => {
    if (liked) {
      console.log(`Liked ${currentProfile.nickname ?? currentProfile.nickname}`)
    }

    setCurrentIndex((prev) => (prev + 1) % recommendations.length)
  }

  return (
    <div className="ls-app-shell">
      <TopBar activePage={activePage} onNavigate={onNavigate} profile={profile} />
      <StatusBar />

      <main className="ls-layout ls-discovery-swipe-layout">
        <section className="ls-discovery-panel">
          <div className="ls-swipe-stage">
            <div
              className="ls-swipe-card ls-clickable-card"
              onClick={() => setPreviewProfile(currentProfile)}
              title={`Ver trabajos en SoundCloud de ${currentProfile.nickname ?? currentProfile.nickname ?? ''}`}
            >
              <div className="ls-swipe-image-wrap">
                <img src={currentProfile.image || currentProfile.profileImage} alt={currentProfile.nickname ?? currentProfile.nickname ?? ''} />
                <span className="ls-card-badge">{currentProfile.match}</span>
                <div className="ls-swipe-overlay">
                  <div>
                    <h2>{currentProfile.nickname ?? currentProfile.nickname ?? ''}</h2>
                    <p>{currentProfile.role}</p>
                  </div>
                  <span>{currentProfile.location}</span>
                </div>

                <div className="ls-swipe-actions">
                  <button
                    type="button"
                    className="ls-swipe-pass"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDecision(false)
                    }}
                    title="Descartar"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    className="ls-swipe-like"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDecision(true)
                    }}
                    title="Conectar"
                  >
                    ✓
                  </button>
                </div>
              </div>

              <div className="ls-swipe-body">
                <div className="ls-swipe-head">
                  <div className="ls-swipe-head-right" style={{ marginLeft: 'auto' }}>
                    <button
                      type="button"
                      className="ls-report-text-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setReportingTarget(currentProfile.nickname ?? currentProfile.firstName ?? '')
                      }}
                    >
                      <PiFlagBold /> Reporte
                    </button>
                    <span className="ls-swipe-score">{currentProfile.match}</span>
                  </div>
                </div>

                <p className="ls-card-desc">{currentProfile.descript ?? currentProfile.bio ?? currentProfile.description}</p>

                <div className="ls-profile-interest-block">
                  <span className="ls-interest-label">Intereses de género</span>
                  <div className="ls-mini-tags">
                    {(currentProfile.interestGenres ?? currentProfile.tags ?? []).map((genre) => (
                      <span key={genre}>{genre}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="ls-sidebar">
          <RadarFilters />
        </aside>
      </main>

      <SoundCloudPreviewModal
        isOpen={Boolean(previewProfile)}
        card={previewProfile}
        onClose={() => setPreviewProfile(null)}
      />

      <ReportModal
        isOpen={Boolean(reportingTarget)}
        targetName={reportingTarget ?? ''}
        targetType="Perfil de Discovery"
        onClose={() => setReportingTarget(null)}
      />

      <Footer />
    </div>
  )
}

