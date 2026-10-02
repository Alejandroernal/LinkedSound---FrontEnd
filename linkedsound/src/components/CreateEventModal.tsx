import { useState, useRef, useEffect } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  PiXBold,
  PiCalendarPlusBold,
  PiMapPinBold,
  PiTicketBold,
  PiSparkleBold,
  PiCheckBold,
  PiWarningBold
} from 'react-icons/pi'
import type { ProfileCard } from '../data/mockData'

type CreateEventModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreateEvent: (newEvent: ProfileCard) => void
  userNickname?: string
  userLocation?: string
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

const genreOptions = [
  'Techno',
  'Tech House',
  'Live',
  'Synthwave',
  'Industrial',
  'Cyberpunk',
  'Ambient',
  'Minimal',
  'HardTrap',
  'Darkwave',
  'Electronic',
  'Vocal',
  'Experimental'
]

export default function CreateEventModal({
  isOpen,
  onClose,
  onCreateEvent,
  userNickname = 'Kaelen Voss',
  userLocation = 'Berlin, Germany',
}: CreateEventModalProps) {
  const [title, setTitle] = useState('')
  const [role, setRole] = useState('Showcase & Live Performance')
  const [location, setLocation] = useState(userLocation)
  const [country, setCountry] = useState('Alemania')
  const [province, setProvince] = useState('Berlín')
  const [city, setCity] = useState('Mitte')
  const [streetAddress, setStreetAddress] = useState('')

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [venue, setVenue] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('22:00')
  const [ticketUrl, setTicketUrl] = useState('')
  const [descript, setDescript] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Live', 'Techno'])
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80'
  )

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  const updateLocationFromParts = (c: string, p: string, ct: string, st: string) => {
    const parts = [st, ct, p, c].filter(Boolean)
    if (parts.length > 0) {
      setLocation(parts.join(', '))
    }
  }

  const reverseGeocode = async (lat: number, lon: number) => {
    setIsLocating(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      )
      const data = await response.json()
      const addr = data.address || {}
      const foundCity =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        ''
      const foundProvince = addr.state || addr.province || addr.region || ''
      const foundCountry = addr.country || ''
      const foundStreet = [addr.road, addr.house_number].filter(Boolean).join(' ') || addr.pedestrian || ''

      if (foundCountry) setCountry(foundCountry)
      if (foundProvince) setProvince(foundProvince)
      if (foundCity) setCity(foundCity)
      if (foundStreet) setStreetAddress(foundStreet)

      const label = [foundStreet, foundCity, foundProvince, foundCountry].filter(Boolean).join(', ')
      setLocation(label || `${lat.toFixed(3)}, ${lon.toFixed(3)}`)
    } catch {
      setLocation(`${lat.toFixed(3)}, ${lon.toFixed(3)}`)
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
          const addr = item.address || {}
          const foundCity =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            item.display_name.split(',')[0]
          const foundCountry = addr.country || ''
          return {
            label: [foundCity, foundCountry].filter(Boolean).join(', '),
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            full: item.display_name,
          }
        })
        setSuggestions(results)
        setShowSuggestions(true)
      } else {
        const matches = PRESET_LOCATIONS.filter((loc) =>
          loc.label.toLowerCase().includes(trimmed)
        )
        setSuggestions(matches)
        setShowSuggestions(matches.length > 0)
      }
    } catch {
      const matches = PRESET_LOCATIONS.filter((loc) =>
        loc.label.toLowerCase().includes(trimmed)
      )
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectLocation = (loc: LocationSuggestion) => {
    setLocation(loc.label)
    setShowSuggestions(false)

    if (mapRef.current) {
      mapRef.current.flyTo({ center: [loc.lon, loc.lat], zoom: 12 })
      if (markerRef.current) {
        markerRef.current.setLngLat([loc.lon, loc.lat])
      } else {
        markerRef.current = new maplibregl.Marker({ color: '#a855f7' })
          .setLngLat([loc.lon, loc.lat])
          .addTo(mapRef.current)
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

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === 'Enter') && showSuggestions && suggestions.length > 0) {
      e.preventDefault()
      handleSelectLocation(suggestions[0])
    }
  }

  useEffect(() => {
    if (!isOpen || !showMap || !mapContainerRef.current) {
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

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [13.405, 52.52],
      zoom: 10,
    })

    map.addControl(new maplibregl.FullscreenControl())
    const timer = setTimeout(() => map.resize(), 150)

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat])
      } else {
        markerRef.current = new maplibregl.Marker({ color: '#00e5ff' })
          .setLngLat([lng, lat])
          .addTo(map)
      }
      reverseGeocode(lat, lng)
    })

    mapRef.current = map

    return () => {
      clearTimeout(timer)
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
  }, [isOpen, showMap])

  if (!isOpen) return null

  const handleGenreToggle = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g].slice(0, 4)
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const now = new Date()
    // Formatting local date as YYYY-MM-DD
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    if (!title.trim() || !eventDate) {
      setValidationError('Por favor completa el título y la fecha del evento.')
      return
    }

    if (eventDate < todayStr) {
      setValidationError('No puedes crear eventos con fechas pasadas. La fecha debe ser posterior o igual al día de hoy.')
      return
    }

    if (eventDate === todayStr && eventTime) {
      const [hours, minutes] = eventTime.split(':').map(Number)
      const currentHours = now.getHours()
      const currentMinutes = now.getMinutes()

      if (hours < currentHours || (hours === currentHours && minutes <= currentMinutes)) {
        setValidationError('Para eventos en el día de hoy, la hora debe ser posterior a la hora actual.')
        return
      }
    }

    const finalLocation =
      [streetAddress.trim(), city.trim(), province.trim(), country.trim()].filter(Boolean).join(', ') ||
      location.trim() ||
      'Online / Global'

    const newEvent: ProfileCard = {
      nickname: title.trim(),
      role: role.trim() || 'Evento Live',
      location: finalLocation,
      country: country.trim(),
      province: province.trim(),
      city: city.trim(),
      streetAddress: streetAddress.trim(),
      interestGenres: selectedGenres,
      image: image.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
      match: '100%',
      descript: descript.trim() || 'Nuevo evento publicado por la comunidad en LinkedSound.',
      badge: 'Evento',
      itemRole: 'Evento',
      isProfile: false,
      eventDate,
      eventTime: eventTime || '22:00',
      venue: venue.trim() || 'Venue Principal',
      ticketUrl: ticketUrl.trim() || 'https://linkedsound.app/tickets',
      isFinished: false,
      soundcloudUrl: '',
      spotifyUrl: '',
      instagramUrl: '',
    }

    onCreateEvent(newEvent)
    onClose()

    // Reset form
    setTitle('')
    setVenue('')
    setEventDate('')
    setDescript('')
  }

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div
        className="ls-modal-content ls-create-event-solid-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '100%' }}
      >
        <button
          type="button"
          className="ls-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <PiXBold />
        </button>

        <form onSubmit={handleSubmit} className="ls-report-form" noValidate>
          <div className="ls-report-header">
            <div
              className="ls-report-badge-icon"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6d5efc)',
                color: '#fff',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
              }}
            >
              <PiCalendarPlusBold />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Publicar Nuevo Evento</h3>
              <p className="ls-report-subtitle">
                Organizador: <strong>{userNickname}</strong>
              </p>
            </div>
          </div>

          {validationError && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <PiWarningBold size={18} />
              <span>{validationError}</span>
            </div>
          )}

          <div className="ls-form-group">
            <label className="ls-form-label">Título del Evento *</label>
            <input
              type="text"
              placeholder="Ej. Synth Lab Live Night, Berlin Underground Jam..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (validationError) setValidationError(null)
              }}
              className="ls-select-input"
              style={{
                borderColor: validationError && !title.trim() ? '#ef4444' : undefined,
                boxShadow: validationError && !title.trim() ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="ls-form-group">
              <label className="ls-form-label">Concepto / Formato</label>
              <input
                type="text"
                placeholder="Ej. Live Session, Showcase"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="ls-select-input"
              />
            </div>

            <div className="ls-form-group">
              <label className="ls-form-label">
                Club / Venue <PiMapPinBold style={{ color: '#a855f7' }} />
              </label>
              <input
                type="text"
                placeholder="Ej. Watergate Club, Niceto..."
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="ls-select-input"
              />
            </div>
          </div>

          {/* Bloque Detallado de Localización (País, Provincia, Localidad, Calle y Altura) */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px', margin: '8px 0 14px 0' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#c084fc', fontWeight: 700, marginBottom: '10px' }}>
              <PiMapPinBold style={{ marginRight: '4px' }} /> Detalle de Localización del Evento
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div className="ls-form-group">
                <label className="ls-form-label" style={{ fontSize: '0.74rem' }}>País</label>
                <input
                  type="text"
                  placeholder="Ej. Argentina, Alemania, España..."
                  value={country}
                  onChange={(e) => {
                    const val = e.target.value
                    setCountry(val)
                    updateLocationFromParts(val, province, city, streetAddress)
                  }}
                  className="ls-select-input"
                />
              </div>
              <div className="ls-form-group">
                <label className="ls-form-label" style={{ fontSize: '0.74rem' }}>Provincia / Estado</label>
                <input
                  type="text"
                  placeholder="Ej. Buenos Aires, Berlín, Madrid..."
                  value={province}
                  onChange={(e) => {
                    const val = e.target.value
                    setProvince(val)
                    updateLocationFromParts(country, val, city, streetAddress)
                  }}
                  className="ls-select-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="ls-form-group">
                <label className="ls-form-label" style={{ fontSize: '0.74rem' }}>Localidad / Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej. Palermo, Mitte, Malasaña..."
                  value={city}
                  onChange={(e) => {
                    const val = e.target.value
                    setCity(val)
                    updateLocationFromParts(country, province, val, streetAddress)
                  }}
                  className="ls-select-input"
                />
              </div>
              <div className="ls-form-group">
                <label className="ls-form-label" style={{ fontSize: '0.74rem' }}>Calle y Altura</label>
                <input
                  type="text"
                  placeholder="Ej. Niceto Vega 5510, Skalitzer Str. 130..."
                  value={streetAddress}
                  onChange={(e) => {
                    const val = e.target.value
                    setStreetAddress(val)
                    updateLocationFromParts(country, province, city, val)
                  }}
                  className="ls-select-input"
                />
              </div>
            </div>
          </div>

          {/* Selector Completo de Ubicación con Mapa y Geocodificación OSM */}
          <div className="ls-form-group wide-field ls-location-group" style={{ position: 'relative' }}>
            <label className="ls-form-label">Location / Ubicación del Evento</label>
            <div>
              <div className="ls-location-input-wrapper" style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Escribe tu ciudad o busca en el mapa (ej. Madrid, Berlín, Buenos Aires...)"
                  value={location}
                  onChange={(e) => {
                    const val = e.target.value
                    setLocation(val)
                    searchLocation(val)
                  }}
                  onKeyDown={handleLocationKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                  className="ls-select-input"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="ls-autocomplete-dropdown" role="listbox">
                    {suggestions.map((item, idx) => (
                      <div
                        key={`${item.lat}-${item.lon}-${idx}`}
                        className={`ls-autocomplete-item ${idx === 0 ? 'active' : ''}`}
                        role="option"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelectLocation(item)
                        }}
                      >
                        <span className="ls-ac-text">{item.full}</span>
                        <span className="ls-ac-badge">
                          {idx === 0 ? 'Presiona Tab ↹' : 'Elegir'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="ls-tab-hint">
                  <span>Sugerencia rápida: presiona <kbd>Tab</kbd> o <kbd>Enter</kbd> para elegir <strong>{suggestions[0].label}</strong></span>
                </div>
              )}

              <div className="ls-map-actions-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  className="ls-map-toggle-btn"
                  onClick={() => setShowMap((prev) => !prev)}
                >
                  {showMap ? 'Ocultar mapa' : 'Elegir en mapa'}
                </button>
                <button
                  type="button"
                  className="ls-map-toggle-btn"
                  style={{ background: 'rgba(0, 229, 255, 0.12)', borderColor: 'rgba(0, 229, 255, 0.3)', color: '#00e5ff' }}
                  onClick={handleUseCurrentLocation}
                >
                  Usar mi ubicación actual
                </button>
                {isLocating && <span className="ls-map-status">Buscando dirección...</span>}
                {isSearching && <span className="ls-map-status">Buscando ciudades...</span>}
              </div>

              {showMap && (
                <div
                  ref={mapContainerRef}
                  className="ls-map-container"
                  style={{ width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', marginTop: '10px' }}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="ls-form-group">
              <label className="ls-form-label">Fecha *</label>
              <input
                type="date"
                min={new Date().toLocaleDateString('sv-SE')}
                value={eventDate}
                onChange={(e) => {
                  setEventDate(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                className="ls-select-input"
                style={{
                  colorScheme: 'dark',
                  borderColor: validationError && !eventDate ? '#ef4444' : undefined,
                  boxShadow: validationError && !eventDate ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined
                }}
              />
            </div>
            <div className="ls-form-group">
              <label className="ls-form-label">Hora</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="ls-select-input"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div className="ls-form-group">
            <label className="ls-form-label">
              Enlace de Entradas / Tickets <PiTicketBold style={{ color: '#00e5ff' }} />
            </label>
            <input
              type="url"
              placeholder="https://eventbrite.com/tu-evento"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              className="ls-select-input"
            />
          </div>

          <div className="ls-form-group">
            <label className="ls-form-label">Descripción / Lineup</label>
            <textarea
              className="ls-textarea-input"
              rows={3}
              placeholder="Describe la propuesta musical, DJs o artistas invitados..."
              value={descript}
              onChange={(e) => setDescript(e.target.value)}
            />
          </div>

          <div className="ls-form-group">
            <label className="ls-form-label">Géneros Destacados (máx 4)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {genreOptions.map((g) => {
                const isSelected = selectedGenres.includes(g)
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGenreToggle(g)}
                    className={`ls-genre-chip ${isSelected ? 'is-selected' : ''}`}
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                  >
                    {isSelected && <PiCheckBold style={{ marginRight: '3px' }} />}
                    {g}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="ls-form-group">
            <label className="ls-form-label">URL de Imagen Promocional</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="ls-select-input"
            />
          </div>

          <div className="ls-modal-actions" style={{ marginTop: '12px' }}>
            <button type="button" className="ls-secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="ls-primary-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PiSparkleBold /> Publicar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


