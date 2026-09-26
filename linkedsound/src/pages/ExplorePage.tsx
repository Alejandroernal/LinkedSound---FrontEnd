import { useState, useMemo } from 'react'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ReportModal from '../components/ReportModal'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'
import { PiFlagBold, PiSoundcloudLogoFill } from 'react-icons/pi'
import { exploreCards, type ProfileCard } from '../data/mockData'
import type { AppPage, Profile } from '../types'

type ExplorePageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile: Profile
}



export default function ExplorePage({ activePage, onNavigate, profile }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('')
  const [itemRoleFilter, setItemRoleFilter] = useState<'Todos' | 'Perfil' | 'Evento'>('Todos')
  const [reportingTarget, setReportingTarget] = useState<string | null>(null)
  const [selectedPreviewCard, setSelectedPreviewCard] = useState<ProfileCard | null>(null)

  const filteredCards = useMemo(() => {
    return exploreCards.filter((card) => {
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
  }, [searchQuery, activeGenre, itemRoleFilter])

  return (
    <div className="ls-app-shell">
      <TopBar
        activePage={activePage}
        onNavigate={onNavigate}
        profile={profile}
      />

      <main className="ls-page-content">
        <section className="ls-panel ls-page-panel">
          <div className="ls-panel-header compact ls-explore-header">
            <div>
              <h3>Explore</h3>
              <span>
                Live network ({filteredCards.length}{' '}
                {filteredCards.length === 1 ? 'objeto' : 'objetos'})
              </span>
            </div>

            <div className="ls-explore-filter-bar">
              {/* Selector de Rol Artículo */}
              <div style={{ display: 'flex', gap: '6px', marginRight: '8px' }}>
                {(['Todos', 'Perfil', 'Evento'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`ls-genre-filter-pill ${itemRoleFilter === r ? 'active' : ''}`}
                    style={{ fontWeight: itemRoleFilter === r ? 'bold' : 'normal' }}
                    onClick={() => setItemRoleFilter(r)}
                  >
                    {r === 'Todos' ? 'Todos' : r === 'Perfil' ? '👤 Perfiles' : '🎪 Eventos'}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Buscar por nombre, género, rol, ciudad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ls-explore-search-input"
              />
              
              {(searchQuery || activeGenre || itemRoleFilter !== 'Todos') && (
                <button
                  type="button"
                  className="ls-genre-filter-pill"
                  style={{
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    background: 'rgba(239, 68, 68, 0.1)',
                  }}
                  onClick={() => {
                    setSearchQuery('')
                    setActiveGenre('')
                    setItemRoleFilter('Todos')
                  }}
                >
                  Reset
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
                      <span className="ls-card-badge" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isProfile ? 'rgba(168, 85, 247, 0.4)' : 'rgba(234, 179, 8, 0.4)',
                          fontWeight: 'bold',
                          fontSize: '0.65rem'
                        }}>
                          {itemRole}
                        </span>
                        {card.badge || card.role}
                      </span>
                      {isProfile && (
                        <span className="ls-sc-card-indicator" title="SoundCloud vinculado">
                          <PiSoundcloudLogoFill /> SoundCloud
                        </span>
                      )}
                    </div>
                    <div className="ls-card-body">
                      <div className="ls-card-head">
                        <h3>{card.nickname ?? card.nickname}</h3>
                        <span>{card.match} match</span>
                      </div>
                      <p className="ls-card-role">
                        {card.role} {card.location && `• ${card.location}`}
                      </p>
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
                                alert(`Descartado: ${card.nickname ?? card.nickname}`)
                              }}
                              title="Descartar"
                            >
                              ✕
                            </button>
                            <button
                              type="button"
                              className="ls-swipe-like"
                              style={{ width: '36px', height: '36px', minHeight: '36px', flex: 'none', borderRadius: '8px', fontSize: '0.9rem' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                alert(`¡Conectado con ${card.nickname ?? card.nickname}!`)
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

      <Footer />
    </div>
  )
}


