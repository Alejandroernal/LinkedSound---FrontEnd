import { useState, useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  PiXBold,
  PiCheckBold,
  PiPlayFill,
  PiArrowSquareOutBold,
  PiSoundcloudLogoFill,
  PiMusicNotesFill,
  PiSpeakerHighBold,
  PiMapPinBold,
  PiCalendarBold,
  PiClockBold,
  PiTicketBold,
  PiFlameBold,
  PiWarningBold,
  PiTimerBold,
} from 'react-icons/pi'
import { FaSpotify, FaInstagram } from 'react-icons/fa6'
import type { ProfileCard, SoundCloudTrack } from '../data/mockData'
import { formatEventDate, isUserProfile } from '../types'

type SoundCloudPreviewModalProps = {
  isOpen: boolean
  card: ProfileCard | null
  onClose: () => void
  onConnectProfile?: (card: ProfileCard) => void
  onDiscardProfile?: (card: ProfileCard) => void
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
  onConnectProfile,
  onDiscardProfile,
}: SoundCloudPreviewModalProps) {
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string | null>(null)
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [shouldAutoplay, setShouldAutoplay] = useState<boolean>(false)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    const mainScUrl = card?.soundcloudUrl
    if (mainScUrl) {
      setActiveEmbedUrl(mainScUrl)
      setActiveTrackId(null)
      setShouldAutoplay(false) // User decision: do not autoplay on modal open
    }
  }, [card, isOpen])

  // Inicializar o actualizar el mapa de localización para Eventos (instancia única con geocodificación exacta)
  useEffect(() => {
    if (!isOpen || !card || card.isProfile !== false || !mapContainerRef.current) {
      if (mapRef.current) {
        markerRef.current?.remove()
        markerRef.current = null
        mapRef.current.remove()
        mapRef.current = null
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = ''
      }
      return
    }

    let isMounted = true

    const updateMapInstance = (coords: [number, number], zoomLevel = 14) => {
      if (!isMounted || !mapContainerRef.current) return

      if (mapRef.current) {
        mapRef.current.flyTo({ center: coords, zoom: zoomLevel })
        if (markerRef.current) {
          markerRef.current.setLngLat(coords)
        } else {
          markerRef.current = new maplibregl.Marker({ color: '#a855f7' })
            .setLngLat(coords)
            .addTo(mapRef.current)
        }
        mapRef.current.resize()
        return
      }

      mapContainerRef.current.innerHTML = ''

      try {
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
          center: coords,
          zoom: zoomLevel,
          renderWorldCopies: false,
        })

        const marker = new maplibregl.Marker({ color: '#a855f7' })
          .setLngLat(coords)
          .addTo(map)

        markerRef.current = marker
        mapRef.current = map

        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.resize()
          }
        }, 150)
      } catch (err) {
        console.error('Error initializing map:', err)
      }
    }

    // 1. Si el ítem tiene coordenadas explícitas asignadas en creación o backend
    if (card.longitude !== undefined && card.latitude !== undefined) {
      updateMapInstance([card.longitude, card.latitude], 14)
      return
    }

    // 2. Coordenadas aproximadas de respaldo por ciudad
    const locLower = (card.location ?? '').toLowerCase()
    let fallbackCoords: [number, number] = [13.405, 52.520] // Default Berlin
    for (const [city, c] of Object.entries(PRESET_COORDINATES)) {
      if (locLower.includes(city)) {
        fallbackCoords = c
        break
      }
    }

    // Inicializar primero con fallback para respuesta inmediata en UI
    updateMapInstance(fallbackCoords, 12)

    // 3. Geocodificación exacta dinámica mediante Nominatim para direcciones complejas
    if (card.location && card.location.trim()) {
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(card.location.trim())}&limit=1`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
            const lat = parseFloat(data[0].lat)
            const lon = parseFloat(data[0].lon)
            updateMapInstance([lon, lat], 14)
          }
        })
        .catch(() => {
          // Si falla la red, se mantiene el mapa con las coordenadas de respaldo
        })
    }

    return () => {
      isMounted = false
      if (mapRef.current) {
        markerRef.current?.remove()
        markerRef.current = null
        mapRef.current.remove()
        mapRef.current = null
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = ''
      }
    }
  }, [isOpen, card])

  if (!isOpen || !card) return null

  const isProfile = isUserProfile(card)
  const firstName = isProfile ? card.firstName : ''
  const lastName = isProfile ? card.lastName : ''
  const soundcloudHandle = isProfile ? card.soundcloudHandle : undefined
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const profileName = card.nickname?.trim() || fullName || 'Usuario'
  const tracks: SoundCloudTrack[] = card.tracks ?? []
  const visibleTracks = tracks.slice(0, 2) // Muestra el último tema subido + 1 opcional subido por el usuario
  const scUrl = card.soundcloudUrl
  const handleUrl = scUrl || `https://soundcloud.com/search?q=${encodeURIComponent(profileName)}`
  const handleName = scUrl
    ? scUrl.replace(/^https?:\/\/(www\.)?soundcloud\.com\//, '')
    : (soundcloudHandle ?? profileName.toLowerCase().replace(/\s+/g, ''))

  const spotifyUrl = card.spotifyUrl
  const instagramUrl = card.instagramUrl

  // Effective embed URL: user selected track or profile URL
  const embedTargetUrl = activeEmbedUrl ?? handleUrl

  const handleSelectTrack = (track: SoundCloudTrack) => {
    setActiveTrackId(track.id)
    setActiveEmbedUrl(track.soundcloudLink || card.soundcloudUrl || null)
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
          <div className="ls-non-profile-notice" style={{ textAlign: 'left' }}>
            {card.profileImage && (
              <div
                className="ls-notice-image-wrap"
                style={{
                  width: '100%',
                  height: '220px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  marginTop: '28px',
                  marginBottom: '16px',
                  position: 'relative',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                <img
                  src={card.profileImage}
                  alt={profileName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 35%',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: 'linear-gradient(to top, rgba(20, 22, 40, 0.9), transparent)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            )}
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', textAlign: 'left', color: '#ffffff' }}>{profileName}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start', margin: '4px 0 10px 0' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  background: card.isFinished ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  color: card.isFinished ? '#fca5a5' : '#86efac',
                  border: `1px solid ${card.isFinished ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                }}
              >
                {card.isFinished ? (
                  <>
                    <PiWarningBold /> Evento Finalizado
                  </>
                ) : (
                  <>
                    <PiFlameBold /> Evento Vigente
                  </>
                )}
              </span>
            </div>

            <p className="ls-notice-text" style={{ fontSize: '0.84rem', marginBottom: '10px', textAlign: 'left' }}>
              <strong>Evento / Sesión en Vivo</strong> • {card.role} ({card.location}).
            </p>

            {card.eventDate && (
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '12px 14px', borderRadius: '12px', margin: '10px 0', border: '1px solid rgba(168, 85, 247, 0.25)', fontSize: '0.82rem', textAlign: 'left' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', textAlign: 'left' }}>
                  <PiCalendarBold style={{ color: '#c084fc' }} />
                  <span>Fecha: {formatEventDate(card.eventDate)}</span>
                  {card.eventTime && (
                    <>
                      <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>|</span>
                      <PiClockBold style={{ color: '#c084fc' }} />
                      <span>{card.eventTime} hs</span>
                    </>
                  )}
                </p>
                {card.venue && (
                  <p style={{ margin: '6px 0 0 0', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }}>
                    <PiMapPinBold />
                    <span>Venue / Lugar: {card.venue}</span>
                  </p>
                )}
                {(card.streetAddress || card.city || card.province || card.country) && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(168, 85, 247, 0.25)', fontSize: '0.78rem', color: '#e9d5ff', textAlign: 'left' }}>
                    {card.streetAddress && <div style={{ marginBottom: '3px', textAlign: 'left' }}><strong>Calle y Altura:</strong> {card.streetAddress}</div>}
                    {(card.city || card.province) && (
                      <div style={{ marginBottom: '3px', textAlign: 'left' }}><strong>Localidad / Provincia:</strong> {[card.city, card.province].filter(Boolean).join(', ')}</div>
                    )}
                    {card.country && <div style={{ textAlign: 'left' }}><strong>País:</strong> {card.country}</div>}
                  </div>
                )}
                {card.ticketUrl && !card.isFinished && (
                  <a
                    href={card.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      color: '#a855f7',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                    }}
                  >
                    <PiTicketBold /> Adquirir Entradas <PiArrowSquareOutBold />
                  </a>
                )}
              </div>
            )}

            {card.description && (
              <p className="ls-notice-text" style={{ fontStyle: 'italic', opacity: 0.9, marginTop: '4px', marginBottom: '8px', fontSize: '0.8rem', textAlign: 'left' }}>
                "{card.description}"
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
                <img src={card.profileImage} alt={profileName} className="ls-sc-avatar" />
              </div>
              <div className="ls-sc-user-info">
                <div className="ls-sc-title-row">
                  <div>
                    <h2>{profileName}</h2>
                    {fullName && card.nickname && fullName.toLowerCase() !== card.nickname.toLowerCase() && (
                      <span style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginTop: '2px' }}>
                        {fullName}
                      </span>
                    )}
                  </div>
                  <span className="ls-sc-match">{card.match} match</span>
                </div>
                <p className="ls-sc-role">
                  {card.role} {card.location && `• ${card.location}`}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                  {handleUrl && (
                    <a
                      href={handleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ls-sc-handle-pill"
                      style={{ color: '#FF5500', textDecoration: 'none' }}
                      title="Abrir SoundCloud"
                    >
                      <PiSoundcloudLogoFill style={{ color: '#FF5500' }} />
                      <span>SoundCloud</span>
                      <PiArrowSquareOutBold />
                    </a>
                  )}

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

            <p className="ls-sc-bio">{card.description || ''}</p>

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
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <PiPlayFill style={{ fontSize: '0.72rem', color: '#ffaa71' }} /> {track.plays} reproducciones
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <PiTimerBold style={{ fontSize: '0.75rem', color: '#ffaa71' }} /> {track.duration}
                            </span>
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

            {/* Footer action link & match action buttons */}
            <div className="ls-sc-modal-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  type="button"
                  className="ls-card-btn-action pass"
                  onClick={() => {
                    if (onDiscardProfile && card) {
                      onDiscardProfile(card)
                    }
                    onClose()
                  }}
                  style={{
                    flex: 1,
                    height: '44px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Descartar Perfil"
                >
                  <PiXBold style={{ fontSize: '1.15rem' }} /> Descartar
                </button>

                <button
                  type="button"
                  className="ls-card-btn-action like"
                  onClick={() => {
                    if (onConnectProfile && card) {
                      onConnectProfile(card)
                    }
                    onClose()
                  }}
                  style={{
                    flex: 1,
                    height: '44px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
                    border: 'none',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Conectar / Aceptar Match"
                >
                  <PiCheckBold style={{ fontSize: '1.15rem' }} /> Conectar Match
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
