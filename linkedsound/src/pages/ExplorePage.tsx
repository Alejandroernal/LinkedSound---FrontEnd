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

const GENRE_FILTERS = [
  'Techno',
  'Synth-pop',
  'ModularSynth',
  'Vocal',
  'Synthwave',
  'Ambient',
]

export default function ExplorePage({ activePage, onNavigate, profile }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('')
  const [reportingTarget, setReportingTarget] = useState<string | null>(null)
  const [selectedPreviewCard, setSelectedPreviewCard] = useState<ProfileCard | null>(null)

  const filteredCards = useMemo(() => {
    return exploreCards.filter((card) => {
      // Filter by genre pill
      if (activeGenre) {
        const matchesTag = card.tags.some(
          (t) => t.toLowerCase() === activeGenre.toLowerCase()
        )
        const matchesRole = card.role.toLowerCase().includes(activeGenre.toLowerCase())
        if (!matchesTag && !matchesRole) return false
      }

      // Filter by search text
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true

      const inName = card.name.toLowerCase().includes(query)
      const inRole = card.role.toLowerCase().includes(query)
      const inLocation = card.location?.toLowerCase().includes(query) ?? false
      const inDesc = card.description.toLowerCase().includes(query)
      const inBadge = card.badge.toLowerCase().includes(query)
      const inTags = card.tags.some((t) => t.toLowerCase().includes(query))

      return inName || inRole || inLocation || inDesc || inBadge || inTags
    })
  }, [searchQuery, activeGenre])

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
                {filteredCards.length === 1 ? 'creator' : 'creators'})
              </span>
            </div>

            <div className="ls-explore-filter-bar">
              <input
                type="text"
                placeholder="Filter by name, genre, role, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ls-explore-search-input"
              />
              {GENRE_FILTERS.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  className={`ls-genre-filter-pill ${activeGenre === genre ? 'active' : ''}`}
                  onClick={() => setActiveGenre(activeGenre === genre ? '' : genre)}
                >
                  {genre}
                </button>
              ))}
              {(searchQuery || activeGenre) && (
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
                const isProfile = card.isProfile !== false

                return (
                  <article
                    key={card.name}
                    className={`ls-recommend-card ls-clickable-card ${
                      isProfile ? 'has-soundcloud' : ''
                    }`}
                    onClick={() => setSelectedPreviewCard(card)}
                    title={
                      isProfile
                        ? `Haz clic para ver los trabajos en SoundCloud de ${card.name}`
                        : `Ver detalles de ${card.name}`
                    }
                  >
                    <div className="ls-card-visual">
                      <img src={card.image} alt={card.name} />
                      <span className="ls-card-badge">{card.badge}</span>
                      {isProfile && (
                        <span className="ls-sc-card-indicator" title="SoundCloud vinculado">
                          <PiSoundcloudLogoFill /> SoundCloud
                        </span>
                      )}
                    </div>
                    <div className="ls-card-body">
                      <div className="ls-card-head">
                        <h3>{card.name}</h3>
                        <span>{card.match} match</span>
                      </div>
                      <p className="ls-card-role">
                        {card.role} {card.location && `• ${card.location}`}
                      </p>
                      <p className="ls-card-desc">{card.description}</p>
                      {card.tags && card.tags.length > 0 && (
                        <div className="ls-mini-tags">
                          {card.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      )}

                      <div className="ls-card-actions">
                        <button
                          type="button"
                          className="ls-report-card-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setReportingTarget(card.name)
                          }}
                          title={`Reportar ${card.name}`}
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


