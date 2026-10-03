import { useState, useMemo } from 'react'
import TopBar from '../components/TopBar'
import { RadarFilters, type RadarFilterState } from '../components/SidebarPanels'
import Footer from '../components/Footer'
import ReportModal from '../components/ReportModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import { PiFlagBold } from 'react-icons/pi'
import { recommendations, type ProfileCard } from '../data/mockData'
import type { AppPage, Profile, NotificationItem, UserProfile } from '../types'
import { isUserProfile } from '../types'

type DashboardPageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile: Profile
  isAdminSession?: boolean
  notifications?: NotificationItem[]
  onMarkNotificationAsRead?: (id: string) => void
  onMarkAllNotificationsAsRead?: () => void
  onClearNotifications?: () => void
  onSignOut?: () => void
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
  'trenque lauquen, argentina': { lat: -35.973, lon: -62.734 },
  'trenque lauquen': { lat: -35.973, lon: -62.734 },
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

export default function DashboardPage({
  activePage,
  onNavigate,
  profile,
  isAdminSession,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearNotifications,
  onSignOut,
}: DashboardPageProps) {
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

  const isProfile = currentProfile ? isUserProfile(currentProfile) : false
  const firstName = isProfile && currentProfile ? (currentProfile as UserProfile).firstName : ''
  const lastName = isProfile && currentProfile ? (currentProfile as UserProfile).lastName : ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const greenBoxTitle = currentProfile?.nickname?.trim() || fullName || 'Artista'
  const redBoxFullName = isProfile ? fullName : currentProfile?.nickname || ''

  return (
    <div className="ls-app-shell">
      <TopBar
        activePage={activePage}
        onNavigate={onNavigate}
        profile={profile}
        isAdminSession={isAdminSession}
        notifications={notifications}
        onMarkNotificationAsRead={onMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
        onClearNotifications={onClearNotifications}
        onSignOut={onSignOut}
      />

      <main className="ls-layout ls-discovery-swipe-layout">
        <section className="ls-discovery-panel">
          <div className="ls-swipe-stage">
            {currentProfile ? (
              <div
                className="ls-swipe-card ls-clickable-card"
                onClick={() => setPreviewProfile(currentProfile)}
                title={`Ver trabajos en SoundCloud de ${greenBoxTitle}`}
              >
                <div className="ls-swipe-image-wrap">
                  <img src={currentProfile.profileImage} alt={greenBoxTitle} />
                  <span className="ls-card-badge">{currentProfile.match}</span>
                  <div className="ls-swipe-overlay">
                    <div>
                      <h2>{greenBoxTitle}</h2>
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
                    <div className="ls-swipe-head-left">
                      <span className="ls-swipe-fullname">
                        {redBoxFullName}
                      </span>
                    </div>

                    <div className="ls-swipe-head-right">
                      <button
                        type="button"
                        className="ls-report-text-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setReportingTarget(greenBoxTitle)
                        }}
                      >
                        <PiFlagBold /> Reporte
                      </button>
                      <span className="ls-swipe-score">{currentProfile.match}</span>
                    </div>
                  </div>

                  <p className="ls-card-desc">{currentProfile.description ?? ''}</p>

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
              <div className="ls-swipe-card ls-empty-card">
                <h3>No hay creadores coincidentes</h3>
                <p>
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

