import { useState, useRef, useEffect } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { FaSoundcloud, FaSpotify, FaInstagram } from 'react-icons/fa6'
import type { AppPage, Profile } from '../types'

type ValidationPageProps = {
  onNavigate?: (page: AppPage) => void
  profile?: Profile
  onProfileChange?: (field: keyof Profile, value: string | boolean | string[]) => void
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

export default function ValidationPage({ onNavigate, profile, onProfileChange }: ValidationPageProps) {
  const [soundcloud, setSoundcloud] = useState(profile?.soundcloud || '')
  const [instagram, setInstagram] = useState(profile?.instagram || '')
  const [spotify, setSpotify] = useState(profile?.spotify || '')
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
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    }
  }

  useEffect(() => {
    if (!showMap || !mapContainerRef.current || mapRef.current) return

    const initialPreset = PRESET_LOCATIONS.find((p) => p.label.toLowerCase() === location.toLowerCase())
    const centerLon = initialPreset ? initialPreset.lon : 13.405
    const centerLat = initialPreset ? initialPreset.lat : 52.520

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [centerLon, centerLat],
      zoom: 4,
    })

    map.addControl(new maplibregl.FullscreenControl())

    markerRef.current = new maplibregl.Marker({ color: '#a855f7' })
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

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [showMap])

  const handleValidate = () => {
    if (soundcloud) onProfileChange?.('soundcloud', soundcloud)
    if (instagram) onProfileChange?.('instagram', instagram)
    if (spotify) onProfileChange?.('spotify', spotify)
    if (location) onProfileChange?.('location', location)
    onNavigate?.('Discovery')
  }

  return (
    <div className="ls-auth-shell">
      <div className="ls-auth-card validation-card">
        <div className="ls-auth-brand">
          <div className="ls-brand-mark">L</div>
          <div>
            <div className="ls-brand-name">LinkedSound</div>
            <small>verify your profile</small>
          </div>
        </div>

        <h1>Profile validation</h1>
        <p className="ls-auth-subtitle">Add your profile links and confirm your identity before continuing.</p>

        <div className="ls-auth-form">
          <label>
            <span>
              <FaSoundcloud className="ls-field-icon" />
              SoundCloud URL (optional)
            </span>
            <input
              type="url"
              placeholder="https://soundcloud.com/your-profile"
              value={soundcloud}
              onChange={(e) => {
                setSoundcloud(e.target.value)
                onProfileChange?.('soundcloud', e.target.value)
              }}
            />
          </label>

          <label>
            <span>
              <FaInstagram className="ls-field-icon" />
              Instagram (optional)
            </span>
            <input
              type="text"
              placeholder="instagram.com/your-handle"
              value={instagram}
              onChange={(e) => {
                setInstagram(e.target.value)
                onProfileChange?.('instagram', e.target.value)
              }}
            />
          </label>

          <label>
            <span>
              <FaSpotify className="ls-field-icon" />
              Spotify profile (optional)
            </span>
            <input
              type="text"
              placeholder="open.spotify.com/artist/your-profile"
              value={spotify}
              onChange={(e) => {
                setSpotify(e.target.value)
                onProfileChange?.('spotify', e.target.value)
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
              <span>💡 Tip:</span>
              <span>
                Presiona <kbd>Tab</kbd> o <kbd>Enter</kbd> para autocompletar sugerencias o haz clic en el mapa.
              </span>
            </div>

            <div className="ls-map-actions-row">
              <button
                type="button"
                className="ls-map-toggle-btn"
                onClick={() => setShowMap((prev) => !prev)}
              >
                {showMap ? 'Ocultar mapa' : '📍 Elegir en mapa'}
              </button>
              {isLocating && <span className="ls-map-status">Buscando dirección...</span>}
              {isSearching && <span className="ls-map-status">Buscando ciudades...</span>}
              {showMap && <span className="ls-map-hint">Haz clic en el mapa para marcar tu posición</span>}
            </div>

            {showMap && <div ref={mapContainerRef} className="ls-map-container" />}
          </div>

          <div className="ls-validation-box">
            <span className="ls-status-indicator" />
            Verification pending review
          </div>

          <button type="button" className="ls-primary-button ls-auth-button" onClick={handleValidate}>
            Validate profile
          </button>
        </div>
      </div>
    </div>
  )
}
