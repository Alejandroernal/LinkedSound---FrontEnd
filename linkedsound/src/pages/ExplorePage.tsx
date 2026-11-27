import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import { api } from '../services/api'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ReportModal from '../components/ReportModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import CreateEventModal from '../components/CreateEventModal'
import DeleteEventModal from '../components/DeleteEventModal'
import RejectMatchModal from '../components/RejectMatchModal'
import GenreFilterPopover from '../components/GenreFilterPopover'
import {
  PiFlagBold,
  PiTrashBold,
  PiSoundcloudLogoFill,
  PiCalendarPlusBold,
  PiMagnifyingGlassBold,
  PiArrowClockwiseBold,
  PiCompassBold,
  PiFunnelBold,
  PiArrowsDownUpBold,
  PiSquaresFourBold,
  PiUsersBold,
  PiTicketBold,
  PiCalendarBold,
  PiMapPinBold,
  PiXBold,
  PiPencilSimpleBold,
  PiUserCircleBold,
  PiCaretDownBold,
  PiCheckCircleBold,
  PiWarningOctagonBold,
} from 'react-icons/pi'
import type { ProfileCard } from '../data/mockData'
import { type AppPage, type Profile, type UserProfile, type EventItem, type NotificationItem, formatEventDate, isUserProfile } from '../types'
import { computeUserAffinity } from '../utils/affinity'
import { getProfileAvatarUrl, handleAvatarError } from '../utils/avatar'

type ExploreSortBy = 'match' | 'name' | 'role' | 'dateAsc' | 'dateDesc' | 'recent'

function getEventTimestamp(eventDate?: string, eventTime?: string): number {
  if (!eventDate) return Number.MAX_SAFE_INTEGER
  const dateParts = String(eventDate).trim().split('T')[0].split('-').map(Number)
  if (dateParts.length !== 3 || dateParts.some((n) => Number.isNaN(n))) {
    const parsed = Date.parse(eventDate)
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
  }
  const [year, month, day] = dateParts
  const timeParts = String(eventTime || '00:00').trim().split(':').map(Number)
  const hours = Number.isFinite(timeParts[0]) ? timeParts[0] : 0
  const minutes = Number.isFinite(timeParts[1]) ? timeParts[1] : 0
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime()
}

function isEventPast(eventDate?: string, eventTime?: string, isFinished?: boolean): boolean {
  if (isFinished) return true
  if (!eventDate) return false
  const dateParts = String(eventDate).trim().split('T')[0].split('-').map(Number)
  if (dateParts.length !== 3 || dateParts.some((n) => Number.isNaN(n))) return false
  const [year, month, day] = dateParts
  const timeParts = String(eventTime || '23:59').trim().split(':').map(Number)
  const hours = Number.isFinite(timeParts[0]) ? timeParts[0] : 23
  const minutes = Number.isFinite(timeParts[1]) ? timeParts[1] : 59
  const eventEnd = new Date(year, month - 1, day, hours, minutes, 59, 999).getTime()
  return eventEnd < Date.now()
}

type ExplorePageProps = {
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
  onAcceptMatch?: (notification: NotificationItem) => void
  onOpenMatchChat?: (notification: NotificationItem) => void
  onNotificationClick?: (notification: NotificationItem) => void
}

export default function ExplorePage({
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
  onAcceptMatch,
  onOpenMatchChat,
  onNotificationClick,
}: ExplorePageProps) {
  const location = useLocation()
  const handledNotifTsRef = useRef<number | null>(null)
  const [cardsList, setCardsList] = useState<ProfileCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = () => {
    setIsLoading(true)
    Promise.all([api.auth.getUsers(), api.events.getAll({ onlyActive: true })]).then(([usersRes, eventsRes]) => {
      const combinedCards: ProfileCard[] = []

      // 1. Cargar usuarios de la base de datos
      if (usersRes.success && Array.isArray(usersRes.users)) {
        const userCards: ProfileCard[] = usersRes.users
          .filter((u: any) => u.role !== 'Administrador')
          .map((u: any) => {
            const affinity = computeUserAffinity(profile, u)
            return {
              id: u.id,
              firstName: u.firstName || '',
              lastName: u.lastName || '',
              nickname: u.nickname || `${u.firstName} ${u.lastName}`.trim(),
              role: u.role || 'Artista',
              location: u.location || 'No especificada',
              country: u.country || '',
              province: u.province || '',
              city: u.city || '',
              streetAddress: u.streetAddress || '',
              latitude: u.latitude,
              longitude: u.longitude,
              description: u.description || '',
              interestGenres: u.interestGenres || [],
              tags: u.interestGenres || [],
              soundcloudUrl: u.soundcloudUrl || '',
              soundcloudHandle: u.soundcloudHandle || '',
              spotifyUrl: u.spotifyUrl || '',
              profileImage: getProfileAvatarUrl(u.profileImage),
              match: affinity.percentageFormatted,
              commonGenres: affinity.commonGenres,
              affinityReason: affinity.summary,
              isProfile: true,
              itemRole: 'Perfil',
              badge: u.role === 'Productor' ? 'Producer' : 'Artist',
              tracks: Array.isArray(u.tracks) ? u.tracks : [],
            }
          })
        combinedCards.push(...userCards)
      }

      // 2. Cargar solo eventos vigentes y activos de la base de datos (excluir pasados, En revision y Ocultos)
      if (eventsRes.success && Array.isArray(eventsRes.events)) {
        const eventCards: ProfileCard[] = eventsRes.events
          .filter((ev: any) => ev.status === 'Active' && !isEventPast(ev.eventDate, ev.eventTime, ev.isFinished))
          .map((ev: any) => ({
          id: ev.id,
          title: ev.title || ev.nickname,
          nickname: ev.nickname || ev.title,
          role: ev.role || 'Evento Live',
          location: ev.location || 'No especificada',
          country: ev.country || '',
          province: ev.province || '',
          city: ev.city || '',
          streetAddress: ev.streetAddress || '',
          latitude: ev.latitude,
          longitude: ev.longitude,
          interestGenres: ev.interestGenres || [],
          tags: ev.interestGenres || [],
          profileImage: ev.profileImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
          images: Array.isArray(ev.images) && ev.images.length > 0 ? ev.images : (ev.profileImage ? [ev.profileImage] : []),
          match: '100%',
          description: ev.description || '',
          badge: 'Evento',
          itemRole: 'Evento',
          isProfile: false,
          eventDate: ev.eventDate,
          eventTime: ev.eventTime || '22:00',
          venue: ev.venue || 'Venue Principal',
          ticketUrl: ev.ticketUrl || 'https://linkedsound.app/tickets',
          isFinished: ev.isFinished,
          soundcloudUrl: ev.soundcloudUrl || '',
          spotifyUrl: ev.spotifyUrl || '',
          tracks: ev.tracks || [],
          comments: Array.isArray(ev.comments) ? ev.comments : [],
          owner: ev.owner || ev.ownerNickname || 'Organizador',
          ownerId: ev.ownerId,
          ownerNickname: ev.ownerNickname || '',
          createdAt: ev.createdAt,
          updatedAt: ev.updatedAt,
        }))
        combinedCards.push(...eventCards)
      }

      setCardsList(combinedCards)
    }).catch((err) => {
      console.error('Error al cargar datos en ExplorePage:', err)
    }).finally(() => {
      setIsLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [activeGenre, setActiveGenre] = useState('')
  const [itemRoleFilter, setItemRoleFilter] = useState<'Todos' | 'Perfil' | 'Evento'>('Todos')
  const [sortBy, setSortBy] = useState<ExploreSortBy>('match')
  const [isGenreFilterOpen, setIsGenreFilterOpen] = useState(false)

  const handleItemRoleFilterChange = (nextFilter: 'Todos' | 'Perfil' | 'Evento') => {
    setItemRoleFilter(nextFilter)
    if (nextFilter === 'Evento') {
      setSortBy((prev) => (['dateAsc', 'dateDesc', 'recent', 'name'].includes(prev) ? prev : 'dateAsc'))
    } else if (nextFilter === 'Perfil') {
      setSortBy((prev) => (['match', 'name', 'role'].includes(prev) ? prev : 'match'))
    } else {
      setSortBy((prev) => (['match', 'name'].includes(prev) ? prev : 'match'))
    }
  }

  // Deep-link desde notificaciones de eventos
  useEffect(() => {
    const state = location.state as { filterTab?: 'Todos' | 'Perfil' | 'Evento'; focusEventTitle?: string; notifTs?: number } | null
    if (!state || !state.notifTs || handledNotifTsRef.current === state.notifTs) return

    if (state.filterTab) {
      handleItemRoleFilterChange(state.filterTab)
    }

    if (!isLoading) {
      handledNotifTsRef.current = state.notifTs
      if (state.focusEventTitle) {
        const needle = state.focusEventTitle.toLowerCase().trim()
        const target = cardsList.find((c) => {
          if (isUserProfile(c)) return false
          const t1 = (c.nickname || '').toLowerCase()
          const t2 = (c.title || '').toLowerCase()
          return (
            t1 === needle ||
            t2 === needle ||
            (t1 && (t1.includes(needle) || needle.includes(t1))) ||
            (t2 && (t2.includes(needle) || needle.includes(t2)))
          )
        })
        if (target) {
          setSelectedPreviewCard(target)
        }
      }
    }
  }, [location.state, isLoading, cardsList])
  const [reportingTarget, setReportingTarget] = useState<string | null>(null)
  const [rejectingTarget, setRejectingTarget] = useState<ProfileCard | null>(null)
  const [selectedPreviewCard, setSelectedPreviewCard] = useState<ProfileCard | null>(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ProfileCard | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<ProfileCard | null>(null)
  const [eventFeedbackModal, setEventFeedbackModal] = useState<{
    title: string
    message: string
    variant: 'info' | 'error'
  } | null>(null)

  const handleCreateEvent = async (newEvent: ProfileCard) => {
    try {
      const eventItem = newEvent as Partial<EventItem>
      const fallbackOwner = profile
        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.nickname || 'Organizador'
        : 'Organizador'

      const eventImages = Array.isArray(eventItem.images) && eventItem.images.length > 0
        ? eventItem.images
        : (newEvent.profileImage ? [newEvent.profileImage] : [])

      const res = await api.events.create({
        ownerId: profile?.id,
        ownerEmail: profile?.email,
        ownerNickname: profile?.nickname,
        title: newEvent.nickname,
        nickname: newEvent.nickname,
        role: newEvent.role,
        eventDate: eventItem.eventDate || '',
        eventTime: eventItem.eventTime || '22:00',
        venue: eventItem.venue || 'Venue Principal',
        ticketUrl: eventItem.ticketUrl ? eventItem.ticketUrl.trim() : null,
        location: newEvent.location,
        country: newEvent.country,
        province: newEvent.province,
        city: newEvent.city,
        streetAddress: newEvent.streetAddress,
        latitude: newEvent.latitude,
        longitude: newEvent.longitude,
        interestGenres: newEvent.interestGenres,
        description: newEvent.description,
        profileImage: newEvent.profileImage,
        images: eventImages,
      })

      if (res.success && res.event) {
        if (res.event.status === 'Active') {
          const ownerName = res.event.owner
            ? (typeof res.event.owner === 'string'
                ? res.event.owner
                : `${res.event.owner.firstName || ''} ${res.event.owner.lastName || ''}`.trim() || res.event.owner.nickname)
            : fallbackOwner
          const created: ProfileCard = {
            ...newEvent,
            id: res.event.id,
            createdAt: res.event.createdAt,
            ownerId: res.event.ownerId || profile?.id,
            owner: ownerName,
            ownerNickname: res.event.ownerNickname || res.event.owner?.nickname || profile?.nickname || '',
            profileImage: res.event.profileImage || newEvent.profileImage,
            images: res.event.images || eventImages,
            role: res.event.role || newEvent.role || 'Evento Live',
            eventDate: res.event.eventDate || eventItem.eventDate || '',
            eventTime: res.event.eventTime || eventItem.eventTime || '22:00',
            interestGenres: res.event.interestGenres || newEvent.interestGenres || [],
            location: res.event.location || newEvent.location || '',
            country: res.event.country ?? newEvent.country,
            province: res.event.province ?? newEvent.province,
            city: res.event.city ?? newEvent.city,
            streetAddress: res.event.streetAddress ?? newEvent.streetAddress,
            latitude: res.event.latitude ?? newEvent.latitude,
            longitude: res.event.longitude ?? newEvent.longitude,
            nickname: res.event.nickname || newEvent.nickname || '',
            itemRole: 'Evento',
            isProfile: false,
          }
          setCardsList((prev) => [created, ...prev])
        } else {
          setEventFeedbackModal({
            title: 'Evento enviado a revisión',
            message: `Tu evento "${res.event.title || newEvent.nickname}" fue registrado en estado "En revisión". Será visible en Explorer una vez que un administrador lo apruebe.`,
            variant: 'info',
          })
        }
      } else {
        setEventFeedbackModal({
          title: 'No se pudo publicar el evento',
          message: res.message || 'Ocurrió un error al registrar el evento en el servidor.',
          variant: 'error',
        })
      }
    } catch (err: any) {
      setEventFeedbackModal({
        title: 'Error de conexión',
        message: err?.message || 'No se pudo conectar con el servidor para publicar el evento.',
        variant: 'error',
      })
    }
  }

  const handleUpdateEvent = async (updatedEvent: ProfileCard) => {
    if (!updatedEvent.id) return
    try {
      const eventItem = updatedEvent as Partial<EventItem>
      const eventImages = Array.isArray(eventItem.images) && eventItem.images.length > 0
        ? eventItem.images
        : (updatedEvent.profileImage ? [updatedEvent.profileImage] : [])

      const res = await api.events.update(updatedEvent.id, {
        ownerId: profile?.id,
        title: updatedEvent.nickname,
        nickname: updatedEvent.nickname,
        role: updatedEvent.role,
        eventDate: eventItem.eventDate,
        eventTime: eventItem.eventTime,
        venue: eventItem.venue,
        ticketUrl: eventItem.ticketUrl ? eventItem.ticketUrl.trim() : null,
        location: updatedEvent.location,
        country: updatedEvent.country,
        province: updatedEvent.province,
        city: updatedEvent.city,
        streetAddress: updatedEvent.streetAddress,
        latitude: updatedEvent.latitude,
        longitude: updatedEvent.longitude,
        interestGenres: updatedEvent.interestGenres,
        description: updatedEvent.description,
        profileImage: updatedEvent.profileImage,
        images: eventImages,
      })

      if (res.success && res.event) {
        setCardsList((prev) =>
          prev.map((c) =>
            c.id === updatedEvent.id
              ? ({
                  ...c,
                  ...updatedEvent,
                  role: res.event.role || updatedEvent.role,
                  eventDate: res.event.eventDate || eventItem.eventDate,
                  eventTime: res.event.eventTime || eventItem.eventTime,
                  location: res.event.location || updatedEvent.location,
                  country: res.event.country ?? updatedEvent.country,
                  province: res.event.province ?? updatedEvent.province,
                  city: res.event.city ?? updatedEvent.city,
                  streetAddress: res.event.streetAddress ?? updatedEvent.streetAddress,
                  latitude: res.event.latitude ?? updatedEvent.latitude,
                  longitude: res.event.longitude ?? updatedEvent.longitude,
                  interestGenres: res.event.interestGenres || updatedEvent.interestGenres,
                  profileImage: res.event.profileImage || updatedEvent.profileImage,
                  images: res.event.images || eventImages,
                  updatedAt: res.event.updatedAt,
                } as ProfileCard)
              : c
          )
        )
      }
    } catch (err) {
      console.error('Error al actualizar el evento:', err)
    } finally {
      setEditingEvent(null)
    }
  }

  const handleConfirmReject = (cardToReject: ProfileCard) => {
    setCardsList((prev) => prev.filter((c) => (c.id ? c.id !== cardToReject.id : c.nickname !== cardToReject.nickname)))
  }

  const handleDeleteEvent = async (eventToDelete: ProfileCard) => {
    if (!eventToDelete.id) return
    try {
      const res = await api.events.delete(eventToDelete.id, {
        ownerId: profile?.id,
      })
      if (res.success) {
        setCardsList((prev) => prev.filter((c) => c.id !== eventToDelete.id))
      }
    } catch (err) {
      console.error('Error al eliminar el evento:', err)
    } finally {
      setDeletingEvent(null)
    }
  }

  const filteredCards = useMemo(() => {
    let result = cardsList.filter((card) => {
      const cardItemRole = card.itemRole ?? (card.isProfile !== false ? 'Perfil' : 'Evento')
      if (itemRoleFilter !== 'Todos' && cardItemRole !== itemRoleFilter) {
        return false
      }

      const cardTags = card.interestGenres ?? card.tags ?? []
      const cardName = card.nickname ?? ''
      const cardBio = card.description ?? ''

      // Filter by genre
      if (activeGenre) {
        const matchesTag = cardTags.some(
          (t) => t.toLowerCase() === activeGenre.toLowerCase()
        )
        const matchesRole = card.role ? card.role.toLowerCase().includes(activeGenre.toLowerCase()) : false
        if (!matchesTag && !matchesRole) return false
      }

      // Filter by search text
      const query = debouncedSearchQuery.trim().toLowerCase()
      if (!query) return true

      const inName = cardName.toLowerCase().includes(query)
      const inRole = card.role ? card.role.toLowerCase().includes(query) : false
      const inLocation = card.location?.toLowerCase().includes(query) ?? false
      const inDesc = cardBio.toLowerCase().includes(query)
      const inBadge = (card.badge ?? '').toLowerCase().includes(query)
      const inTags = cardTags.some((t) => t.toLowerCase().includes(query))
      const cardVenue = ((card as any).venue ?? '').toLowerCase()
      const cardClub = ((card as any).club ?? (card as any).place ?? (card as any).locationName ?? (card as any).location ?? '').toLowerCase()
      const inVenue = cardVenue.includes(query) || cardClub.includes(query) || (query.includes('club') && (Boolean((card as any).venue) || Boolean((card as any).club) || cardItemRole === 'Evento'))
      const inCity = 'city' in card ? Boolean((card as any).city?.toLowerCase().includes(query)) : false
      const inAddress = 'streetAddress' in card ? Boolean((card as any).streetAddress?.toLowerCase().includes(query)) : false

      return inName || inRole || inLocation || inDesc || inBadge || inTags || inVenue || inCity || inAddress
    })

    if (sortBy === 'dateAsc') {
      result = [...result].sort((a, b) => {
        const tsA = !isUserProfile(a) ? getEventTimestamp(a.eventDate, a.eventTime) : Number.MAX_SAFE_INTEGER
        const tsB = !isUserProfile(b) ? getEventTimestamp(b.eventDate, b.eventTime) : Number.MAX_SAFE_INTEGER
        return tsA - tsB
      })
    } else if (sortBy === 'dateDesc') {
      result = [...result].sort((a, b) => {
        const tsA = !isUserProfile(a) ? getEventTimestamp(a.eventDate, a.eventTime) : 0
        const tsB = !isUserProfile(b) ? getEventTimestamp(b.eventDate, b.eventTime) : 0
        return tsB - tsA
      })
    } else if (sortBy === 'recent') {
      result = [...result].sort((a, b) => {
        const cA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const cB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        if (cB !== cA) return cB - cA
        const tsA = !isUserProfile(a) ? getEventTimestamp(a.eventDate, a.eventTime) : Number.MAX_SAFE_INTEGER
        const tsB = !isUserProfile(b) ? getEventTimestamp(b.eventDate, b.eventTime) : Number.MAX_SAFE_INTEGER
        return tsA - tsB
      })
    } else if (sortBy === 'name') {
      result = [...result].sort((a, b) => (a.nickname ?? '').localeCompare(b.nickname ?? ''))
    } else if (sortBy === 'role') {
      result = [...result].sort((a, b) => (a.role ?? '').localeCompare(b.role ?? ''))
    } else if (sortBy === 'match') {
      result = [...result].sort((a, b) => {
        const matchA = parseInt(a.match?.replace('%', '') || '0', 10)
        const matchB = parseInt(b.match?.replace('%', '') || '0', 10)
        if (matchB !== matchA) return matchB - matchA
        if (!isUserProfile(a) && !isUserProfile(b)) {
          return getEventTimestamp(a.eventDate, a.eventTime) - getEventTimestamp(b.eventDate, b.eventTime)
        }
        return 0
      })
    }

    return result
  }, [cardsList, debouncedSearchQuery, activeGenre, itemRoleFilter, sortBy])

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
        onAcceptMatch={onAcceptMatch}
        onOpenMatchChat={onOpenMatchChat}
        onNotificationClick={onNotificationClick}
      />

      <main className="ls-page-content">
        <section className="ls-panel ls-page-panel">
          <div className="ls-panel-header ls-explore-header-redesigned">
            {/* Fila Superior: Título con Icono + Badge Verde */}
            <div className="ls-explore-title-row">
              <div className="ls-explore-title-with-icon">
                <div className="ls-explore-title-badge-icon">
                  <PiCompassBold />
                </div>
                <div className="ls-explore-title-text-group">
                  <h3 className="ls-explore-main-title">
                    <span className="ls-title-desktop">El punto de encuentro para la música: explora perfiles, encuentra tu match y vive shows</span>
                    <span className="ls-title-mobile">Explora la comunidad musical</span>
                  </h3>
                  <span className="ls-explore-subtitle ls-explore-subtitle-row">
                    <span className="ls-live-status-dot" />
                    Descubre la red global • {isLoading ? 'Cargando publicaciones...' : `${filteredCards.length} ${filteredCards.length === 1 ? 'publicación' : 'publicaciones'}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Fila de Herramientas: Búsqueda (izq) + Funcionalidades Iconicas (der) */}
            <div className="ls-explore-toolbar-clean">
              {/* Campo de búsqueda principal */}
              <div className="ls-explore-search-wrapper">
                <PiMagnifyingGlassBold className="ls-explore-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, género, rol, club o ciudad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ls-explore-search-input-styled"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="ls-search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="Limpiar texto de búsqueda"
                  >
                    <PiXBold />
                  </button>
                )}
              </div>

              {/* Grupo unificado de funcionalidades (Derecha) */}
              <div className="ls-explore-functionalities-group">
                {/* 1. Selector de Tipo + Botón de Limpiar inmediatamente contiguo */}
                <div className="ls-explore-type-and-reset-group">
                  {/* Selector en Desktop (Tabs icónicas) */}
                  <div className="ls-explore-desktop-tabs">
                    <div className="ls-explore-icon-tabs" title="Filtrar tipo de contenido">
                      <button
                        type="button"
                        className={`ls-icon-tab-btn ${itemRoleFilter === 'Todos' ? 'is-active' : ''}`}
                        onClick={() => handleItemRoleFilterChange('Todos')}
                        title="Todos los contenidos"
                      >
                        <PiSquaresFourBold />
                      </button>
                      <button
                        type="button"
                        className={`ls-icon-tab-btn ${itemRoleFilter === 'Perfil' ? 'is-active' : ''}`}
                        onClick={() => handleItemRoleFilterChange('Perfil')}
                        title="Solo Perfiles"
                      >
                        <PiUsersBold />
                      </button>
                      <button
                        type="button"
                        className={`ls-icon-tab-btn ${itemRoleFilter === 'Evento' ? 'is-active' : ''}`}
                        onClick={() => handleItemRoleFilterChange('Evento')}
                        title="Solo Eventos"
                      >
                        <PiTicketBold />
                      </button>
                    </div>
                  </div>

                  {/* Selector agrupado para Móvil y Tablet */}
                  <div className="ls-explore-mobile-type-select-wrap">
                    <select
                      value={itemRoleFilter}
                      onChange={(e) => handleItemRoleFilterChange(e.target.value as 'Todos' | 'Perfil' | 'Evento')}
                      className="ls-explore-mobile-type-select"
                      title="Filtrar tipo de contenido"
                    >
                      <option value="Todos">Ver: Todos</option>
                      <option value="Perfil">Ver: Perfiles</option>
                      <option value="Evento">Ver: Eventos</option>
                    </select>
                    <PiCaretDownBold className="ls-mobile-select-caret" />
                  </div>

                  {/* Botón Reset / Limpiar inmediatamente al lado del filtro de Perfiles/Eventos */}
                  {(searchQuery || activeGenre || itemRoleFilter !== 'Todos') && (
                    <button
                      type="button"
                      className="ls-explore-reset-btn-icon"
                      onClick={() => {
                        setSearchQuery('')
                        setActiveGenre('')
                        handleItemRoleFilterChange('Todos')
                      }}
                      title="Limpiar filtros y búsqueda"
                    >
                      <PiArrowClockwiseBold />
                    </button>
                  )}
                </div>

                {/* Cluster de acciones y herramientas agrupadas */}
                <div className="ls-explore-actions-cluster">
                  {/* 2. Botón Filtro por Género */}
                  <button
                    type="button"
                    className={`ls-icon-func-btn ${activeGenre || isGenreFilterOpen ? 'is-active' : ''}`}
                    onClick={() => setIsGenreFilterOpen(!isGenreFilterOpen)}
                    title={activeGenre ? `Filtrando por: ${activeGenre}` : 'Filtrar por género musical'}
                  >
                    <PiFunnelBold />
                    {activeGenre && <span className="ls-icon-active-dot" />}
                  </button>

                  {/* 3. Selector de Ordenamiento Contextual segun filtro activo */}
                  <div className="ls-sort-icon-select-wrap">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as ExploreSortBy)}
                      className="ls-explore-sort-select-icononly"
                      title="Ordenar publicaciones"
                    >
                      {itemRoleFilter === 'Evento' ? (
                        <>
                          <option value="dateAsc">Fecha: Más próximos primero</option>
                          <option value="dateDesc">Fecha: Más lejanos primero</option>
                          <option value="recent">Más recientes (publicación)</option>
                          <option value="name">Nombre (A - Z)</option>
                        </>
                      ) : itemRoleFilter === 'Perfil' ? (
                        <>
                          <option value="match">Mayor Match %</option>
                          <option value="name">Nombre (A - Z)</option>
                          <option value="role">Rol / Tipo</option>
                        </>
                      ) : (
                        <>
                          <option value="match">Mayor Match %</option>
                          <option value="name">Nombre (A - Z)</option>
                        </>
                      )}
                    </select>
                    <PiArrowsDownUpBold className="ls-sort-select-icon" />
                  </div>

                  {/* 4. Boton Publicar Evento (Icono destacado) */}
                  <button
                    type="button"
                    className="ls-create-event-icon-btn"
                    onClick={() => setShowCreateEventModal(true)}
                    title="Publicar nuevo evento musical"
                  >
                    <PiCalendarPlusBold />
                  </button>
                </div>
              </div>
            </div>

            {/* Panel de Filtro por Género Incorporado (Inline Panel) */}
            <GenreFilterPopover
              isOpen={isGenreFilterOpen}
              onClose={() => setIsGenreFilterOpen(false)}
              currentGenre={activeGenre}
              onSelectGenre={(genre) => {
                setActiveGenre(genre)
              }}
            />
          </div>


          <div className="ls-card-grid">
            {isLoading ? (
              <div className="ls-explore-loading-state">
                <div className="ls-explore-spinner-container">
                  <div className="ls-explore-spinner-ring" />
                  <div className="ls-explore-spinner-icon">
                    <PiCompassBold />
                  </div>
                </div>
                <h4 className="ls-explore-loading-title">Cargando creadores y eventos...</h4>
                <p className="ls-explore-loading-desc">
                  Sintonizando la red de talentos de LinkedSound
                </p>
              </div>
            ) : filteredCards.length > 0 ? (
              filteredCards.map((card, idx) => {
                const isProfile = isUserProfile(card)
                const profileCard = isProfile ? (card as UserProfile) : null
                const eventCard = !isProfile ? (card as EventItem) : null
                const cardKey = card.id ? card.id : `${card.nickname ?? 'card'}-${idx}`
                const firstName = profileCard?.firstName ?? ''
                const lastName = profileCard?.lastName ?? ''
                const fullName = [firstName, lastName].filter(Boolean).join(' ')
                const cardDisplayTitle = card.nickname?.trim() || (isProfile ? (fullName || 'Creador') : (eventCard?.title?.trim() || 'Evento'))

                const hasSoundCloud = isProfile && Boolean(
                  profileCard?.soundcloudUrl?.trim() ||
                  profileCard?.soundcloud?.trim() ||
                  profileCard?.soundcloudHandle?.trim() ||
                  (profileCard?.tracks && profileCard.tracks.length > 0)
                )

                const MAX_DESC_CHARS_PROFILE = 160
                const MAX_DESC_CHARS_EVENT = 120

                let rawDesc = card.description?.trim() || ''

                if (!rawDesc) {
                  rawDesc = isProfile
                    ? 'Perfil musical en LinkedSound.'
                    : 'Evento musical destacado en LinkedSound.'
                }

                const maxChars = isProfile ? MAX_DESC_CHARS_PROFILE : MAX_DESC_CHARS_EVENT
                const displayDesc = rawDesc.length > maxChars
                  ? `${rawDesc.slice(0, maxChars).trim()}...`
                  : rawDesc

                return (
                  <article
                    key={cardKey}
                    className={`ls-recommend-card ls-clickable-card ${isProfile ? 'is-profile-card' : 'is-event-card'} ${isProfile && hasSoundCloud ? 'has-soundcloud' : ''}`}
                    onClick={() => setSelectedPreviewCard(card)}
                    title={
                      isProfile
                        ? (hasSoundCloud
                            ? `Haz clic para ver los trabajos en SoundCloud de ${cardDisplayTitle}`
                            : `Ver perfil de ${cardDisplayTitle}`)
                        : `Ver detalles de ${cardDisplayTitle}`
                    }
                  >
                    <div className="ls-card-visual">
                      <img
                        src={isProfile ? getProfileAvatarUrl(card.profileImage) : card.profileImage}
                        alt={cardDisplayTitle}
                        onError={isProfile ? handleAvatarError : undefined}
                      />
                      <span className="ls-card-badge" title={isProfile ? (card.role ?? 'Perfil').toUpperCase() : 'EVENTO'}>
                        {isProfile ? (card.role ?? 'Perfil').toUpperCase() : 'EVENTO'}
                      </span>
                      {isProfile ? (
                        hasSoundCloud && (
                          <span className="ls-sc-card-indicator" title="SoundCloud vinculado">
                            <PiSoundcloudLogoFill /> SoundCloud
                          </span>
                        )
                      ) : (
                        <span
                          className={`ls-sc-card-indicator ${card.isFinished ? 'is-finished' : 'is-active-event'}`}
                        >
                          {card.isFinished ? 'Finalizado' : 'Vigente'}
                        </span>
                      )}
                    </div>
                    <div className="ls-card-body">
                      <div className="ls-card-head">
                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <h3
                            title={cardDisplayTitle}
                            style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                          >
                            {cardDisplayTitle}
                          </h3>
                          {isProfile && fullName && card.nickname && fullName.toLowerCase() !== card.nickname.toLowerCase() && (
                            <span className="ls-card-fullname-pill" title={fullName}>
                              {fullName}
                            </span>
                          )}
                          {!isProfile && (
                            <div
                              className="ls-event-owner-chip"
                              title={`Creado por: ${card.owner || card.ownerNickname || 'Organizador'}`}
                            >
                              <PiUserCircleBold style={{ fontSize: '0.92rem', flexShrink: 0, color: '#00e5ff' }} />
                              <span className="ls-event-owner-chip-text">
                                Creado por: <strong>{card.owner || card.ownerNickname || 'Organizador'}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="ls-match-tag" style={{ flexShrink: 0 }}>{card.match} match</span>
                      </div>
                      {!isProfile && (
                        <p className="ls-card-role">
                          {card.role} {card.location && `• ${card.location}`}
                        </p>
                      )}

                      {/* En eventos: Caja de Fecha, Hora y Venue */}
                      {!isProfile && card.eventDate && (
                        <div className="ls-card-event-info-box">
                          <div className="ls-card-event-date-row">
                            <PiCalendarBold className="ls-card-event-icon" />
                            <span>{formatEventDate(card.eventDate)}</span>
                            {card.eventTime && <span className="ls-card-event-time-text">• {card.eventTime} hs</span>}
                          </div>
                          {card.venue && (
                            <div className="ls-card-event-venue-row">
                              <PiMapPinBold className="ls-card-event-icon" />
                              <span className="ls-card-event-venue-text">
                                {card.venue}
                                {[card.streetAddress, card.city, card.province, card.country].filter(Boolean).length > 0 &&
                                  ` (${[card.streetAddress, card.city, card.province, card.country].filter(Boolean).join(', ')})`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {isProfile && (
                        <p className="ls-card-desc is-profile-desc">{displayDesc}</p>
                      )}
                      <div className="ls-card-footer-row">
                        {(card.interestGenres ?? card.tags ?? []).slice(0, 3).length > 0 ? (
                          <div className="ls-mini-tags ls-card-mini-tags-wrap">
                            {(card.interestGenres ?? card.tags ?? [])
                              .slice(0, 3)
                              .map((tag) => (
                                <span key={tag} title={tag}>{tag}</span>
                              ))}
                          </div>
                        ) : (
                          <div className="ls-card-tags-spacer" />
                        )}

                        <div className="ls-card-action-group">
                          {!isProfile && (() => {
                            const isOwner = Boolean(
                              isAdminSession ||
                              (profile?.id && card.ownerId && card.ownerId === profile.id) ||
                              (profile?.nickname && card.ownerNickname && card.ownerNickname.toLowerCase() === profile.nickname.toLowerCase()) ||
                              (profile?.nickname && card.owner && card.owner.toLowerCase() === profile.nickname.toLowerCase())
                            )
                            if (!isOwner) return null

                            const createdAtTime = card.createdAt ? new Date(card.createdAt).getTime() : null
                            const isExpired = createdAtTime ? (Date.now() - createdAtTime) > 24 * 60 * 60 * 1000 : false
                            const remainingHours = createdAtTime ? Math.max(0, 24 - (Date.now() - createdAtTime) / (1000 * 60 * 60)) : 24

                            return (
                              <>
                                <button
                                  type="button"
                                  className="ls-card-btn-action edit"
                                  disabled={isExpired}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isExpired) return
                                    setEditingEvent(card)
                                    setShowCreateEventModal(true)
                                  }}
                                  title={isExpired ? 'Plazo de modificación expirado (+24hs transcurridas)' : `Editar Evento (${remainingHours.toFixed(1)}hs restantes)`}
                                >
                                  <PiPencilSimpleBold />
                                  <span>{isExpired ? 'Expirado' : 'Editar'}</span>
                                </button>

                                <button
                                  type="button"
                                  className="ls-card-btn-action delete"
                                  disabled={isExpired}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isExpired) return
                                    setDeletingEvent(card)
                                  }}
                                  title={isExpired ? 'Plazo de eliminación expirado (+24hs transcurridas)' : `Eliminar Evento (${remainingHours.toFixed(1)}hs restantes)`}
                                >
                                  <PiTrashBold />
                                  <span>Eliminar</span>
                                </button>
                              </>
                            )
                          })()}

                          {(() => {
                            const isOwnEvent = !isProfile && Boolean(
                              (profile?.id && card.ownerId && card.ownerId === profile.id) ||
                              (profile?.nickname && card.ownerNickname && card.ownerNickname.toLowerCase() === profile.nickname.toLowerCase()) ||
                              (profile?.nickname && card.owner && card.owner.toLowerCase() === profile.nickname.toLowerCase())
                            )

                            const isOwnProfile = isProfile && Boolean(
                              (profile?.id && card.id && card.id === profile.id) ||
                              (profile?.nickname && card.nickname && card.nickname.toLowerCase() === profile.nickname.toLowerCase())
                            )

                            // Un usuario no debe poder reportar su propio evento ni su propio perfil
                            if (isOwnEvent || isOwnProfile) return null

                            return (
                              <button
                                type="button"
                                className="ls-card-btn-action report"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReportingTarget(card.nickname ?? '')
                                }}
                                title={isProfile ? `Reportar Perfil ${card.nickname ?? ''}` : `Reportar Evento ${card.nickname ?? ''}`}
                              >
                                <PiFlagBold />
                                <span>Reportar</span>
                              </button>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="ls-empty-state">
                <h4>No creators found</h4>
                <p>
                  No profiles matching "{searchQuery || activeGenre}". Try a different genre, city, or artist name.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setActiveGenre('')
                  }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* SoundCloud Preview Modal for profiles and events */}
      <SoundCloudPreviewModal
        isOpen={Boolean(selectedPreviewCard)}
        card={selectedPreviewCard}
        onClose={() => setSelectedPreviewCard(null)}
        onConnectProfile={onConnectProfile}
        onDiscardProfile={(cardToDiscard) => setRejectingTarget(cardToDiscard)}
        onEditEvent={(cardToEdit) => {
          setSelectedPreviewCard(null)
          setEditingEvent(cardToEdit)
          setShowCreateEventModal(true)
        }}
        onDeleteEvent={(cardToDelete) => {
          setSelectedPreviewCard(null)
          setDeletingEvent(cardToDelete)
        }}
        currentUserId={profile?.id}
        currentUserNickname={profile?.nickname}
        isAdmin={isAdminSession}
      />

      {/* Modal de Confirmación para Eliminar Evento */}
      <DeleteEventModal
        isOpen={Boolean(deletingEvent)}
        event={deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirmDelete={handleDeleteEvent}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={Boolean(reportingTarget)}
        targetName={reportingTarget ?? ''}
        targetType="Objeto de Explorer"
        onClose={() => setReportingTarget(null)}
      />

      {/* Modal de Creación y Edición de Evento */}
      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => {
          setShowCreateEventModal(false)
          setEditingEvent(null)
        }}
        onCreateEvent={handleCreateEvent}
        onUpdateEvent={handleUpdateEvent}
        eventToEdit={editingEvent}
        userNickname={profile?.nickname || profile?.firstName || 'Creador LinkedSound'}
        userLocation={profile?.location || ''}
      />

      {/* Reject / Pass Match Modal */}
      <RejectMatchModal
        isOpen={Boolean(rejectingTarget)}
        targetName={rejectingTarget?.nickname ?? ''}
        onClose={() => setRejectingTarget(null)}
        onConfirmReject={() => {
          if (rejectingTarget) {
            handleConfirmReject(rejectingTarget)
          }
        }}
      />

      {/* Modal informativo de estado al publicar evento */}
      {eventFeedbackModal && (
        <div className="ls-modal-overlay" onClick={() => setEventFeedbackModal(null)}>
          <div
            className="ls-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '92%', textAlign: 'center', padding: '26px 22px' }}
          >
            <button
              type="button"
              className="ls-modal-close"
              onClick={() => setEventFeedbackModal(null)}
              aria-label="Cerrar ventana"
            >
              <PiXBold />
            </button>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background:
                  eventFeedbackModal.variant === 'error'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(0, 229, 255, 0.15)',
                border:
                  eventFeedbackModal.variant === 'error'
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : '1px solid rgba(0, 229, 255, 0.35)',
                color: eventFeedbackModal.variant === 'error' ? '#f87171' : '#00e5ff',
                fontSize: '1.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              {eventFeedbackModal.variant === 'error' ? <PiWarningOctagonBold /> : <PiCheckCircleBold />}
            </div>
            <h3 style={{ margin: '0 0 10px', color: '#ffffff', fontSize: '1.15rem' }}>
              {eventFeedbackModal.title}
            </h3>
            <p style={{ margin: '0 0 20px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {eventFeedbackModal.message}
            </p>
            <button
              type="button"
              className="ls-primary-button"
              onClick={() => setEventFeedbackModal(null)}
              style={{ width: '100%' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}


