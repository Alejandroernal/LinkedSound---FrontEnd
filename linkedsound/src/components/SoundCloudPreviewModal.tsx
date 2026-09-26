import { useState, useEffect } from 'react'
import {
  PiXBold,
  PiPlayFill,
  PiArrowSquareOutBold,
  PiSoundcloudLogoFill,
  PiMusicNotesFill,
  PiInfoBold,
  PiSpeakerHighBold,
} from 'react-icons/pi'
import { FaSpotify, FaInstagram } from 'react-icons/fa6'
import type { ProfileCard, SoundCloudTrack } from '../data/mockData'

type SoundCloudPreviewModalProps = {
  isOpen: boolean
  card: ProfileCard | null
  onClose: () => void
}

export default function SoundCloudPreviewModal({
  isOpen,
  card,
  onClose,
}: SoundCloudPreviewModalProps) {
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string | null>(null)
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [shouldAutoplay, setShouldAutoplay] = useState<boolean>(false)

  useEffect(() => {
    if (card?.soundcloudUrl ?? card?.soundcloud) {
      setActiveEmbedUrl(card.soundcloudUrl ?? card.soundcloud ?? null)
      setActiveTrackId(null)
      setShouldAutoplay(false) // User decision: do not autoplay on modal open
    }
  }, [card, isOpen])

  if (!isOpen || !card) return null

  const profileName = card.nickname ?? card.nickname ?? 'Usuario'
  const isProfile = card.isProfile !== false
  const tracks: SoundCloudTrack[] = card.tracks ?? []
  const visibleTracks = tracks.slice(0, 2) // Muestra el último tema subido + 1 opcional subido por el usuario
  const handleUrl = card.soundcloudUrl ?? card.soundcloud ?? `https://soundcloud.com/search?q=${encodeURIComponent(profileName)}`
  const handleName = (card.soundcloudUrl ?? card.soundcloud)
    ? (card.soundcloudUrl ?? card.soundcloud ?? '').replace(/^https?:\/\/(www\.)?soundcloud\.com\//, '')
    : (card.soundcloudHandle ?? profileName.toLowerCase().replace(/\s+/g, ''))

  const spotifyUrl = card.spotifyUrl ?? card.spotify
  const instagramUrl = card.instagramUrl ?? card.instagram

  // Effective embed URL: user selected track or profile URL
  const embedTargetUrl = activeEmbedUrl ?? handleUrl

  const handleSelectTrack = (track: SoundCloudTrack) => {
    setActiveTrackId(track.id)
    setActiveEmbedUrl(track.soundcloudLink ?? card.soundcloudUrl ?? card.soundcloud ?? null)
    setShouldAutoplay(true) // Start playback on explicit user action
  }

  const handleCloseModal = () => {
    setActiveEmbedUrl(null)
    setActiveTrackId(null)
    setShouldAutoplay(false)
    onClose()
  }

  return (
    <div className="ls-modal-overlay" onClick={handleCloseModal}>
      <div
        className="ls-modal-content ls-soundcloud-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="ls-modal-close"
          onClick={handleCloseModal}
          aria-label="Cerrar preview"
        >
          <PiXBold />
        </button>

        {!isProfile ? (
          <div className="ls-non-profile-notice">
            <div className="ls-notice-icon">
              <PiInfoBold />
            </div>
            <h3>Evento / Sesión en Vivo</h3>
            <p className="ls-notice-text">
              <strong>{profileName}</strong> es {card.role.toLowerCase()} ({card.location}).
              Al tratarse de una sesión o evento en vivo y no un perfil de creador individual, no posee catálogo de producciones vinculadas en SoundCloud.
            </p>
            <div className="ls-notice-tags">
              {(card.interestGenres ?? card.tags ?? []).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <button type="button" className="ls-secondary-button" onClick={handleCloseModal}>
              Cerrar Vista Previa
            </button>
          </div>
        ) : (
          <div className="ls-sc-preview-container">
            {/* Header / Profile info */}
            <div className="ls-sc-header">
              <div className="ls-sc-avatar-wrap">
                <img src={card.image || card.profileImage} alt={profileName} className="ls-sc-avatar" />
              </div>
              <div className="ls-sc-user-info">
                <div className="ls-sc-title-row">
                  <h2>{profileName}</h2>
                  <span className="ls-sc-match">{card.match} match</span>
                </div>
                <p className="ls-sc-role">
                  {card.role} {card.location && `• ${card.location}`}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                  <div className="ls-sc-handle-pill">
                    <PiSoundcloudLogoFill className="ls-sc-orange-icon" />
                    <span>soundcloud.com/{handleName}</span>
                    <a
                      href={handleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ls-sc-external-link"
                      title="Abrir perfil en SoundCloud"
                    >
                      <PiArrowSquareOutBold />
                    </a>
                  </div>

                  {spotifyUrl && (
                    <a
                      href={spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ls-sc-handle-pill"
                      style={{ color: '#1DB954', textDecoration: 'none' }}
                      title="Abrir Spotify"
                    >
                      <FaSpotify style={{ color: '#1DB954' }} />
                      <span>Spotify</span>
                      <PiArrowSquareOutBold />
                    </a>
                  )}

                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ls-sc-handle-pill"
                      style={{ color: '#E1306C', textDecoration: 'none' }}
                      title="Abrir Instagram"
                    >
                      <FaInstagram style={{ color: '#E1306C' }} />
                      <span>Instagram</span>
                      <PiArrowSquareOutBold />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <p className="ls-sc-bio">{card.descript ?? card.bio ?? card.description}</p>

            {/* Official SoundCloud Embedded Player Widget */}
            <div className="ls-sc-embed-widget">
              <div className="ls-sc-embed-header">
                <PiSpeakerHighBold className="ls-sc-orange-icon" />
                <span>Reproducción Oficial en SoundCloud</span>
              </div>
              <iframe
                width="100%"
                height="166"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
                  embedTargetUrl,
                )}&color=%23ff5500&auto_play=${shouldAutoplay ? 'true' : 'false'}&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                title="Reproductor de SoundCloud"
              />
            </div>

            {/* SoundCloud Tracks / Profile Catalog */}
            <div className="ls-sc-tracks-section">
              <div className="ls-sc-section-title">
                <div className="ls-sc-title-left">
                  <PiMusicNotesFill className="ls-sc-orange-icon" />
                  <h3>Producciones y Trabajos Vinculados (Última actividad)</h3>
                </div>
                <span className="ls-sc-track-count">
                  {visibleTracks.length > 0 ? `${visibleTracks.length} tema${visibleTracks.length > 1 ? 's' : ''}` : 'Sin trabajos'}
                </span>
              </div>

              {visibleTracks.length > 0 ? (
                <div className="ls-sc-tracks-list">
                  {visibleTracks.map((track) => {
                    const isSelected = activeTrackId === track.id

                    return (
                      <div
                        key={track.id}
                        className={`ls-sc-track-card ${isSelected ? 'is-playing' : ''}`}
                        onClick={() => handleSelectTrack(track)}
                      >
                        <button
                          type="button"
                          className="ls-sc-play-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectTrack(track)
                          }}
                          title="Cargar y reproducir en SoundCloud"
                        >
                          <PiPlayFill />
                        </button>

                        <div className="ls-sc-track-info">
                          <div className="ls-sc-track-main">
                            <span className="ls-sc-track-title">{track.title}</span>
                            <span className="ls-sc-genre-tag">{track.genre}</span>
                          </div>

                          <div className="ls-sc-track-meta">
                            <span>▶ {track.plays} reproducciones</span>
                            <span>⏱ {track.duration}</span>
                            {isSelected && (
                              <span style={{ color: '#ff5500', fontWeight: 'bold' }}>
                                ● CARGADO EN REPRODUCTOR
                              </span>
                            )}
                          </div>
                        </div>

                        <a
                          href={track.soundcloudLink ?? handleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ls-sc-listen-btn"
                          onClick={(e) => e.stopPropagation()}
                          title="Abrir tema en SoundCloud"
                        >
                          <PiSoundcloudLogoFill /> Abrir
                        </a>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="ls-sc-empty-tracks">
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic', padding: '12px 0' }}>
                    No tiene trabajos realizados de momento
                  </p>
                </div>
              )}
            </div>

            {/* Footer action link */}
            <div className="ls-sc-modal-footer">
              <a
                href={handleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ls-sc-full-profile-btn"
              >
                <PiSoundcloudLogoFill /> Abrir perfil oficial en SoundCloud <PiArrowSquareOutBold />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
