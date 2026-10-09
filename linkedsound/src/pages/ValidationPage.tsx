import { useState, useRef, useEffect } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { FaSoundcloud, FaSpotify, FaInstagram } from 'react-icons/fa6'
import { PiMapPinBold, PiEyeSlashBold, PiNavigationArrowBold } from 'react-icons/pi'
import type { AppPage, Profile } from '../types'

type ValidationPageProps = {
  onNavigate?: (page: AppPage) => void
  profile?: Profile
  onProfileChange?: (field: keyof Profile, value: any) => void
  onRegisterComplete?: () => void
}

type LocationSuggestion = {
  label: string
  lat: number
  lon: number
  full: string
}

const PRESET_LOCATIONS: LocationSuggestion[] = [
  { label: 'Berlin, Germany', lat: 52.520, lon: 13.405, full: 'Berlin, Germany' },
  { label: 'London, United Kingdom', lat: 51.507, lon: -0.127, full: 'London, England, United Kingdom' },
  { label: 'New York, USA', lat: 40.712, lon: -74.006, full: 'New York, NY, United States' },
  { label: 'Los Angeles, USA', lat: 34.052, lon: -118.243, full: 'Los Angeles, CA, United States' },
  { label: 'Paris, France', lat: 48.856, lon: 2.352, full: 'Paris, Île-de-France, France' },
  { label: 'Madrid, Spain', lat: 40.416, lon: -3.703, full: 'Madrid, Community of Madrid, Spain' },
  { label: 'Buenos Aires, Argentina', lat: -34.603, lon: -58.381, full: 'Buenos Aires, Argentina' },
  { label: 'Tokyo, Japan', lat: 35.676, lon: 139.650, full: 'Tokyo, Japan' },
  { label: 'Amsterdam, Netherlands', lat: 52.367, lon: 4.904, full: 'Amsterdam, Netherlands' },
  { label: 'Mexico City, Mexico', lat: 19.432, lon: -99.133, full: 'Mexico City, Mexico' },
]

export default function ValidationPage({ onNavigate, profile, onProfileChange, onRegisterComplete }: ValidationPageProps) {
  const [soundcloud, setSoundcloud] = useState(profile?.soundcloudUrl || profile?.soundcloud || '')
  const [instagram, setInstagram] = useState(profile?.instagramUrl || profile?.instagram || '')
  const [spotify, setSpotify] = useState(profile?.spotifyUrl || profile?.spotify || '')
  const [location, setLocation] = useState(profile?.location || 'Berlin, Germany')

  const [showMap, setShowMap] = useState(true)
  const [isLocating, setIsLocating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reverseGeocode = async (lat: number, lon: number) => {
    setIsLocating(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      )
      const data = await response.json()
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        ''
      const country = data.address?.country || ''
      const label = [city, country].filter(Boolean).join(', ')
      const finalLoc = label || `${lat.toFixed(3)}, ${lon.toFixed(3)}`
      setLocation(finalLoc)
      onProfileChange?.('location', finalLoc)
    } catch {
      const fallback = `${lat.toFixed(3)}, ${lon.toFixed(3)}`
      setLocation(fallback)
      onProfileChange?.('location', fallback)
    } finally {
      setIsLocating(false)
    }
  }

  const searchLocation = async (query: string) => {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`
      )
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        const results: LocationSuggestion[] = data.map((item: any) => {
          const city =
            item.address?.city ||
            item.address?.town ||
            item.address?.village ||
            item.address?.municipality ||
            item.name ||
            ''
          const country = item.address?.country || ''
          const label = [city, country].filter(Boolean).join(', ') || item.display_name.split(',').slice(0, 2).join(',')
          return {
            label,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            full: item.display_name,
          }
        })
        setSuggestions(results)
        setShowSuggestions(true)
        setHighlightedIndex(0)
      } else {
        const matched = PRESET_LOCATIONS.filter((p) => p.label.toLowerCase().includes(trimmed))
        setSuggestions(matched)
        setShowSuggestions(matched.length > 0)
        setHighlightedIndex(0)
      }
    } catch {
      const matched = PRESET_LOCATIONS.filter((p) => p.label.toLowerCase().includes(trimmed))
      setSuggestions(matched)
      setShowSuggestions(matched.length > 0)
      setHighlightedIndex(0)
    } finally {
      setIsSearching(false)
    }
  }

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocation(val)
    onProfileChange?.('location', val)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(val)
    }, 350)
  }

  const applySelectedLocation = (item: LocationSuggestion) => {
    setLocation(item.label)
    onProfileChange?.('location', item.label)
    setShowSuggestions(false)

    if (!showMap) {
      setShowMap(true)
    }

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 11, essential: true })
        if (markerRef.current) {
          markerRef.current.setLngLat([item.lon, item.lat])
        } else {
          markerRef.current = new maplibregl.Marker({ color: '#a855f7' })
            .setLngLat([item.lon, item.lat])
            .addTo(mapRef.current)
        }
      }
    }, 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'Tab') {
        // Seleccion mediante tabulacion
        e.preventDefault()
        const target = suggestions[highlightedIndex] || suggestions[0]
        applySelectedLocation(target)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const target = suggestions[highlightedIndex] || suggestions[0]
        applySelectedLocation(target)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    if (!showMap) {
      setShowMap(true)
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        reverseGeocode(latitude, longitude)

        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [longitude, latitude], zoom: 12, essential: true })
            if (markerRef.current) {
              markerRef.current.setLngLat([longitude, latitude])
            } else {
              markerRef.current = new maplibregl.Marker({ color: '#a855f7' })
                .setLngLat([longitude, latitude])
                .addTo(mapRef.current)
            }
          }
        }, 100)
      },
      () => {
        setIsLocating(false)
      }
    )
  }

  useEffect(() => {
    if (!showMap || !mapContainerRef.current) {
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

    if (mapRef.current) {
      mapRef.current.resize()
      return
    }

    // Limpiar residuos en el contenedor antes de crear la instancia única
    mapContainerRef.current.innerHTML = ''

    const initialPreset = PRESET_LOCATIONS.find((p) => p.label.toLowerCase() === location.toLowerCase())
    const centerLon = initialPreset ? initialPreset.lon : 13.405
    const centerLat = initialPreset ? initialPreset.lat : 52.520

    let timer: ReturnType<typeof setTimeout> | null = null

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [centerLon, centerLat],
        zoom: 10,
        renderWorldCopies: false,
      })

      map.addControl(new maplibregl.FullscreenControl())
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
      timer = setTimeout(() => map.resize(), 150)

      markerRef.current = new maplibregl.Marker({ color: '#00e5ff' })
        .setLngLat([centerLon, centerLat])
        .addTo(map)

      map.on('click', (event) => {
        const { lng, lat } = event.lngLat

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat])
        } else {
          markerRef.current = new maplibregl.Marker({ color: '#a855f7' })
            .setLngLat([lng, lat])
            .addTo(map)
        }

        reverseGeocode(lat, lng)
      })

      mapRef.current = map
    } catch (err) {
      console.error('Error initializing map:', err)
    }

    return () => {
      if (timer) clearTimeout(timer)
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
  }, [showMap])

  const handleValidate = () => {
    if (soundcloud) {
      onProfileChange?.('soundcloudUrl', soundcloud)
      onProfileChange?.('soundcloud', soundcloud)
    }
    if (instagram) {
      onProfileChange?.('instagramUrl', instagram)
      onProfileChange?.('instagram', instagram)
    }
    if (spotify) {
      onProfileChange?.('spotifyUrl', spotify)
      onProfileChange?.('spotify', spotify)
    }
    if (location) onProfileChange?.('location', location)
    onRegisterComplete?.()
    onNavigate?.('Discovery')
  }

  const handleSkip = () => {
    onRegisterComplete?.()
    onNavigate?.('Discovery')
  }

  return (
    <div className="ls-auth-shell">
      <div className="ls-auth-card validation-card">
        <div className="ls-auth-brand">
          <div className="ls-brand-mark">L</div>
          <div>
            <div className="ls-brand-name">LinkedSound</div>
            <small>completa tu perfil</small>
          </div>
        </div>

        <h1>Configuración de Perfil (Onboarding)</h1>
        <p className="ls-auth-subtitle">Vincula tus redes musicales y confirma tu ubicación para comenzar en LinkedSound.</p>

        <div className="ls-auth-form">
          <label>
            <span>
              <FaSoundcloud className="ls-field-icon" />
              SoundCloud Perfil URL (Opcional)
            </span>
            <input
              type="url"
              placeholder="https://soundcloud.com/tu-usuario"
              value={soundcloud}
              onChange={(e) => {
                const val = e.target.value
                setSoundcloud(val)
                onProfileChange?.('soundcloudUrl', val)
                onProfileChange?.('soundcloud', val)
              }}
            />
          </label>

          <label>
            <span>
              <FaSoundcloud className="ls-field-icon" style={{ color: '#ff7700' }} />
              Track o Muestra Destacada (URL opcional de SoundCloud)
            </span>
            <input
              type="url"
              placeholder="https://soundcloud.com/tu-usuario/tu-cancion-destacada"
              value={(profile?.tracks && profile.tracks[1]?.soundcloudLink) || ''}
              onChange={(e) => {
                const val = e.target.value
                const currentTracks = profile?.tracks || [
                  { id: 't0', title: 'Último tema subido', plays: '0', duration: '--:--', genre: 'Principal' }
                ]
                const updatedTracks = [
                  currentTracks[0],
                  {
                    id: 't_custom',
                    title: 'Track Destacado',
                    plays: 'Muestra',
                    duration: 'SoundCloud',
                    genre: 'Destacado',
                    soundcloudLink: val
                  }
                ]
                onProfileChange?.('tracks', updatedTracks)
              }}
            />
            <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>
              * Se mostrará automáticamente tu último tema de SoundCloud y opcionalmente este track destacado en tu perfil.
            </small>
          </label>

          <label>
            <span>
              <FaInstagram className="ls-field-icon" />
              Instagram (Opcional)
            </span>
            <input
              type="text"
              placeholder="instagram.com/tu-usuario"
              value={instagram}
              onChange={(e) => {
                const val = e.target.value
                setInstagram(val)
                onProfileChange?.('instagramUrl', val)
                onProfileChange?.('instagram', val)
              }}
            />
          </label>

          <label>
            <span>
              <FaSpotify className="ls-field-icon" />
              Perfil de Spotify (Opcional)
            </span>
            <input
              type="text"
              placeholder="open.spotify.com/artist/tu-perfil"
              value={spotify}
              onChange={(e) => {
                const val = e.target.value
                setSpotify(val)
                onProfileChange?.('spotifyUrl', val)
                onProfileChange?.('spotify', val)
              }}
            />
          </label>

          <div className="ls-location-group">

            <label>
              <span>Ubicación</span>
              <div className="ls-location-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Escribe tu ciudad (ej. Madrid, Berlín, Buenos Aires...)"
                  value={location}
                  onChange={handleLocationInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
                  onBlur={() => {
                    // Retardo para permitir clic en la sugerencia si se usa mouse
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="ls-autocomplete-dropdown" role="listbox">
                    {suggestions.map((item, idx) => (
                      <div
                        key={`${item.lat}-${item.lon}-${idx}`}
                        className={`ls-autocomplete-item ${idx === highlightedIndex ? 'active' : ''}`}
                        role="option"
                        aria-selected={idx === highlightedIndex}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          applySelectedLocation(item)
                        }}
                      >
                        <span className="ls-ac-text">{item.full}</span>
                        <span className="ls-ac-badge">{idx === highlightedIndex ? 'Tab / Enter' : 'Elegir'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </label>

            <div className="ls-tab-hint">
              <span>Tip:</span>
              <span>
                Presiona <kbd>Tab</kbd> o <kbd>Enter</kbd> para autocompletar sugerencias o haz clic en el mapa.
              </span>
            </div>

            {!showMap && (
              <div className="ls-map-actions-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  className="ls-map-toggle-btn"
                  onClick={() => setShowMap(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <PiMapPinBold />
                  Elegir en mapa
                </button>
                {(isLocating || isSearching) && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#c084fc' }}>
                    <span className="ls-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', display: 'inline-block' }} />
                    <span>{isLocating ? 'Obteniendo ubicación...' : 'Buscando...'}</span>
                  </div>
                )}
              </div>
            )}

            {showMap && (
              <div
                className="ls-map-wrapper"
                style={{
                  position: 'relative',
                  width: '100%',
                  marginTop: '10px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div
                  ref={mapContainerRef}
                  className="ls-map-container"
                  style={{ width: '100%', height: '260px', borderRadius: '12px', marginTop: 0 }}
                />

                {/* Overlay controles flotantes superior izquierdo */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 10,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowMap(false)}
                    style={{
                      pointerEvents: 'auto',
                      background: 'rgba(15, 19, 37, 0.88)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <PiEyeSlashBold />
                    Ocultar mapa
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    style={{
                      pointerEvents: 'auto',
                      background: 'rgba(15, 19, 37, 0.88)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0, 229, 255, 0.45)',
                      color: '#00e5ff',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <PiNavigationArrowBold />
                    {isLocating ? 'Detectando...' : 'Usar mi ubicación actual'}
                  </button>
                </div>

                {/* Overlay estado/carga superior derecho */}
                {(isLocating || isSearching) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 10,
                      background: 'rgba(15, 19, 37, 0.92)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
                    }}
                  >
                    <span className="ls-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderColor: '#a855f7 #a855f7 transparent transparent', display: 'inline-block' }} />
                    <span>{isLocating ? 'Buscando tu ubicación...' : 'Buscando dirección...'}</span>
                  </div>
                )}

                {/* Overlay sugerencia inferior izquierdo */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 10,
                    background: 'rgba(15, 19, 37, 0.8)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.72rem',
                    pointerEvents: 'none'
                  }}
                >
                  Haz clic en el mapa para marcar tu posición
                </div>
              </div>
            )}
          </div>

          <div className="ls-validation-box" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '14px 16px', margin: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="ls-status-indicator" style={{ width: '10px', height: '10px', borderRadius: '50%', background: soundcloud ? '#27ae60' : '#f59e0b', display: 'inline-block' }} />
              <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                {soundcloud ? 'Perfil Listo para Discovery' : 'Vinculación de Música Opcional (RF-01 / RF-08)'}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
              {soundcloud
                ? '¡Excelente! Tu cuenta o muestra de SoundCloud ha sido vinculada y tu perfil estará activo en Discovery.'
                : 'Vincular SoundCloud no es un requisito bloqueante para completar tu registro. Puedes omitir este paso ahora y tu perfil se activará en las recomendaciones de Discovery cuando cargues tu música desde la edición de tu perfil.'}
            </p>
          </div>

          <button type="button" className="ls-primary-button ls-auth-button" onClick={handleValidate} style={{ width: '100%', marginBottom: '10px' }}>
            Finalizar Configuración
          </button>

          <button
            type="button"
            className="ls-secondary-button"
            onClick={handleSkip}
            style={{ width: '100%', border: '1px dashed rgba(255, 255, 255, 0.25)', color: 'rgba(255, 255, 255, 0.85)' }}
          >
            Omitir por ahora (Continuar más tarde)
          </button>
        </div>
      </div>
    </div>
  )
}
