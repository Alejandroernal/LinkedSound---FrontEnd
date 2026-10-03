import { useState, useMemo } from 'react'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ReportModal from '../components/ReportModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import CreateEventModal from '../components/CreateEventModal'
import RejectMatchModal from '../components/RejectMatchModal'
import GenreFilterPopover from '../components/GenreFilterPopover'
import {
  PiFlagBold,
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
  PiCheckBold,
} from 'react-icons/pi'
import { exploreCards as initialExploreCards, type ProfileCard } from '../data/mockData'
import { type AppPage, type Profile, type NotificationItem, formatEventDate, isUserProfile } from '../types'

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
}: ExplorePageProps) {
  const [cardsList, setCardsList] = useState<ProfileCard[]>(initialExploreCards)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('')
  const [itemRoleFilter, setItemRoleFilter] = useState<'Todos' | 'Perfil' | 'Evento'>('Todos')
  const [sortBy, setSortBy] = useState<'match' | 'name' | 'role'>('match')
  const [isGenreFilterOpen, setIsGenreFilterOpen] = useState(false)
  const [reportingTarget, setReportingTarget] = useState<string | null>(null)
  const [rejectingTarget, setRejectingTarget] = useState<ProfileCard | null>(null)
  const [selectedPreviewCard, setSelectedPreviewCard] = useState<ProfileCard | null>(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)

  const handleCreateEvent = (newEvent: ProfileCard) => {
    setCardsList((prev) => [newEvent, ...prev])
  }

  const handleConfirmReject = (cardToReject: ProfileCard) => {
    setCardsList((prev) => prev.filter((c) => (c.id ? c.id !== cardToReject.id : c.nickname !== cardToReject.nickname)))
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
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true

      const inName = cardName.toLowerCase().includes(query)
      const inRole = card.role ? card.role.toLowerCase().includes(query) : false
      const inLocation = card.location?.toLowerCase().includes(query) ?? false
      const inDesc = cardBio.toLowerCase().includes(query)
      const inBadge = (card.badge ?? '').toLowerCase().includes(query)
      const inTags = cardTags.some((t) => t.toLowerCase().includes(query))

      return inName || inRole || inLocation || inDesc || inBadge || inTags
    })

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => (a.nickname ?? '').localeCompare(b.nickname ?? ''))
    } else if (sortBy === 'role') {
      result = [...result].sort((a, b) => (a.role ?? '').localeCompare(b.role ?? ''))
    } else if (sortBy === 'match') {
      result = [...result].sort((a, b) => {
        const matchA = parseInt(a.match?.replace('%', '') || '0', 10)
        const matchB = parseInt(b.match?.replace('%', '') || '0', 10)
        return matchB - matchA
      })
    }

    return result
  }, [cardsList, searchQuery, activeGenre, itemRoleFilter, sortBy])

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

      <main className="ls-page-content">
        <section className="ls-panel ls-page-panel">
          <div className="ls-panel-header compact ls-explore-header-redesigned">
            {/* Fila Superior: Título con Icono + Badge Verde */}
            <div className="ls-explore-title-row">
              <div className="ls-explore-title-with-icon">
                <div className="ls-explore-title-badge-icon">
                  <PiCompassBold />
                </div>
                <div>
                  <h3 className="ls-explore-main-title">
                    El punto de encuentro para la música: explora perfiles, encuentra tu match y vive shows
                  </h3>
                  <span className="ls-explore-subtitle ls-explore-subtitle-row">
                    <span className="ls-live-status-dot" />
                    Descubre la red global • {filteredCards.length}{' '}
                    {filteredCards.length === 1 ? 'publicación' : 'publicaciones'}
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
                    ✕
                  </button>
                )}
              </div>

              {/* Grupo unificado de funcionalidades (Derecha) */}
              <div className="ls-explore-functionalities-group">
                {/* 1. Pestañas icónicas (Todos, Perfiles, Eventos) */}
                <div className="ls-explore-icon-tabs" title="Filtrar tipo de contenido">
                  <button
                    type="button"
                    className={`ls-icon-tab-btn ${itemRoleFilter === 'Todos' ? 'is-active' : ''}`}
                    onClick={() => setItemRoleFilter('Todos')}
                    title="Todos los contenidos"
                  >
                    <PiSquaresFourBold />
                  </button>
                  <button
                    type="button"
                    className={`ls-icon-tab-btn ${itemRoleFilter === 'Perfil' ? 'is-active' : ''}`}
                    onClick={() => setItemRoleFilter('Perfil')}
                    title="Solo Perfiles"
                  >
                    <PiUsersBold />
                  </button>
                  <button
                    type="button"
                    className={`ls-icon-tab-btn ${itemRoleFilter === 'Evento' ? 'is-active' : ''}`}
                    onClick={() => setItemRoleFilter('Evento')}
                    title="Solo Eventos"
                  >
                    <PiTicketBold />
                  </button>
                </div>

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

                {/* 3. Selector de Ordenamiento por Icono */}
                <div className="ls-sort-icon-select-wrap">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'match' | 'name' | 'role')}
                    className="ls-explore-sort-select-icononly"
                    title="Ordenar publicaciones"
                  >
                    <option value="match">Mayor Match %</option>
                    <option value="name">Nombre (A - Z)</option>
                    <option value="role">Rol / Tipo</option>
                  </select>
                  <PiArrowsDownUpBold className="ls-sort-select-icon" />
                </div>

                {/* 4. Botón Publicar Evento (Icono destacado) */}
                <button
                  type="button"
                  className="ls-create-event-icon-btn"
                  onClick={() => setShowCreateEventModal(true)}
                  title="Publicar nuevo evento musical"
                >
                  <PiCalendarPlusBold />
                </button>

                {/* Botón Reset si hay filtros aplicados */}
                {(searchQuery || activeGenre || itemRoleFilter !== 'Todos') && (
                  <button
                    type="button"
                    className="ls-explore-reset-btn-icon"
                    onClick={() => {
                      setSearchQuery('')
                      setActiveGenre('')
                      setItemRoleFilter('Todos')
                    }}
                    title="Restablecer todos los filtros"
                  >
                    <PiArrowClockwiseBold />
                  </button>
                )}
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
            {filteredCards.length > 0 ? (
              filteredCards.map((card, idx) => {
                const isProfile = isUserProfile(card)
                const itemRole = card.itemRole ?? (isProfile ? 'Perfil' : 'Evento')
                const cardKey = card.id ? card.id : `${card.nickname ?? 'card'}-${idx}`
                const firstName = isProfile ? (card.firstName ?? '') : ''
                const lastName = isProfile ? (card.lastName ?? '') : ''
                const fullName = [firstName, lastName].filter(Boolean).join(' ')
                const cardDisplayTitle = card.nickname?.trim() || fullName || 'Creador'

                return (
                  <article
                    key={cardKey}
                    className={`ls-recommend-card ls-clickable-card ${isProfile ? 'has-soundcloud' : ''}`}
                    onClick={() => setSelectedPreviewCard(card)}
                    title={
                      isProfile
                        ? `Haz clic para ver los trabajos en SoundCloud de ${cardDisplayTitle}`
                        : `Ver detalles de ${cardDisplayTitle}`
                    }
                  >
                    <div className="ls-card-visual">
                      <img src={card.profileImage} alt={cardDisplayTitle} />
                      <span className="ls-card-badge">
                        {itemRole.toUpperCase()}
                      </span>
                      {isProfile ? (
                        <span className="ls-sc-card-indicator" title="SoundCloud vinculado">
                          <PiSoundcloudLogoFill /> SoundCloud
                        </span>
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
                        <div>
                          <h3>{cardDisplayTitle}</h3>
                          {isProfile && fullName && card.nickname && fullName.toLowerCase() !== card.nickname.toLowerCase() && (
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginTop: '2px' }}>
                              {fullName}
                            </span>
                          )}
                        </div>
                        <span className="ls-match-tag">{card.match} match</span>
                      </div>
                      <p className="ls-card-role">
                        {card.role} {card.location && `• ${card.location}`}
                      </p>

                      {/* En perfiles: Caja de Track / Muestra destacada */}
                      {isProfile && (
                        <div className="ls-card-track-sample-box">
                          <PiSoundcloudLogoFill className="ls-card-track-sc-icon" />
                          <div className="ls-card-track-info">
                            <span className="ls-card-track-label">
                              Track / Muestra SoundCloud
                            </span>
                            <span className="ls-card-track-title">
                              {card.tracks && card.tracks[0]?.title ? card.tracks[0].title : 'Última producción de catálogo'}
                            </span>
                          </div>
                        </div>
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

                      <p className="ls-card-desc">{card.description ?? ''}</p>
                      <div className="ls-card-footer-row">
                        {(card.interestGenres ?? card.tags ?? []).length > 0 ? (
                          <div className="ls-mini-tags ls-card-mini-tags-wrap">
                            {(card.interestGenres ?? card.tags ?? []).map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        ) : (
                          <div className="ls-card-tags-spacer" />
                        )}

                        <div className="ls-card-action-group">
                          {isProfile && (
                            <>
                              <button
                                type="button"
                                className="ls-card-btn-action pass"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setRejectingTarget(card)
                                }}
                                title="Descartar Perfil"
                              >
                                <PiXBold />
                              </button>

                              <button
                                type="button"
                                className="ls-card-btn-action like"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPreviewCard(card)
                                }}
                                title="Ver Perfil / Match"
                              >
                                <PiCheckBold />
                              </button>
                            </>
                          )}

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
                          </button>
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

      {/* SoundCloud Preview Modal for profiles */}
      <SoundCloudPreviewModal
        isOpen={Boolean(selectedPreviewCard)}
        card={selectedPreviewCard}
        onClose={() => setSelectedPreviewCard(null)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={Boolean(reportingTarget)}
        targetName={reportingTarget ?? ''}
        targetType="Objeto de Explorer"
        onClose={() => setReportingTarget(null)}
      />

      {/* Modal de Creación de Evento */}
      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onCreateEvent={handleCreateEvent}
        userNickname={profile?.nickname || profile?.firstName || 'Creador LinkedSound'}
        userLocation={profile?.location || 'Berlin, Germany'}
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

      <Footer />
    </div>
  )
}


