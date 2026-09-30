import { useState, useMemo } from 'react'
import TopBar from '../components/TopBar'
import StatusBar from '../components/StatusBar'
import { RadarFilters, type RadarFilterState } from '../components/SidebarPanels'
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
  isAdminSession?: boolean
}

const initialFilters: RadarFilterState = {
  locationQuery: '',
  selectedCategories: [],
  selectedGenres: [],
  radius: 50,
}

export default function DashboardPage({ activePage, onNavigate, profile, isAdminSession }: DashboardPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reportingTarget, setReportingTarget] = useState<string | null>(null)
  const [previewProfile, setPreviewProfile] = useState<ProfileCard | null>(null)
  const [filters, setFilters] = useState<RadarFilterState>(initialFilters)

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((card) => {
      // 1. Location filter (Compara location del perfil)
      if (filters.locationQuery.trim()) {
        const query = filters.locationQuery.trim().toLowerCase()
        const loc = (card.location ?? '').toLowerCase()
        if (!loc.includes(query)) return false
      }

      // 2. Collaborator Type / Categoría filter (Permite seleccionar todas, una o ninguna)
      if (filters.selectedCategories.length > 0) {
        const cardRole = (card.role ?? card.category ?? '').toLowerCase()
        const matchesCategory = filters.selectedCategories.some((cat) =>
          cardRole.includes(cat.toLowerCase())
        )
        if (!matchesCategory) return false
      }

      // 3. Genre Interests filter (Permite seleccionar todas, una o ninguna)
      if (filters.selectedGenres.length > 0) {
        const cardGenres = (card.interestGenres ?? card.tags ?? []).map((g) => g.toLowerCase())
        const matchesGenre = filters.selectedGenres.some((fg) =>
          cardGenres.some((cg) => cg.includes(fg.toLowerCase()) || fg.toLowerCase().includes(cg))
        )
        if (!matchesGenre) return false
      }

      return true
    })
  }, [filters])

  const currentProfile = filteredRecommendations.length > 0
    ? filteredRecommendations[currentIndex % filteredRecommendations.length]
    : null

  const handleDecision = (liked: boolean) => {
    if (filteredRecommendations.length === 0) return
    if (liked && currentProfile) {
      console.log(`Liked ${currentProfile.nickname}`)
    }
    setCurrentIndex((prev) => (prev + 1) % filteredRecommendations.length)
  }

  const handleResetFilters = () => {
    setFilters(initialFilters)
    setCurrentIndex(0)
  }

  return (
    <div className="ls-app-shell">
      <TopBar activePage={activePage} onNavigate={onNavigate} profile={profile} isAdminSession={isAdminSession} />
      <StatusBar poolCount={filteredRecommendations.length} />

      <main className="ls-layout ls-discovery-swipe-layout">
        <section className="ls-discovery-panel">
          <div className="ls-swipe-stage">
            {currentProfile ? (
              <div
                className="ls-swipe-card ls-clickable-card"
                onClick={() => setPreviewProfile(currentProfile)}
                title={`Ver trabajos en SoundCloud de ${currentProfile.nickname ?? ''}`}
              >
                <div className="ls-swipe-image-wrap">
                  <img src={currentProfile.image || currentProfile.profileImage} alt={currentProfile.nickname ?? ''} />
                  <span className="ls-card-badge">{currentProfile.match}</span>
                  <div className="ls-swipe-overlay">
                    <div>
                      <h2>{currentProfile.nickname ?? ''}</h2>
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
            ) : (
              <div
                className="ls-swipe-card ls-empty-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '40px 24px',
                  minHeight: '420px',
                  background: 'rgba(15, 18, 32, 0.8)',
                  borderRadius: '20px',
                  border: '1px border rgba(255, 255, 255, 0.1)'
                }}
              >
                <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px' }}>No hay creadores coincidentes</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', maxWidth: '360px', marginBottom: '24px', lineHeight: 1.5 }}>
                  No se encontraron tarjetas que coincidan con la ubicación, categoría o géneros seleccionados en el radar.
                </p>
                <button
                  type="button"
                  className="ls-primary-button"
                  onClick={handleResetFilters}
                >
                  Restablecer Filtros
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="ls-sidebar">
          <RadarFilters
            filters={filters}
            onChangeFilters={(newFilters) => {
              setFilters(newFilters)
              setCurrentIndex(0)
            }}
            onReset={handleResetFilters}
          />
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

