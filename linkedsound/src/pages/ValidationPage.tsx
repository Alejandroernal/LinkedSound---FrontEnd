import { useState, useRef, useEffect } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { FaSoundcloud, FaSpotify, FaInstagram } from 'react-icons/fa6'
import { PiMapPinBold, PiEyeSlashBold, PiNavigationArrowBold, PiWarningOctagonBold, PiCheckBold } from 'react-icons/pi'
import type { AppPage, Profile } from '../types'

type ValidationPageProps = {
  onNavigate?: (page: AppPage) => void
  profile?: Profile
  onProfileChange?: (field: keyof Profile, value: any) => void
  onRegisterComplete?: () => Promise<{ success: boolean; message?: string } | void> | void
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
  const [location, setLocation] = useState(profile?.location || '')
  const [verifiedLocation, setVerifiedLocation] = useState(profile?.location || '')
  const [isLocationVerified, setIsLocationVerified] = useState(Boolean(profile?.location && profile.location.trim()))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({})

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
      setVerifiedLocation(finalLoc)
      setIsLocationVerified(true)
      onProfileChange?.('location', finalLoc)
      if (validationError && invalidFields.location) {
        setInvalidFields(prev => ({ ...prev, location: false }))
        setValidationError(null)
      }
    } catch {
      const fallback = `${lat.toFixed(3)}, ${lon.toFixed(3)}`
      setLocation(fallback)
      setVerifiedLocation(fallback)
      setIsLocationVerified(true)
      onProfileChange?.('location', fallback)
      if (validationError && invalidFields.location) {
        setInvalidFields(prev => ({ ...prev, location: false }))
        setValidationError(null)
      }
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

    if (val.trim().toLowerCase() !== verifiedLocation.trim().toLowerCase()) {
      setIsLocationVerified(false)
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(val)
    }, 350)
  }

  const applySelectedLocation = (item: LocationSuggestion) => {
    setLocation(item.label)
    setVerifiedLocation(item.label)
    setIsLocationVerified(true)
    onProfileChange?.('location', item.label)
    setShowSuggestions(false)

    if (validationError && invalidFields.location) {
      setInvalidFields(prev => ({ ...prev, location: false }))
      setValidationError(null)
    }

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
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        const target = suggestions[highlightedIndex] || suggestions[0]
        applySelectedLocation(target)
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

  const handleValidate = async () => {
    const sc = soundcloud.trim()
    const loc = location.trim()

    const errors: Record<string, boolean> = {}
    if (!sc) errors.soundcloud = true

    const isLocValid = isLocationVerified && loc.length > 0 && loc.toLowerCase() === verifiedLocation.trim().toLowerCase()
    if (!isLocValid) errors.location = true

    if (!sc && !isLocValid) {
      setInvalidFields(errors)
      setValidationError('SoundCloud y la selección de una localidad válida son obligatorios para finalizar la configuración. Si no los tienes por ahora, usa "Saltar por ahora".')
      return
    }

    if (!sc) {
      setInvalidFields(errors)
      setValidationError('SoundCloud es un campo obligatorio para finalizar la configuración. Si prefieres completarlo más tarde, usa "Saltar por ahora".')
      return
    }

    if (!isLocValid) {
      setInvalidFields(errors)
      setValidationError('Debes seleccionar una localidad válida de la lista desplegable sugerida o seleccionarla directamente en el mapa.')
      return
    }

    setInvalidFields({})
    setValidationError(null)

    onProfileChange?.('soundcloudUrl', sc)
    onProfileChange?.('soundcloud', sc)
    if (instagram.trim()) {
      onProfileChange?.('instagramUrl', instagram.trim())
      onProfileChange?.('instagram', instagram.trim())
    }
    if (spotify.trim()) {
      onProfileChange?.('spotifyUrl', spotify.trim())
      onProfileChange?.('spotify', spotify.trim())
    }
    onProfileChange?.('location', loc)

    setIsSubmitting(true)
    try {
      const result = await onRegisterComplete?.()
      if (result && typeof result === 'object' && 'success' in result && !result.success) {
        setValidationError(result.message || 'Error al completar el registro con el servidor.')
        return
      }
      onNavigate?.('Discovery')
    } catch (err: any) {
      setValidationError(err?.message || 'Error al procesar el registro con el servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    if (soundcloud.trim()) {
      onProfileChange?.('soundcloudUrl', soundcloud.trim())
      onProfileChange?.('soundcloud', soundcloud.trim())
    }
    if (instagram.trim()) {
      onProfileChange?.('instagramUrl', instagram.trim())
      onProfileChange?.('instagram', instagram.trim())
    }
    if (spotify.trim()) {
      onProfileChange?.('spotifyUrl', spotify.trim())
      onProfileChange?.('spotify', spotify.trim())
    }
    const loc = location.trim()
    const isLocValid = isLocationVerified && loc.length > 0 && loc.toLowerCase() === verifiedLocation.trim().toLowerCase()
    if (isLocValid) {
      onProfileChange?.('location', loc)
    } else {
      onProfileChange?.('location', 'No especificada')
    }

    setIsSubmitting(true)
    try {
      await onRegisterComplete?.()
      onNavigate?.('Discovery')
    } catch {
      onNavigate?.('Discovery')
    } finally {
      setIsSubmitting(false)
    }
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
              SoundCloud Perfil URL * (Obligatorio para finalizar)
            </span>
            <input
              type="url"
              placeholder="https://soundcloud.com/tu-usuario"
              value={soundcloud}
              autoComplete="off"
              onChange={(e) => {
                const val = e.target.value
                setSoundcloud(val)
                if (validationError && invalidFields.soundcloud) {
                  setInvalidFields(prev => ({ ...prev, soundcloud: false }))
                  setValidationError(null)
                }
                onProfileChange?.('soundcloudUrl', val)
                onProfileChange?.('soundcloud', val)
              }}
              style={{
                borderColor: invalidFields.soundcloud ? '#ef4444' : undefined,
                background: invalidFields.soundcloud ? 'rgba(239, 68, 68, 0.05)' : undefined
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
              <span>Ubicación * (Obligatoria para finalizar)</span>
              <div className="ls-location-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Escribe tu ciudad (ej. Madrid, Berlín, Buenos Aires...)"
                  value={location}
                  autoComplete="off"
                  onChange={(e) => {
                    handleLocationInputChange(e)
                    if (validationError && invalidFields.location) {
                      setInvalidFields(prev => ({ ...prev, location: false }))
                      setValidationError(null)
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
                  onBlur={() => {
                    // Retardo para permitir clic en la sugerencia si se usa mouse
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                  style={{
                    borderColor: invalidFields.location ? '#ef4444' : undefined,
                    background: invalidFields.location ? 'rgba(239, 68, 68, 0.05)' : undefined
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
                Usa <kbd>Tab</kbd> o <kbd>Enter</kbd> para seleccionar la localidad sugerida o haz clic directamente en el mapa.
              </span>
            </div>

            {isLocationVerified && location.trim().length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#10b981',
                  fontSize: '0.78rem',
                  marginTop: '6px',
                  fontWeight: 500,
                }}
              >
                <PiCheckBold style={{ fontSize: '0.95rem' }} />
                <span>Localidad verificada: {verifiedLocation}</span>
              </div>
            )}

            {!isLocationVerified && location.trim().length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#f59e0b',
                  fontSize: '0.78rem',
                  marginTop: '6px',
                  fontWeight: 500,
                }}
              >
                <PiWarningOctagonBold style={{ fontSize: '0.95rem' }} />
                <span>Debes seleccionar una opción de la lista (clic, Tab o Enter) o marcar el mapa.</span>
              </div>
            )}

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
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px' }} title="Buscando ubicación" aria-label="Cargando">
                    <span className="ls-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderColor: '#a855f7 #a855f7 transparent transparent', display: 'inline-block' }} />
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

                {/* Overlay solo spinner superior derecho sin texto que colisione */}
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
                      padding: '8px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
                    }}
                    title={isLocating ? 'Buscando tu ubicación...' : 'Buscando dirección...'}
                    aria-label="Cargando ubicación"
                  >
                    <span className="ls-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: '#a855f7 #a855f7 transparent transparent', display: 'inline-block' }} />
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
              <span className="ls-status-indicator" style={{ width: '10px', height: '10px', borderRadius: '50%', background: (soundcloud.trim() && location.trim()) ? '#27ae60' : '#f59e0b', display: 'inline-block' }} />
              <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                {(soundcloud.trim() && location.trim()) ? 'Perfil Listo para Discovery' : 'Campos Requeridos'}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
              {(soundcloud.trim() && location.trim())
                ? '¡Excelente! Tu cuenta de SoundCloud y tu ubicación han sido configuradas y tu perfil estará activo en Discovery.'
                : 'Para finalizar la configuración debes ingresar SoundCloud y tu ubicación. Si no cuentas con ellos por ahora o deseas cargarlos luego, usa el botón "Saltar por ahora".'}
            </p>
          </div>

          {validationError && (
            <div
              style={{
                margin: '10px 0 14px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <PiWarningOctagonBold style={{ fontSize: '1.2rem', color: '#ef4444', flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          <button
            type="button"
            className="ls-primary-button ls-auth-button"
            onClick={handleValidate}
            disabled={isSubmitting}
            style={{ width: '100%', marginBottom: '10px', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Guardando configuración...' : 'Finalizar Configuración'}
          </button>

          <button
            type="button"
            className="ls-secondary-button"
            onClick={handleSkip}
            disabled={isSubmitting}
            style={{ width: '100%', border: '1px dashed rgba(255, 255, 255, 0.25)', color: 'rgba(255, 255, 255, 0.85)' }}
          >
            Saltar por ahora
          </button>
        </div>
      </div>
    </div>
  )
}
