import { useState, useRef, useEffect } from 'react'
import { FaSoundcloud, FaSpotify, FaInstagram } from 'react-icons/fa6'
import { PiMapPinBold, PiEyeSlashBold, PiNavigationArrowBold } from 'react-icons/pi'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import { AvatarEditorModal } from './RegisterPage'
import type { AppPage, Profile, NotificationItem } from '../types'

type ProfilePageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile: Profile
  onProfileChange: (field: keyof Profile, value: string | boolean | string[]) => void
  isAdminSession?: boolean
  notifications?: NotificationItem[]
  onMarkNotificationAsRead?: (id: string) => void
  onMarkAllNotificationsAsRead?: () => void
  onClearNotifications?: () => void
  onSignOut?: () => void
  unreadMessagesCount?: number
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

export default function ProfilePage({
  activePage,
  onNavigate,
  profile,
  onProfileChange,
  isAdminSession,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearNotifications,
  onSignOut,
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [initialProfileSnapshot, setInitialProfileSnapshot] = useState<Profile | null>(null)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Editor modal recortador de imagen
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({})

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  const handleStartEdit = () => {
    setInitialProfileSnapshot({ ...profile })
    setIsEditing(true)
    setInvalidFields({})
  }

  const handleSaveEdit = () => {
    const errors: Record<string, boolean> = {}

    if (!profile.firstName?.trim()) errors.firstName = true
    if (!profile.lastName?.trim()) errors.lastName = true
    if (!profile.nickname?.trim()) errors.nickname = true
    if (!profile.email?.trim()) errors.email = true
    if (!profile.password?.trim()) errors.password = true
    if (!profile.location?.trim()) errors.location = true
    
    const descTrimmed = profile.description?.trim() || ''
    if (!descTrimmed || descTrimmed.length < 139) {
      errors.description = true
    }

    if (Object.keys(errors).length > 0) {
      setInvalidFields(errors)
      return
    }

    setInvalidFields({})
    setIsEditing(false)
    setInitialProfileSnapshot(null)
  }

  const getInputStyle = (fieldName: string) => {
    if (invalidFields[fieldName]) {
      return {
        border: '1.5px solid #ef4444',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.25)',
        background: 'rgba(239, 68, 68, 0.06)',
      }
    }
    return undefined
  }

  const renderFieldError = (fieldName: string) => {
    if (!invalidFields[fieldName]) return null
    if (fieldName === 'description') {
      const currentLen = profile.description?.trim().length || 0
      return (
        <small style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
          La descripción es obligatoria y debe tener como mínimo 139 caracteres (actual: {currentLen}).
        </small>
      )
    }
    return (
      <small style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
        Este campo es obligatorio.
      </small>
    )
  }

  const handleCancelEdit = () => {
    if (!initialProfileSnapshot) {
      setIsEditing(false)
      return
    }

    const hasChanges =
      profile.firstName !== initialProfileSnapshot.firstName ||
      profile.lastName !== initialProfileSnapshot.lastName ||
      profile.nickname !== initialProfileSnapshot.nickname ||
      profile.email !== initialProfileSnapshot.email ||
      profile.password !== initialProfileSnapshot.password ||
      profile.category !== initialProfileSnapshot.category ||
      profile.role !== initialProfileSnapshot.role ||
      profile.location !== initialProfileSnapshot.location ||
      profile.description !== initialProfileSnapshot.description ||
      profile.spotifyUrl !== initialProfileSnapshot.spotifyUrl ||
      profile.instagramUrl !== initialProfileSnapshot.instagramUrl ||
      profile.soundcloudUrl !== initialProfileSnapshot.soundcloudUrl ||
      profile.profileImage !== initialProfileSnapshot.profileImage ||
      JSON.stringify(profile.interestGenres ?? []) !== JSON.stringify(initialProfileSnapshot.interestGenres ?? [])

    if (hasChanges) {
      setShowDiscardModal(true)
    } else {
      setIsEditing(false)
      setInitialProfileSnapshot(null)
    }
  }

  const handleConfirmDiscard = () => {
    if (initialProfileSnapshot) {
      Object.keys(initialProfileSnapshot).forEach((key) => {
        const k = key as keyof Profile
        onProfileChange(k, initialProfileSnapshot[k] as any)
      })
    }
    setShowDiscardModal(false)
    setIsEditing(false)
    setInitialProfileSnapshot(null)
  }

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
    if (invalidFields[field as string] && typeof value === 'string' && value.trim()) {
      setInvalidFields((prev) => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
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

    let timer: ReturnType<typeof setTimeout> | null = null

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [13.405, 52.52],
        zoom: 10,
        renderWorldCopies: false,
      })

      map.addControl(new maplibregl.FullscreenControl())
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
      timer = setTimeout(() => map.resize(), 150)

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

  const getSpotifyUrl = () => (profile.spotifyUrl || profile.spotify || '').trim()
  const getInstagramUrl = () => (profile.instagramUrl || profile.instagram || '').trim()
  const getSoundcloudUrl = () => (profile.soundcloudUrl || profile.soundcloud || '').trim()
  const getTrackSampleUrl = () => ((profile.tracks && profile.tracks[1]?.soundcloudLink) || '').trim()

  return (
    <div className="ls-app-shell">
      {showEditor && rawImage && (
        <AvatarEditorModal
          rawImage={rawImage}
          onApply={handleApplyCroppedImage}
          onCancel={() => setShowEditor(false)}
        />
      )}

      <TopBar
        activePage={activePage}
        onNavigate={onNavigate}
        profile={profile}
        isAdminSession={isAdminSession}
        notifications={notifications}
        onMarkNotificationAsRead={onMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
        onClearNotifications={onClearNotifications}
        onSignOut={onSignOut}
        unreadMessagesCount={unreadMessagesCount}
      />

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

            {isEditing ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="ls-secondary-button" onClick={handleCancelEdit}>
                  Cancelar
                </button>
                <button type="button" className="ls-primary-button" onClick={handleSaveEdit}>
                  Guardar cambios
                </button>
              </div>
            ) : (
              <button type="button" className="ls-primary-button" onClick={handleStartEdit}>
                Editar perfil
              </button>
            )}
          </div>

          <div className="ls-profile-form-grid">
            {/* 1. First Name | Last Name */}
            <div className="ls-profile-field">
              <label>First Name</label>
              {isEditing ? (
                <>
                  <input
                    value={profile.firstName ?? ''}
                    onChange={(event) => handleChange('firstName', event.target.value)}
                    style={getInputStyle('firstName')}
                  />
                  {renderFieldError('firstName')}
                </>
              ) : (
                <span>{profile.firstName || 'Sin especificar'}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Last Name</label>
              {isEditing ? (
                <>
                  <input
                    value={profile.lastName ?? ''}
                    onChange={(event) => handleChange('lastName', event.target.value)}
                    style={getInputStyle('lastName')}
                  />
                  {renderFieldError('lastName')}
                </>
              ) : (
                <span>{profile.lastName || 'Sin especificar'}</span>
              )}
            </div>

            {/* 2. NickName | Categoría */}
            <div className="ls-profile-field">
              <label>NickName / Artistic Name</label>
              {isEditing ? (
                <>
                  <input
                    value={profile.nickname ?? ''}
                    onChange={(event) => handleChange('nickname', event.target.value)}
                    style={getInputStyle('nickname')}
                  />
                  {renderFieldError('nickname')}
                </>
              ) : (
                <span>{profile.nickname}</span>
              )}
            </div>

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

            {/* 3. Descripción */}
            <div className="ls-profile-field wide-field">
              <label>Descripción (mínimo 139 caracteres)</label>
              {isEditing ? (
                <>
                  <textarea
                    style={{
                      width: '100%',
                      minWidth: '100%',
                      boxSizing: 'border-box',
                      marginTop: '4px',
                      ...getInputStyle('description'),
                    }}
                    value={profile.description ?? ''}
                    onChange={(event) => handleChange('description', event.target.value)}
                    placeholder="Escribe tu biografía musical detallada (mínimo 139 caracteres)..."
                  />
                  {renderFieldError('description')}
                  <small
                    style={{
                      color: (profile.description?.trim().length || 0) < 139 ? '#ef4444' : '#10b981',
                      fontSize: '0.78rem',
                      marginTop: '4px',
                      display: 'block',
                      fontWeight: 500,
                    }}
                  >
                    Caracteres: {profile.description?.trim().length || 0} / 139 mínimo
                  </small>
                </>
              ) : (
                <span style={{ display: 'block', margin: 0, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5 }}>
                  {profile.description || 'Sin descripción'}
                </span>
              )}
            </div>

            {/* 4. Location / Ubicación */}
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
                      style={getInputStyle('location')}
                    />
                    {renderFieldError('location')}

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
                        style={{ width: '100%', height: '280px', borderRadius: '12px', marginTop: 0 }}
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
              ) : (
                <span>{profile.location}</span>
              )}
            </div>

            {/* 5. Intereses de género */}
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

            {/* 6. Email | Password */}
            <div className="ls-profile-field">
              <label>Email</label>
              {isEditing ? (
                <>
                  <input
                    type="email"
                    value={profile.email ?? ''}
                    onChange={(event) => handleChange('email', event.target.value)}
                    style={getInputStyle('email')}
                  />
                  {renderFieldError('email')}
                </>
              ) : (
                <span>{profile.email || 'kaelen@linkedsound.app'}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Contraseña</label>
              {isEditing ? (
                <>
                  <input
                    type="password"
                    value={profile.password ?? ''}
                    onChange={(event) => handleChange('password', event.target.value)}
                    style={getInputStyle('password')}
                  />
                  {renderFieldError('password')}
                </>
              ) : (
                <span>••••••••</span>
              )}
            </div>

            {/* 7. Enlaces sociales */}
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
              ) : getSpotifyUrl() && getSpotifyUrl() !== 'No vinculado' ? (
                <a
                  href={getSpotifyUrl()}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {getSpotifyUrl()}
                </a>
              ) : (
                <span style={{ color: 'rgba(255, 255, 255, 0.45)', cursor: 'default' }}>
                  No vinculado
                </span>
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
              ) : getInstagramUrl() && getInstagramUrl() !== 'No vinculado' ? (
                <a
                  href={getInstagramUrl()}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {getInstagramUrl()}
                </a>
              ) : (
                <span style={{ color: 'rgba(255, 255, 255, 0.45)', cursor: 'default' }}>
                  No vinculado
                </span>
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
              ) : getSoundcloudUrl() && getSoundcloudUrl() !== 'No vinculado' ? (
                <a
                  href={getSoundcloudUrl()}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {getSoundcloudUrl()}
                </a>
              ) : (
                <span style={{ color: 'rgba(255, 255, 255, 0.45)', cursor: 'default' }}>
                  No vinculado
                </span>
              )}
            </div>

            <div className="ls-profile-field wide-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaSoundcloud style={{ color: '#FF7700' }} /> Track o Muestra Destacada
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
              ) : getTrackSampleUrl() && getTrackSampleUrl() !== 'No vinculado' ? (
                <a
                  href={getTrackSampleUrl()}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {getTrackSampleUrl()}
                </a>
              ) : (
                <span style={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.45)', cursor: 'default' }}>
                  No se configuró una muestra adicional
                </span>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modal de Confirmación de Descarte de Cambios */}
      {showDiscardModal && (
        <div className="ls-modal-overlay">
          <div className="ls-modal-card" style={{ width: 'min(100%, 460px)', background: '#0f1325', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '18px', padding: '24px' }}>
            <div className="ls-modal-header" style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem' }}>Descartar Cambios</h3>
            </div>
            <div className="ls-modal-body" style={{ marginBottom: '20px' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                ¿Estás seguro de que deseas cancelar la edición? Los cambios realizados se perderán.
              </p>
            </div>
            <div className="ls-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="ls-secondary-button"
                onClick={() => setShowDiscardModal(false)}
              >
                Continuar editando
              </button>
              <button
                type="button"
                className="ls-danger-button"
                onClick={handleConfirmDiscard}
              >
                Sí, descartar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}