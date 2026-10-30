import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import TopBar from '../components/TopBar'
import { RadarFilters, type RadarFilterState } from '../components/SidebarPanels'
import Footer from '../components/Footer'
import ReportModal from '../components/ReportModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import SwipeCardStack from '../components/SwipeCardStack'
import type { ProfileCard } from '../data/mockData'
import type { AppPage, Profile, NotificationItem } from '../types'
import { api } from '../services/api'
import { computeUserAffinity } from '../utils/affinity'
import {
  PiUsersBold,
  PiArrowsClockwiseBold,
  PiSlidersHorizontalBold,
} from 'react-icons/pi'

function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

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
  onConnectProfile?: (card: ProfileCard) => void
  unreadMessagesCount?: number
}

const LOCATION_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'francia, paris': { lat: 48.8566, lon: 2.3522 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'berlin, germany': { lat: 52.52, lon: 13.405 },
  'berlin': { lat: 52.52, lon: 13.405 },
  'entre rios, argentina': { lat: -31.741, lon: -58.514 },
  'entre rios': { lat: -31.741, lon: -58.514 },
  'entre ríos': { lat: -31.741, lon: -58.514 },
  'trenque lauquen, argentina': { lat: -35.973, lon: -62.734 },
  'trenque lauquen': { lat: -35.973, lon: -62.734 },
  'new york, ny': { lat: 40.7128, lon: -74.006 },
  'new york': { lat: 40.7128, lon: -74.006 },
  'london, uk': { lat: 51.5074, lon: -0.1278 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'tokyo, japan': { lat: 35.6895, lon: 139.6917 },
  'tokyo': { lat: 35.6895, lon: 139.6917 },
  'buenos aires, argentina': { lat: -34.6037, lon: -58.3816 },
  'buenos aires': { lat: -34.6037, lon: -58.3816 },
  'los angeles, usa': { lat: 34.0522, lon: -118.2437 },
  'los angeles': { lat: 34.0522, lon: -118.2437 },
  'madrid, españa': { lat: 40.4168, lon: -3.7038 },
  'madrid': { lat: 40.4168, lon: -3.7038 },
  'barcelona, españa': { lat: 41.3851, lon: 2.1734 },
  'barcelona': { lat: 41.3851, lon: 2.1734 },
  'córdoba, argentina': { lat: -31.4201, lon: -64.1888 },
  'córdoba': { lat: -31.4201, lon: -64.1888 },
  'rosario, argentina': { lat: -32.9442, lon: -60.6505 },
  'rosario': { lat: -32.9442, lon: -60.6505 },
  'mendoza, argentina': { lat: -32.8895, lon: -68.8458 },
  'mendoza': { lat: -32.8895, lon: -68.8458 },
}

export function getCoordinatesForLocation(locStr?: string): { lat: number; lon: number } | null {
  if (!locStr || !locStr.trim()) return null
  const normalized = locStr.toLowerCase().trim()
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords
    }
  }
  return null
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
  onConnectProfile,
  unreadMessagesCount,
}: DashboardPageProps) {
  const [cardsList, setCardsList] = useState<ProfileCard[]>([])
  const EMPTY_RESET_SECONDS = 300 // Tiempo para recargar cuando se consumen todos los perfiles
  const [autoResetCountdown, setAutoResetCountdown] = useState<number>(EMPTY_RESET_SECONDS)
  const [isResettingDeck, setIsResettingDeck] = useState(false)
  const [hasExhaustedCards, setHasExhaustedCards] = useState(false)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const isResettingRef = useRef(false)

  const loadDiscoveryCards = useCallback(async (isInitialOrNav = false) => {
    setIsLoadingCards(true)
    try {
      const [res, interRes] = await Promise.all([
        api.auth.getUsers(),
        api.interactions.getUserInteractions().catch(() => ({ success: false, interactions: [] })),
      ])

      if (res.success && Array.isArray(res.users)) {
        const currentId = profile?.id
        const currentEmail = profile?.email
        const currentNick = profile?.nickname

        let interactedUserIds = new Set(
          (interRes.interactions || []).map((i: any) => i.receiverId)
        )

        let candidateUsers = res.users.filter((u: any) => {
          // Excluir al usuario actual de su propio stack de descubrimiento
          if (currentId && u.id === currentId) return false
          if (currentEmail && u.email === currentEmail) return false
          if (currentNick && u.nickname === currentNick) return false
          if (u.role === 'Administrador' || u.role === 'Admin') return false
          // Excluir perfiles con interaccion previa (like o descarte)
          if (interactedUserIds.has(u.id)) return false
          return true
        })

        // Si al navegar o recargar no quedan candidatos porque ya se interactuo con todos previamente,
        // reiniciamos las interacciones para que el usuario tenga perfiles disponibles de inmediato sin esperar 5 minutos.
        if (
          isInitialOrNav &&
          candidateUsers.length === 0 &&
          res.users.some((u: any) => u.id !== currentId && u.role !== 'Administrador' && u.role !== 'Admin')
        ) {
          await api.interactions.reset().catch(() => {})
          candidateUsers = res.users.filter((u: any) => {
            if (currentId && u.id === currentId) return false
            if (currentEmail && u.email === currentEmail) return false
            if (currentNick && u.nickname === currentNick) return false
            if (u.role === 'Administrador' || u.role === 'Admin') return false
            return true
          })
        }

        const dbCards: ProfileCard[] = candidateUsers.map((u: any) => {
          const coords = (typeof u.latitude === 'number' && typeof u.longitude === 'number')
            ? { lat: u.latitude, lon: u.longitude }
            : getCoordinatesForLocation(u.location)

          const affinity = computeUserAffinity(profile, u)

          return {
            id: u.id,
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            nickname: u.nickname || `${u.firstName} ${u.lastName}`.trim(),
            role: u.role || 'Artista',
            location: u.location || 'No especificada',
            latitude: coords?.lat,
            longitude: coords?.lon,
            description: u.description || '',
            interestGenres: u.interestGenres || [],
            favoriteArtists: Array.isArray(u.favoriteArtists) ? u.favoriteArtists : [],
            tags: u.interestGenres || [],
            soundcloudUrl: u.soundcloudUrl || '',
            soundcloudHandle: u.soundcloudHandle || '',
            spotifyUrl: u.spotifyUrl || '',
            instagramUrl: u.instagramUrl || '',
            profileImage: u.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
            match: affinity.percentageFormatted,
            commonArtists: affinity.commonArtists,
            commonGenres: affinity.commonGenres,
            affinityReason: affinity.summary,
            isProfile: true,
            itemRole: 'Perfil',
            badge: u.role === 'Productor' ? 'Producer' : 'Artist',
            tracks: Array.isArray(u.tracks) ? u.tracks : [],
          }
        })

        setCardsList(dbCards)
        setCurrentIndex(0)
        setHasExhaustedCards(false)
        setAutoResetCountdown(EMPTY_RESET_SECONDS)
      }
    } catch {
      // Manejo de error de red
    } finally {
      setIsLoadingCards(false)
    }
  }, [profile?.id, profile?.email, profile?.nickname])

  useEffect(() => {
    loadDiscoveryCards(true)
  }, [loadDiscoveryCards])

  // Ejecucion automatica del reinicio de perfiles
  const performAutoReset = useCallback(async () => {
    if (isResettingRef.current) return
    isResettingRef.current = true
    setIsResettingDeck(true)
    try {
      await api.interactions.reset()
      await loadDiscoveryCards(false)
      setCurrentIndex(0)
      setHasExhaustedCards(false)
    } catch (err) {
      console.error('Error al auto-reiniciar perfiles:', err)
    } finally {
      setIsResettingDeck(false)
      isResettingRef.current = false
      setAutoResetCountdown(EMPTY_RESET_SECONDS)
    }
  }, [loadDiscoveryCards])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [reportingTarget, setReportingTarget] = useState<string | null>(null)
  const [previewProfile, setPreviewProfile] = useState<ProfileCard | null>(null)
  const [filters, setFilters] = useState<RadarFilterState>(() => {
    const profileCoords = getCoordinatesForLocation(profile?.location)
    return {
      locationQuery: '',
      centerLat: profileCoords?.lat,
      centerLng: profileCoords?.lon,
      selectedCategories: [],
      selectedGenres: [],
      radius: 500,
    }
  })
  const [showFilters, setShowFilters] = useState(false)

  const filteredRecommendations = useMemo(() => {
    let centerLat = filters.centerLat
    let centerLng = filters.centerLng

    if ((centerLat === undefined || centerLng === undefined) && filters.locationQuery.trim()) {
      const coords = getCoordinatesForLocation(filters.locationQuery)
      if (coords) {
        centerLat = coords.lat
        centerLng = coords.lon
      }
    }

    if (centerLat === undefined || centerLng === undefined) {
      const coords = getCoordinatesForLocation(profile?.location)
      if (coords) {
        centerLat = coords.lat
        centerLng = coords.lon
      } else {
        centerLat = 52.52
        centerLng = 13.405
      }
    }

    return cardsList.filter((card) => {
      // 1. Location text filter
      if (filters.locationQuery.trim()) {
        const query = filters.locationQuery.trim().toLowerCase()
        const loc = (card.location ?? '').toLowerCase()
        if (!loc.includes(query) && filters.centerLat === undefined) return false
      }

      // 2. Distance radius filter in kilometers
      if (filters.radius < 500 && centerLat !== undefined && centerLng !== undefined) {
        let cardLat = card.latitude
        let cardLng = card.longitude

        if (cardLat === undefined || cardLng === undefined) {
          const coords = getCoordinatesForLocation(card.location)
          if (coords) {
            cardLat = coords.lat
            cardLng = coords.lon
          }
        }

        if (cardLat !== undefined && cardLng !== undefined) {
          const distance = getDistanceKm(centerLat, centerLng, cardLat, cardLng)
          if (distance > filters.radius) return false
        } else {
          return false
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
  }, [cardsList, filters, profile?.location])

  // El auto-reinicio y contador de 5 minutos se activa UNICAMENTE si el usuario se queda sin opciones tras evaluarlas
  useEffect(() => {
    if (!hasExhaustedCards) {
      setAutoResetCountdown(EMPTY_RESET_SECONDS)
      return
    }

    const timer = setInterval(() => {
      setAutoResetCountdown((prev) => {
        if (prev <= 1) {
          performAutoReset()
          return EMPTY_RESET_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasExhaustedCards, performAutoReset])

  const handleDecision = (liked: boolean) => {
    if (filteredRecommendations.length === 0) return
    const currentCard = filteredRecommendations[currentIndex % filteredRecommendations.length]
    if (currentCard) {
      if (liked) {
        if (onConnectProfile) {
          onConnectProfile(currentCard)
        }
      } else if (currentCard.id) {
        api.interactions.pass(currentCard.id).catch(() => { })
      }
    }

    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)

    // Solo cuando se hayan recorrido todas las tarjetas activamente se agotan las opciones
    if (nextIndex >= filteredRecommendations.length && filteredRecommendations.length > 0) {
      setHasExhaustedCards(true)
    }
  }

  const handleResetFilters = () => {
    const profileCoords = getCoordinatesForLocation(profile?.location)
    setFilters({
      locationQuery: '',
      centerLat: profileCoords?.lat,
      centerLng: profileCoords?.lon,
      selectedCategories: [],
      selectedGenres: [],
      radius: 500,
    })
    setCurrentIndex(0)
    setHasExhaustedCards(false)
    setAutoResetCountdown(EMPTY_RESET_SECONDS)
  }

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
        unreadMessagesCount={unreadMessagesCount}
      />

      <main className={`ls-layout ls-discovery-swipe-layout ${!showFilters ? 'filters-hidden' : ''}`}>
        <section className="ls-discovery-panel">
          <div className="ls-discovery-top-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="ls-discovery-status-pill">
                <PiUsersBold /> {filteredRecommendations.length} {filteredRecommendations.length === 1 ? 'perfil en radar' : 'perfiles en radar'}
              </span>

              <button
                type="button"
                className={`ls-discovery-filter-toggle-btn ${showFilters ? 'is-active' : ''}`}
                onClick={() => setShowFilters((prev) => !prev)}
                title={showFilters ? 'Ocultar filtros del radar' : 'Mostrar filtros del radar'}
              >
                <PiSlidersHorizontalBold />
                <span>{showFilters ? 'Ocultar filtros' : 'Filtros'}</span>
              </button>
            </div>

            {hasExhaustedCards && (
              <span className="ls-discovery-auto-status">
                <PiArrowsClockwiseBold className={isResettingDeck ? 'ls-spin-fast' : ''} />
                <span>
                  {isResettingDeck
                    ? 'Recargando perfiles...'
                    : `Auto-reinicio: ${formatTimer(autoResetCountdown)}`}
                </span>
              </span>
            )}
          </div>

          <div className="ls-swipe-stage">
            <SwipeCardStack
              cards={filteredRecommendations}
              currentIndex={currentIndex}
              onDecision={handleDecision}
              onPreviewProfile={(p) => setPreviewProfile(p)}
              onReport={(name) => setReportingTarget(name)}
              onResetFilters={handleResetFilters}
              autoResetCountdown={autoResetCountdown}
              isResettingDeck={isResettingDeck}
              hasExhaustedCards={hasExhaustedCards}
              isLoading={isLoadingCards}
            />
          </div>
        </section>

        {showFilters && (
          <aside className="ls-sidebar">
            <RadarFilters
              filters={filters}
              onChangeFilters={(newFilters) => {
                setFilters(newFilters)
                setCurrentIndex(0)
                setHasExhaustedCards(false)
                setAutoResetCountdown(EMPTY_RESET_SECONDS)
              }}
              onReset={handleResetFilters}
            />
          </aside>
        )}
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

