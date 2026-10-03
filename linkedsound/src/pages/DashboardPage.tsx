import { useState, useMemo } from 'react'
import TopBar from '../components/TopBar'
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

const LOCATION_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'francia, paris': { lat: 48.8566, lon: 2.3522 },
  'berlin, germany': { lat: 52.52, lon: 13.405 },
  'entre rios, argentina': { lat: -31.741, lon: -58.514 },
  'new york, ny': { lat: 40.7128, lon: -74.006 },
  'london, uk': { lat: 51.5074, lon: -0.1278 },
  'tokyo, japan': { lat: 35.6895, lon: 139.6917 },
  'buenos aires, argentina': { lat: -34.6037, lon: -58.3816 },
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function DashboardPage({ activePage, onNavigate, profile, isAdminSession }: DashboardPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reportingTarget, setReportingTarget] = useState<string | null>(null)
  const [previewProfile, setPreviewProfile] = useState<ProfileCard | null>(null)
  const [filters, setFilters] = useState<RadarFilterState>(initialFilters)

  const filteredRecommendations = useMemo(() => {
    let centerLat = filters.centerLat
    let centerLng = filters.centerLng

    if ((centerLat === undefined || centerLng === undefined) && filters.locationQuery.trim()) {
      const q = filters.locationQuery.trim().toLowerCase()
      for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
        if (q.includes(key) || key.includes(q)) {
          centerLat = coords.lat
          centerLng = coords.lon
          break
        }
      }
    }

    return recommendations.filter((card) => {
      // 1. Location text filter
      if (filters.locationQuery.trim()) {
        const query = filters.locationQuery.trim().toLowerCase()
        const loc = (card.location ?? '').toLowerCase()
        if (!loc.includes(query) && centerLat === undefined) return false
      }

      // 2. Distance radius filter in kilometers
      if (filters.radius < 500 && centerLat !== undefined && centerLng !== undefined) {
        let cardLat = card.latitude
        let cardLng = card.longitude

        if (cardLat === undefined || cardLng === undefined) {
          const cLoc = (card.location ?? '').toLowerCase()
          for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
            if (cLoc.includes(key) || key.includes(cLoc)) {
              cardLat = coords.lat
              cardLng = coords.lon
              break
            }
          }
        }

        if (cardLat !== undefined && cardLng !== undefined) {
          const distance = getDistanceKm(centerLat, centerLng, cardLat, cardLng)
          if (distance > filters.radius) return false
        }
      }

      // 3. Collaborator Type / Categoría filter
      if (filters.selectedCategories.length > 0) {
        const cardRole = (card.role ?? card.category ?? '').toLowerCase()
        const matchesCategory = filters.selectedCategories.some((cat) =>
          cardRole.includes(cat.toLowerCase())
        )
        if (!matchesCategory) return false
      }

      // 4. Genre Interests filter
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

      <main className="ls-layout ls-discovery-swipe-layout" style={{ marginTop: '16px' }}>
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

                  <p className="ls-card-desc">{currentProfile.descript ?? currentProfile.description ?? currentProfile.description}</p>

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

