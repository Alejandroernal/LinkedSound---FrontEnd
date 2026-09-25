import { useState, useRef, useEffect } from 'react'
import { FaSoundcloud, FaSpotify, FaInstagram } from 'react-icons/fa6'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import type { AppPage, Profile } from '../types'

type ProfilePageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile: Profile
  onProfileChange: (field: keyof Profile, value: string | boolean | string[]) => void
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

export default function ProfilePage({ activePage, onNavigate, profile, onProfileChange }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showMap, setShowMap] = useState(false)
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

  const genreOptions = [
    'Synthwave',
    'Electronic',
    'Dark Pop',
    'Hip Hop',
    'Indie',
    'Tech House',
    'Ambient',
    'Jazz',
    'R&B',
    'Rock',
    'Drum & Bass',
    'Lo-Fi',
  ]

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onProfileChange('profileImage', result)
      }
      reader.readAsDataURL(file)
    }
  }

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
      onProfileChange('location', label || `${lat.toFixed(3)}, ${lon.toFixed(3)}`)
    } catch {
      onProfileChange('location', `${lat.toFixed(3)}, ${lon.toFixed(3)}`)
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
    onProfileChange('location', val)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(val)
    }, 350)
  }

  const applySelectedLocation = (item: LocationSuggestion) => {
    onProfileChange('location', item.label)
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

    const initialPreset = PRESET_LOCATIONS.find((p) => p.label.toLowerCase() === profile.location.toLowerCase())
    const centerLon = initialPreset ? initialPreset.lon : 11.255
    const centerLat = initialPreset ? initialPreset.lat : 43.77

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [centerLon, centerLat],
      zoom: initialPreset ? 6 : 3,
    })

    map.addControl(new maplibregl.FullscreenControl())

    if (initialPreset) {
      markerRef.current = new maplibregl.Marker({ color: '#a855f7' })
        .setLngLat([centerLon, centerLat])
        .addTo(map)
    }

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

  return (
    <div className="ls-app-shell">
      <TopBar activePage={activePage} onNavigate={onNavigate} profile={profile} />

      <main className="ls-page-content">
        <section className="ls-panel ls-page-panel">
          <div className="ls-profile-toolbar">
            <div className="ls-profile-spotlight">
              {isEditing ? (
                <div className="ls-profile-upload-wrap">
                  <div className="ls-avatar huge" style={{ backgroundImage: profile.profileImage ? `url(${profile.profileImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {!profile.profileImage && 'KV'}
                  </div>
                  <label className="ls-profile-upload-label">
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    Upload Photo
                  </label>
                </div>
              ) : (
                <div className="ls-avatar huge" style={{ backgroundImage: profile.profileImage ? `url(${profile.profileImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {!profile.profileImage && 'KV'}
                </div>
              )}
              <div>
                <span className="ls-studio-tag">{profile.category}</span>
                <h2>{profile.nickname}</h2>
                <p>{profile.location} Â· {profile.genres}</p>
              </div>
            </div>

            <button type="button" className="ls-primary-button" onClick={() => setIsEditing((prev) => !prev)}>
              {isEditing ? 'Guardar cambios' : 'Editar perfil'}
            </button>
          </div>

          <div className="ls-profile-grid">
            <div className="ls-studio-card" style={{ gridColumn: '1 / -1' }}>
              <span className="ls-studio-tag">Biography</span>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(event) => onProfileChange('bio', event.target.value)}
                />
              ) : (
                <p>{profile.bio}</p>
              )}
            </div>
          </div>

          <div className="ls-profile-form-grid">
            <div className="ls-profile-field">
              <label>Nickname / Artistic name</label>
              {isEditing ? (
                <input maxLength={20} value={profile.nickname} onChange={(event) => onProfileChange('nickname', event.target.value)} />
              ) : (
                <span>{profile.nickname}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Role / Title</label>
              {isEditing ? (
                <input value={profile.role} onChange={(event) => onProfileChange('role', event.target.value)} />
              ) : (
                <span>{profile.role}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>CategorÃ­a</label>
              {isEditing ? (
                <select value={profile.category} onChange={(event) => onProfileChange('category', event.target.value)}>
                  <option value="Productor">Productor</option>
                  <option value="Artista">Artista</option>
                  <option value="Productor/Artista">Productor/Artista</option>
                </select>
              ) : (
                <span>{profile.category}</span>
              )}
            </div>

            <div className="ls-profile-field wide-field">
              <label>Intereses de gÃ©nero</label>
              {isEditing ? (
                <div className="ls-genre-selector">
                  {genreOptions.map((genre) => {
                    const checked = profile.interestGenres.includes(genre)

                    return (
                      <button
                        key={genre}
                        type="button"
                        className={`ls-genre-chip ${checked ? 'is-selected' : ''}`}
                        onClick={() => {
                          const nextSelection = checked
                            ? profile.interestGenres.filter((item) => item !== genre)
                            : [...profile.interestGenres, genre]

                          onProfileChange('interestGenres', nextSelection.slice(0, 6))
                        }}
                      >
                        {genre}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="ls-genre-selector read-only">
                  {profile.interestGenres.map((genre) => (
                    <span key={genre} className="ls-genre-chip read-only-chip">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="ls-profile-field wide-field">
              <label>Location</label>
              {isEditing ? (
                <>
                  <div className="ls-location-input-wrapper">
                    <input
                      ref={inputRef}
                      value={profile.location}
                      placeholder="Escribe tu ciudad (ej. Madrid, Berlín, Buenos Aires...)"
                      onChange={handleLocationInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true)
                      }}
                      onBlur={() => {
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
                </>
              ) : (
                <span>{profile.location}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label><FaSpotify className="ls-field-icon" />Spotify</label>
              {isEditing ? (
                <input value={profile.spotify} onChange={(event) => onProfileChange('spotify', event.target.value)} />
              ) : (
                <a href={profile.spotify} target="_blank" rel="noreferrer">{profile.spotify}</a>
              )}
            </div>

            <div className="ls-profile-field">
              <label> <FaInstagram className="ls-field-icon" />Instagram</label>
              {isEditing ? (
                <input value={profile.instagram} onChange={(event) => onProfileChange('instagram', event.target.value)} />
              ) : (
                <a href={profile.instagram} target="_blank" rel="noreferrer">{profile.instagram}</a>
              )}
            </div>

            <div className="ls-profile-field">
              <label>
                <FaSoundcloud className="ls-field-icon" /> SoundCloud URL
              </label>
              {isEditing ? (
                <input value={profile.soundcloud} onChange={(event) => onProfileChange('soundcloud', event.target.value)} />
              ) : (
                <a href={profile.soundcloud} target="_blank" rel="noreferrer">{profile.soundcloud}</a>
              )}
            </div>
          </div>

          <div className="ls-rules-grid" />
        </section>
      </main>

      <Footer />
    </div>
  )
}