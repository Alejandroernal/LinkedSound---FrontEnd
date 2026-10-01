import { useState, useMemo } from 'react'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ReportModal from '../components/ReportModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import CreateEventModal from '../components/CreateEventModal'
import RejectMatchModal from '../components/RejectMatchModal'
import { PiFlagBold, PiSoundcloudLogoFill, PiCalendarPlusBold, PiMagnifyingGlassBold, PiArrowClockwiseBold } from 'react-icons/pi'
import { exploreCards as initialExploreCards, type ProfileCard } from '../data/mockData'
import type { AppPage, Profile, NotificationItem } from '../types'

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
    return cardsList.filter((card) => {
      const cardItemRole = card.itemRole ?? (card.isProfile !== false ? 'Perfil' : 'Evento')
      if (itemRoleFilter !== 'Todos' && cardItemRole !== itemRoleFilter) {
        return false
      }

      const cardTags = card.interestGenres ?? card.tags ?? []
      const cardName = card.nickname ?? card.nickname ?? ''
      const cardBio = card.bio ?? card.description ?? ''

      // Filter by genre pill
      if (activeGenre) {
        const matchesTag = cardTags.some(
          (t) => t.toLowerCase() === activeGenre.toLowerCase()
        )
        const matchesRole = card.role.toLowerCase().includes(activeGenre.toLowerCase())
        if (!matchesTag && !matchesRole) return false
      }

      // Filter by search text
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true

      const inName = cardName.toLowerCase().includes(query)
      const inRole = card.role.toLowerCase().includes(query)
      const inLocation = card.location?.toLowerCase().includes(query) ?? false
      const inDesc = cardBio.toLowerCase().includes(query)
      const inBadge = (card.badge ?? '').toLowerCase().includes(query)
      const inTags = cardTags.some((t) => t.toLowerCase().includes(query))

      return inName || inRole || inLocation || inDesc || inBadge || inTags
    })
  }, [cardsList, searchQuery, activeGenre, itemRoleFilter])

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
            <div className="ls-explore-title-row">
              <div>
                <h3 className="ls-explore-main-title">Explorer</h3>
                <span className="ls-explore-subtitle">
                  Red global activa ({filteredCards.length}{' '}
                  {filteredCards.length === 1 ? 'publicación' : 'publicaciones'})
                </span>
              </div>

              {/* Botón de Publicar Nuevo Evento */}
              <button
                type="button"
                className="ls-primary-button ls-create-event-trigger"
                onClick={() => setShowCreateEventModal(true)}
              >
                <PiCalendarPlusBold style={{ fontSize: '1.15rem' }} /> Publicar Evento
              </button>
            </div>

            {/* Barra de Filtros Reestructurada y Limpia */}
            <div className="ls-explore-toolbar-clean">
              {/* Pestañas de categoría (Todos, Perfiles, Eventos) */}
              <div className="ls-explore-category-tabs">
                {(['Todos', 'Perfil', 'Evento'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`ls-explore-tab-btn ${itemRoleFilter === r ? 'is-active' : ''}`}
                    onClick={() => setItemRoleFilter(r)}
                  >
                    {r === 'Todos' ? 'Todos' : r === 'Perfil' ? 'Perfiles' : 'Eventos'}
                  </button>
                ))}
              </div>

              {/* Campo de búsqueda con icono estilizado */}
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
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Botón Reset */}
              {(searchQuery || activeGenre || itemRoleFilter !== 'Todos') && (
                <button
                  type="button"
                  className="ls-explore-reset-btn"
                  onClick={() => {
                    setSearchQuery('')
                    setActiveGenre('')
                    setItemRoleFilter('Todos')
                  }}
                  title="Restablecer todos los filtros"
                >
                  <PiArrowClockwiseBold /> Limpiar
                </button>
              )}
            </div>
          </div>


          <div className="ls-card-grid">
            {filteredCards.length > 0 ? (
              filteredCards.map((card) => {
                const itemRole = card.itemRole ?? (card.isProfile !== false ? 'Perfil' : 'Evento')
                const isProfile = itemRole === 'Perfil'

                return (
                  <article
                    key={card.nickname ?? card.nickname}
                    className={`ls-recommend-card ls-clickable-card ${isProfile ? 'has-soundcloud' : ''
                      }`}
                    onClick={() => setSelectedPreviewCard(card)}
                    title={
                      isProfile
                        ? `Haz clic para ver los trabajos en SoundCloud de ${card.nickname ?? card.nickname}`
                        : `Ver detalles de ${card.nickname ?? card.nickname}`
                    }
                  >
                    <div className="ls-card-visual">
                      <img src={card.image || card.profileImage} alt={card.nickname ?? card.nickname} />
                      <span className="ls-card-badge">
                        {itemRole.toUpperCase()}
                      </span>
                      {isProfile ? (
                        <span className="ls-sc-card-indicator" title="SoundCloud vinculado">
                          <PiSoundcloudLogoFill /> SoundCloud
                        </span>
                      ) : (
                        <span
                          className="ls-sc-card-indicator"
                          style={{
                            background: card.isFinished
                              ? 'rgba(239, 68, 68, 0.9)'
                              : 'rgba(34, 197, 94, 0.9)',
                            color: '#ffffff',
                            fontWeight: 'bold',
                          }}
                        >
                          {card.isFinished ? 'Finalizado' : 'Vigente'}
                        </span>
                      )}
                    </div>
                    <div className="ls-card-body">
                      <div className="ls-card-head">
                        <h3>{card.nickname ?? card.nickname}</h3>
                        <span className="ls-match-tag">{card.match} match</span>
                      </div>
                      <p className="ls-card-role">
                        {card.role} {card.location && `• ${card.location}`}
                      </p>

                      {/* En perfiles: Caja de Track / Muestra destacada */}
                      {isProfile && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255, 85, 0, 0.08)',
                            border: '1px solid rgba(255, 85, 0, 0.25)',
                            borderRadius: '10px',
                            padding: '8px 10px',
                            margin: '8px 0',
                          }}
                        >
                          <PiSoundcloudLogoFill style={{ color: '#ff5500', fontSize: '1.2rem', flexShrink: 0 }} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: '#ffaa71', fontWeight: 700, textTransform: 'uppercase' }}>
                              Track / Muestra SoundCloud
                            </span>
                            <span style={{ display: 'block', fontSize: '0.78rem', color: '#ffffff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {card.tracks && card.tracks[0]?.title ? card.tracks[0].title : 'Última producción de catálogo'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* En eventos: Caja de Fecha, Hora y Venue */}
                      {!isProfile && card.eventDate && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            background: 'rgba(168, 85, 247, 0.08)',
                            border: '1px solid rgba(168, 85, 247, 0.22)',
                            borderRadius: '10px',
                            padding: '8px 10px',
                            margin: '8px 0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#e9d5ff', fontWeight: 600 }}>
                            <span>📅</span>
                            <span>{card.eventDate}</span>
                            {card.eventTime && <span style={{ color: '#c084fc' }}>• {card.eventTime} hs</span>}
                          </div>
                          {card.venue && (
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>📍</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.venue}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="ls-card-desc">{card.bio ?? card.description}</p>
                      {(card.interestGenres ?? card.tags ?? []).length > 0 && (
                        <div className="ls-mini-tags">
                          {(card.interestGenres ?? card.tags ?? []).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      )}

                      <div className="ls-card-actions" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                        {isProfile && (
                          <div className="ls-explore-match-actions" style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="ls-swipe-pass"
                              style={{ width: '36px', height: '36px', minHeight: '36px', flex: 'none', borderRadius: '8px', fontSize: '0.9rem' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setRejectingTarget(card)
                              }}
                              title="Descartar / Rechazar Match"
                            >
                              ✕
                            </button>
                            <button
                              type="button"
                              className="ls-swipe-like"
                              style={{ width: '36px', height: '36px', minHeight: '36px', flex: 'none', borderRadius: '8px', fontSize: '0.9rem' }}
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                              title="Conectar / Match"
                            >
                              ✓
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          className="ls-report-card-btn"
                          style={{ marginLeft: 'auto', flex: 'none' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setReportingTarget(card.nickname ?? card.nickname)
                          }}
                          title={`Reportar ${card.nickname ?? card.nickname}`}
                        >
                          <PiFlagBold /> Reporte
                        </button>
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


