import { useState, useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  PiXBold,
  PiPlayFill,
  PiArrowSquareOutBold,
  PiSoundcloudLogoFill,
  PiMusicNotesFill,
  PiSpeakerHighBold,
  PiMapPinBold,
} from 'react-icons/pi'
import { FaSpotify, FaInstagram } from 'react-icons/fa6'
import type { ProfileCard, SoundCloudTrack } from '../data/mockData'

type SoundCloudPreviewModalProps = {
  isOpen: boolean
  card: ProfileCard | null
  onClose: () => void
}

const PRESET_COORDINATES: Record<string, [number, number]> = {
  'berlin': [13.405, 52.520],
  'tokyo': [139.6917, 35.6895],
  'buenos aires': [-58.3816, -34.6037],
  'new york': [-74.0060, 40.7128],
  'london': [-0.1278, 51.5074],
  'madrid': [-3.7038, 40.4168],
}

export default function SoundCloudPreviewModal({
  isOpen,
  card,
  onClose,
}: SoundCloudPreviewModalProps) {
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string | null>(null)
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [shouldAutoplay, setShouldAutoplay] = useState<boolean>(false)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (card?.soundcloudUrl ?? card?.soundcloud) {
      setActiveEmbedUrl(card.soundcloudUrl ?? card.soundcloud ?? null)
      setActiveTrackId(null)
      setShouldAutoplay(false) // User decision: do not autoplay on modal open
    }
  }, [card, isOpen])

  // Inicializar mapa de localización para Eventos
  useEffect(() => {
    if (!isOpen || !card || card.isProfile !== false || !mapContainerRef.current) return

    // Evitar reinicialización repetida
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const locLower = (card.location ?? '').toLowerCase()
    let coords: [number, number] = [13.405, 52.520] // Default Berlin

    for (const [city, c] of Object.entries(PRESET_COORDINATES)) {
      if (locLower.includes(city)) {
        coords = c
        break
      }
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: coords,
      zoom: 12,
    })

    new maplibregl.Marker({ color: '#a855f7' })
      .setLngLat(coords)
      .addTo(map)

    setTimeout(() => {
      map.resize()
    }, 200)

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [isOpen, card])

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
            {(card.image || card.profileImage) && (
              <div className="ls-notice-image-wrap" style={{ width: '100%', maxHeight: '130px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                <img
                  src={card.image || card.profileImage}
                  alt={profileName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{profileName}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', margin: '4px 0 8px 0' }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  background: card.isFinished ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  color: card.isFinished ? '#fca5a5' : '#86efac',
                  border: `1px solid ${card.isFinished ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                }}
              >
                {card.isFinished ? '⚠️ Evento Finalizado' : '🔥 Evento Vigente'}
              </span>
            </div>

            <p className="ls-notice-text" style={{ fontSize: '0.82rem', marginBottom: '8px' }}>
              <strong>Evento / Sesión en Vivo</strong> • {card.role} ({card.location}).
            </p>

            {card.eventDate && (
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '8px 12px', borderRadius: '10px', margin: '8px 0', border: '1px solid rgba(168, 85, 247, 0.25)', fontSize: '0.8rem' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#e9d5ff' }}>
                  📅 Fecha: <span>{card.eventDate}</span> {card.eventTime && `| 🕒 ${card.eventTime} hs`}
                </p>
                {card.venue && <p style={{ margin: '3px 0 0 0', color: '#c084fc' }}>📍 Venue / Lugar: {card.venue}</p>}
                {card.ticketUrl && !card.isFinished && (
                  <a
                    href={card.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '6px',
                      color: '#a855f7',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                    }}
                  >
                    🎟️ Adquirir Entradas <PiArrowSquareOutBold />
                  </a>
                )}
              </div>
            )}

            {card.bio && (
              <p className="ls-notice-text" style={{ fontStyle: 'italic', opacity: 0.9, marginTop: '4px', marginBottom: '8px', fontSize: '0.8rem' }}>
                "{card.bio}"
              </p>
            )}

            {/* Mapa de Localización del Evento */}
            <div style={{ marginTop: '10px', marginBottom: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#a855f7', fontWeight: 600, fontSize: '0.82rem' }}>
                <PiMapPinBold />
                <span>Ubicación en Mapa: {card.location}</span>
              </div>
              <div
                ref={mapContainerRef}
                style={{
                  width: '100%',
                  height: '150px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              />
            </div>

            <div className="ls-notice-tags">
              {(card.interestGenres ?? card.tags ?? []).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <button type="button" className="ls-secondary-button" onClick={handleCloseModal} style={{ marginTop: '16px' }}>
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
