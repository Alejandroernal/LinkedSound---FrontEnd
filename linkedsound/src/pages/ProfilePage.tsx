import { useState, useRef, useEffect } from 'react'
import { FaSoundcloud, FaSpotify, FaInstagram } from 'react-icons/fa6'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import { AvatarEditorModal } from './RegisterPage'
import type { AppPage, Profile } from '../types'

type ProfilePageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile: Profile
  onProfileChange: (field: keyof Profile, value: string | boolean | string[]) => void
  isAdminSession?: boolean
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
  'Synthwave',
  'DarkElectro',
  'Cyberpunk',
  'Industrial',
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

export default function ProfilePage({ activePage, onNavigate, profile, onProfileChange, isAdminSession }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Editor modal recortador de imagen
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setRawImage(result)
        setShowEditor(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleApplyCroppedImage = (cropped: string) => {
    onProfileChange('profileImage', cropped)
    setShowEditor(false)
  }

  const handleChange = (field: keyof Profile, value: any) => {
    onProfileChange(field, value)
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
            item.display_name.split(',')[0]
          const country = item.address?.country || ''
          return {
            label: [city, country].filter(Boolean).join(', '),
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
    onProfileChange('location', loc.label)
    setLocationQuery(loc.label)
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

  useEffect(() => {
    if (!showMap || !mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [13.405, 52.52],
      zoom: 10,
    })

    map.addControl(new maplibregl.FullscreenControl())
    setTimeout(() => map.resize(), 100)

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
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [showMap])

  return (
    <div className="ls-app-shell">
      {showEditor && rawImage && (
        <AvatarEditorModal
          rawImage={rawImage}
          onApply={handleApplyCroppedImage}
          onCancel={() => setShowEditor(false)}
        />
      )}

      <TopBar activePage={activePage} onNavigate={onNavigate} profile={profile} isAdminSession={isAdminSession} />

      <main className="ls-page-content">
        <section className="ls-panel ls-page-panel">
          <div className="ls-profile-toolbar">
            <div className="ls-profile-spotlight">
              {isEditing ? (
                <div className="ls-profile-upload-wrap">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt={profile.nickname} className="ls-avatar huge" style={{ objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div className="ls-avatar huge">
                      {profile.nickname.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <label className="ls-profile-upload-label">
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    Upload Photo
                  </label>
                </div>
              ) : (
                profile.profileImage ? (
                  <img src={profile.profileImage} alt={profile.nickname} className="ls-avatar huge" style={{ objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <div className="ls-avatar huge">
                    {profile.nickname.slice(0, 2).toUpperCase()}
                  </div>
                )
              )}
              <div>
                <span className="ls-studio-tag">{profile.category ?? profile.role}</span>
                <h2>{profile.nickname}</h2>
                <p>{profile.location}</p>
              </div>
            </div>

            <button type="button" className="ls-primary-button" onClick={() => setIsEditing((prev) => !prev)}>
              {isEditing ? 'Guardar cambios' : 'Editar perfil'}
            </button>
          </div>

          <div className="ls-profile-grid">
            <div className="ls-studio-card" style={{ gridColumn: '1 / -1', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
              <span className="ls-studio-tag" style={{ alignSelf: 'flex-start' }}>Descripcion</span>
              {isEditing ? (
                <textarea
                  style={{ width: '100%', minWidth: '100%', boxSizing: 'border-box', marginTop: '12px' }}
                  value={profile.bio ?? ''}
                  onChange={(event) => handleChange('bio', event.target.value)}
                />
              ) : (
                <p>{profile.bio}</p>
              )}
            </div>
          </div>

          <div className="ls-profile-form-grid">
            <div className="ls-profile-field">
              <label>First Name</label>
              {isEditing ? (
                <input value={profile.firstName ?? ''} onChange={(event) => handleChange('firstName', event.target.value)} />
              ) : (
                <span>{profile.firstName || 'Sin especificar'}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Last Name</label>
              {isEditing ? (
                <input value={profile.lastName ?? ''} onChange={(event) => handleChange('lastName', event.target.value)} />
              ) : (
                <span>{profile.lastName || 'Sin especificar'}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>NickName / Artistic Name</label>
              {isEditing ? (
                <input value={profile.nickname ?? ''} onChange={(event) => handleChange('nickname', event.target.value)} />
              ) : (
                <span>{profile.nickname}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Email</label>
              {isEditing ? (
                <input type="email" value={profile.email ?? ''} onChange={(event) => handleChange('email', event.target.value)} />
              ) : (
                <span>{profile.email || 'kaelen@linkedsound.app'}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Password</label>
              {isEditing ? (
                <input type="password" value={profile.password ?? ''} onChange={(event) => handleChange('password', event.target.value)} />
              ) : (
                <span>••••••••</span>
              )}
            </div>

            {isAdminSession && (
              <div className="ls-profile-field">
                <label>Role (Tipo de cuenta)</label>
                {isEditing ? (
                  <select value={profile.role ?? 'Usuario'} onChange={(event) => handleChange('role', event.target.value)}>
                    <option value="Usuario">Usuario</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                ) : (
                  <span className={`ls-role-pill-badge ${profile.role === 'Administrador' ? 'admin' : 'user'}`}>
                    {profile.role || 'Usuario'}
                  </span>
                )}
              </div>
            )}

            <div className="ls-profile-field">
              <label>Categoría</label>
              {isEditing ? (
                <select value={profile.category ?? 'Productor'} onChange={(event) => handleChange('category', event.target.value)}>
                  <option value="Productor">Productor</option>
                  <option value="Artista">Artista</option>
                  <option value="Productor/Artista">Productor/Artista</option>
                </select>
              ) : (
                <span>{profile.category ?? 'Productor/Artista'}</span>
              )}
            </div>

            <div className="ls-profile-field wide-field">
              <label>Intereses de género</label>
              {isEditing ? (
                <div className="ls-genre-selector">
                  {genreOptions.map((genre) => {
                    const checked = (profile.interestGenres ?? []).includes(genre)

                    return (
                      <button
                        key={genre}
                        type="button"
                        className={`ls-genre-chip ${checked ? 'is-selected' : ''}`}
                        onClick={() => {
                          const currentList = profile.interestGenres ?? []
                          const nextSelection = checked
                            ? currentList.filter((item) => item !== genre)
                            : [...currentList, genre]

                          handleChange('interestGenres', nextSelection.slice(0, 6))
                        }}
                      >
                        {genre}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="ls-genre-selector read-only">
                  {(profile.interestGenres ?? []).map((genre) => (
                    <span key={genre} className="ls-genre-chip read-only-chip">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="ls-profile-field wide-field ls-location-group">
              <label>Location / Ubicación</label>
              {isEditing ? (
                <div>
                  <div className="ls-location-input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Escribe tu ciudad (ej. Madrid, Berlín, Buenos Aires...)"
                      value={profile.location ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        handleChange('location', val)
                        searchLocation(val)
                      }}
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
                            className="ls-autocomplete-item"
                            role="option"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleSelectLocation(item)
                            }}
                          >
                            <span className="ls-ac-text">{item.full}</span>
                            <span className="ls-ac-badge">Elegir</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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
                    <div ref={mapContainerRef} className="ls-map-container" style={{ width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', marginTop: '10px' }} />
                  )}
                </div>
              ) : (
                <span>{profile.location}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaSpotify style={{ color: '#1DB954' }} /> Spotify
              </label>
              {isEditing ? (
                <input
                  value={profile.spotifyUrl ?? profile.spotify ?? ''}
                  onChange={(event) => {
                    handleChange('spotifyUrl', event.target.value)
                    handleChange('spotify', event.target.value)
                  }}
                />
              ) : (
                <a
                  href={profile.spotifyUrl || profile.spotify}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >

                  {profile.spotifyUrl || profile.spotify || 'No vinculado'}
                </a>
              )}
            </div>

            <div className="ls-profile-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaInstagram style={{ color: '#E4405F' }} /> Instagram
              </label>
              {isEditing ? (
                <input
                  value={profile.instagramUrl ?? profile.instagram ?? ''}
                  onChange={(event) => {
                    handleChange('instagramUrl', event.target.value)
                    handleChange('instagram', event.target.value)
                  }}
                />
              ) : (
                <a
                  href={profile.instagramUrl || profile.instagram}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >

                  {profile.instagramUrl || profile.instagram || 'No vinculado'}
                </a>
              )}
            </div>

            <div className="ls-profile-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaSoundcloud style={{ color: '#FF5500' }} /> SoundCloud URL
              </label>
              {isEditing ? (
                <input
                  value={profile.soundcloudUrl ?? profile.soundcloud ?? ''}
                  onChange={(event) => {
                    handleChange('soundcloudUrl', event.target.value)
                    handleChange('soundcloud', event.target.value)
                  }}
                />
              ) : (
                <a
                  href={profile.soundcloudUrl || profile.soundcloud}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {profile.soundcloudUrl || profile.soundcloud || 'No vinculado'}
                </a>
              )}
            </div>

            <div className="ls-profile-field wide-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaSoundcloud style={{ color: '#FF7700' }} /> Track o Muestra Destacada (URL de SoundCloud)
              </label>
              {isEditing ? (
                <input
                  placeholder="https://soundcloud.com/tu-usuario/tu-cancion-destacada"
                  value={(profile.tracks && profile.tracks[1]?.soundcloudLink) || ''}
                  onChange={(event) => {
                    const val = event.target.value
                    const currentTracks = profile.tracks || [
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
                    handleChange('tracks', updatedTracks)
                  }}
                />
              ) : (
                <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>
                  {(profile.tracks && profile.tracks[1]?.soundcloudLink) || 'No se configuró una muestra adicional'}
                </span>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}