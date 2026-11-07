import { useState, useRef, useEffect } from 'react'
import { FaSoundcloud, FaSpotify } from 'react-icons/fa6'
import {
  PiMapPinBold,
  PiEyeSlashBold,
  PiNavigationArrowBold,
  PiCheckBold,
  PiWarningOctagonBold,
  PiXBold,
  PiCropBold,
  PiCameraBold,
  PiEyeBold,
} from 'react-icons/pi'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import { AvatarEditorModal } from './RegisterPage'
import type { AppPage, Profile, NotificationItem, SoundCloudTrack, ProfileCard } from '../types'
import { api } from '../services/api'
import AudioSampleTrackUploader from '../components/AudioSampleTrackUploader'
import SoundCloudPreviewModal from '../components/SoundCloudPreviewModal'

type ProfilePageProps = {
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
  profile: Profile
  onProfileChange: (field: keyof Profile, value: any) => void
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
  unreadMessagesCount,
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [initialProfileSnapshot, setInitialProfileSnapshot] = useState<Profile | null>(null)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const [verifiedLocation, setVerifiedLocation] = useState(profile.location || '')
  const [isLocationVerified, setIsLocationVerified] = useState(Boolean(profile.location && profile.location.trim()))
  const [isSaving, setIsSaving] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)

  // Editor modal recortador de imagen
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({})

  // Modal de Vista Externa (como ven tu perfil los demas usuarios)
  const [isExternalPreviewOpen, setIsExternalPreviewOpen] = useState(false)

  const previewProfileCard: ProfileCard = {
    ...profile,
    id: profile.id,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    nickname: profile.nickname || 'Mi Perfil',
    role: profile.role || profile.category || 'Artista',
    location: profile.location || 'LinkedSound Network',
    description: profile.description || '',
    interestGenres: profile.interestGenres || [],
    tags: profile.interestGenres || profile.tags || [],
    soundcloudUrl: profile.soundcloudUrl || profile.soundcloud || '',
    spotifyUrl: profile.spotifyUrl || profile.spotify || '',
    profileImage: profile.profileImage || '',
    tracks: profile.tracks || [],
    match: '100% (Tu perfil)',
    isProfile: true,
    itemRole: 'Perfil',
    badge: (profile.role || '').toLowerCase().includes('productor') ? 'Producer' : 'Artist',
  }

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isValidPlatformUrl = (platform: 'spotify' | 'soundcloud', url?: string): boolean => {
    if (!url) return true
    const trimmed = url.trim()
    if (!trimmed) return true
    const lower = trimmed.toLowerCase()
    if (platform === 'spotify') {
      return lower.includes('spotify.com')
    }
    if (platform === 'soundcloud') {
      return lower.includes('soundcloud.com')
    }
    return false
  }

  const normalizeUrl = (url?: string): string => {
    if (!url) return ''
    const trimmed = url.trim()
    if (!trimmed) return ''
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`
    }
    return trimmed
  }

  const handleStartEdit = () => {
    setInitialProfileSnapshot({ ...profile })
    setVerifiedLocation(profile.location || '')
    setIsLocationVerified(Boolean(profile.location && profile.location.trim()))
    setIsEditing(true)
    setInvalidFields({})
  }

  const handleSaveEdit = async () => {
    const errors: Record<string, boolean> = {}

    if (!profile.firstName?.trim()) errors.firstName = true
    if (!profile.lastName?.trim()) errors.lastName = true
    if (!profile.nickname?.trim()) errors.nickname = true
    if (!profile.email?.trim()) errors.email = true

    // La contraseña solo es requerida si el usuario ingresa una nueva para modificarla
    if (profile.password && profile.password.trim().length > 0 && profile.password.trim().length < 6) {
      errors.password = true
    }

    const locTrim = profile.location?.trim() || ''
    if (!locTrim) {
      errors.location = true
    }

    const descTrimmed = profile.description?.trim() || ''
    if (descTrimmed.length > 150) {
      errors.description = true
    }

    const rawSpotify = (profile.spotifyUrl || profile.spotify || '').trim()
    const rawSoundcloud = (profile.soundcloudUrl || profile.soundcloud || '').trim()

    const normSpotify = rawSpotify ? normalizeUrl(rawSpotify) : ''
    const normSoundcloud = rawSoundcloud ? normalizeUrl(rawSoundcloud) : ''

    if (rawSpotify && !isValidPlatformUrl('spotify', rawSpotify)) {
      errors.spotifyUrl = true
    }
    if (rawSoundcloud && !isValidPlatformUrl('soundcloud', rawSoundcloud)) {
      errors.soundcloudUrl = true
    }

    if (Object.keys(errors).length > 0) {
      setInvalidFields(errors)
      const fieldLabels: Record<string, string> = {
        firstName: 'Nombre (First Name)',
        lastName: 'Apellido (Last Name)',
        nickname: 'NickName / Nombre Artistico',
        email: 'Correo electronico',
        password: 'Contrasena (minimo 6 caracteres)',
        location: 'Ubicacion',
        description: 'Descripcion (maximo 150 caracteres)',
        spotifyUrl: 'Enlace de Spotify (debe contener spotify.com)',
        soundcloudUrl: 'Enlace de SoundCloud (debe contener soundcloud.com)',
      }
      const missing = Object.keys(errors).map((k) => fieldLabels[k] || k).join(', ')
      setSaveErrorMessage(`Por favor completa o corrige los siguientes campos antes de guardar: ${missing}.`)
      return
    }

    setInvalidFields({})
    setIsSaving(true)

    try {
      const response = await api.auth.updateProfile({
        firstName: profile.firstName?.trim(),
        lastName: profile.lastName?.trim(),
        nickname: profile.nickname?.trim(),
        ...(profile.password?.trim() ? { password: profile.password.trim() } : {}),
        role: profile.role || profile.category || 'Artista',
        accountRole: profile.accountRole || 'Usuario',
        location: locTrim,
        description: descTrimmed,
        interestGenres: profile.interestGenres || [],
        tracks: profile.tracks || [],
        soundcloudUrl: normSoundcloud,
        spotifyUrl: normSpotify,
        profileImage: profile.profileImage ?? null,
      })

      if (!response.success) {
        setSaveErrorMessage(response.message || 'No se pudo guardar los cambios en la base de datos.')
        return
      }

      if (response.user) {
        const u = response.user
        if (u.firstName) onProfileChange('firstName', u.firstName)
        if (u.lastName) onProfileChange('lastName', u.lastName)
        if (u.nickname) onProfileChange('nickname', u.nickname)
        if (u.role) {
          onProfileChange('role', u.role)
          onProfileChange('category', u.role)
        }
        if (u.accountRole) {
          onProfileChange('accountRole', u.accountRole)
        }
        if (u.location) onProfileChange('location', u.location)
        if (u.description !== undefined) onProfileChange('description', u.description || '')
        if (u.profileImage !== undefined) onProfileChange('profileImage', u.profileImage || '')
        if (Array.isArray(u.interestGenres)) onProfileChange('interestGenres', u.interestGenres)
        if (Array.isArray(u.tracks)) {
          onProfileChange('tracks', u.tracks)
        }
        onProfileChange('spotifyUrl', u.spotifyUrl ?? normSpotify)
        onProfileChange('spotify', u.spotifyUrl ?? normSpotify)
        onProfileChange('soundcloudUrl', u.soundcloudUrl ?? normSoundcloud)
        onProfileChange('soundcloud', u.soundcloudUrl ?? normSoundcloud)
      } else {
        onProfileChange('spotifyUrl', normSpotify)
        onProfileChange('spotify', normSpotify)
        onProfileChange('soundcloudUrl', normSoundcloud)
        onProfileChange('soundcloud', normSoundcloud)
      }

      setIsEditing(false)
      setInitialProfileSnapshot(null)
    } catch (err: any) {
      setSaveErrorMessage(err?.message || 'Error al conectar con el servidor para actualizar el perfil.')
    } finally {
      setIsSaving(false)
    }
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
          La descripción no puede superar los 150 caracteres (actual: {currentLen}).
        </small>
      )
    }
    if (fieldName === 'location') {
      if (!profile.location?.trim()) {
        return (
          <small style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
            La ubicación es obligatoria.
          </small>
        )
      }
      return (
        <small style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
          Debes seleccionar una localidad válida de la lista sugerida o seleccionarla en el mapa.
        </small>
      )
    }
    if (fieldName === 'spotifyUrl') {
      return (
        <small style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
          El enlace debe pertenecer a Spotify (ejemplo: https://open.spotify.com/artist/...).
        </small>
      )
    }
    if (fieldName === 'soundcloudUrl') {
      return (
        <small style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
          El enlace debe pertenecer a SoundCloud (ejemplo: https://soundcloud.com/tu_usuario).
        </small>
      )
    }
    if (fieldName === 'password') {
      return (
        <small style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
          La contraseña debe tener como mínimo 6 caracteres.
        </small>
      )
    }
    if (fieldName === 'trackDestacado') {
      return (
        <small style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
          El track destacado debe ser un enlace de SoundCloud (ejemplo: https://soundcloud.com/tu-usuario/tu-tema).
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
      (Boolean(profile.password?.trim()) && profile.password !== initialProfileSnapshot.password) ||
      profile.category !== initialProfileSnapshot.category ||
      profile.role !== initialProfileSnapshot.role ||
      profile.accountRole !== initialProfileSnapshot.accountRole ||
      profile.location !== initialProfileSnapshot.location ||
      profile.description !== initialProfileSnapshot.description ||
      profile.spotifyUrl !== initialProfileSnapshot.spotifyUrl ||
      profile.soundcloudUrl !== initialProfileSnapshot.soundcloudUrl ||
      profile.profileImage !== initialProfileSnapshot.profileImage ||
      JSON.stringify(profile.interestGenres ?? []) !== JSON.stringify(initialProfileSnapshot.interestGenres ?? []) ||
      JSON.stringify(profile.tracks ?? []) !== JSON.stringify(initialProfileSnapshot.tracks ?? [])

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
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleApplyCroppedImage = (cropped: string) => {
    onProfileChange('profileImage', cropped)
    setShowEditor(false)
  }

  const handleChange = (field: keyof Profile, value: any) => {
    onProfileChange(field, value)
    if (invalidFields[field as string]) {
      setInvalidFields((prev) => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    }
    if (field === 'tracks' && invalidFields.trackDestacado) {
      setInvalidFields((prev) => {
        const next = { ...prev }
        delete next.trackDestacado
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
      const finalLoc = label || `${lat.toFixed(3)}, ${lon.toFixed(3)}`
      onProfileChange('location', finalLoc)
      setVerifiedLocation(finalLoc)
      setIsLocationVerified(true)
      if (invalidFields.location) {
        setInvalidFields((prev) => {
          const next = { ...prev }
          delete next.location
          return next
        })
      }
    } catch {
      const fallback = `${lat.toFixed(3)}, ${lon.toFixed(3)}`
      onProfileChange('location', fallback)
      setVerifiedLocation(fallback)
      setIsLocationVerified(true)
      if (invalidFields.location) {
        setInvalidFields((prev) => {
          const next = { ...prev }
          delete next.location
          return next
        })
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
        setHighlightedIndex(0)
      } else {
        const matches = PRESET_LOCATIONS.filter((loc) =>
          loc.label.toLowerCase().includes(trimmed)
        )
        setSuggestions(matches)
        setShowSuggestions(matches.length > 0)
        setHighlightedIndex(0)
      }
    } catch {
      const matches = PRESET_LOCATIONS.filter((loc) =>
        loc.label.toLowerCase().includes(trimmed)
      )
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0)
      setHighlightedIndex(0)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectLocation = (loc: LocationSuggestion) => {
    onProfileChange('location', loc.label)
    setVerifiedLocation(loc.label)
    setIsLocationVerified(true)
    setShowSuggestions(false)
    if (invalidFields.location) {
      setInvalidFields((prev) => {
        const next = { ...prev }
        delete next.location
        return next
      })
    }

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

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        handleSelectLocation(target)
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

  const getSpotifyUrl = () => normalizeUrl(profile.spotifyUrl || profile.spotify || '')
  const getSoundcloudUrl = () => normalizeUrl(profile.soundcloudUrl || profile.soundcloud || '')

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
                <div
                  className="ls-profile-avatar-edit-container"
                  style={{ position: 'relative', display: 'inline-block' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="ls-avatar huge ls-avatar-editable"
                    title="Haz clic en el contorno circular para cambiar la foto"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click()
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '50%',
                      boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.6), 0 8px 24px rgba(168, 85, 247, 0.25)',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.nickname}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #a855f7, #6366f1)', gap: '4px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{profile.nickname.slice(0, 2).toUpperCase()}</span>
                        <PiCameraBold style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.9)' }} />
                      </div>
                    )}

                    {/* Overlay sutil solo al pasar el cursor por el contorno circular */}
                    <div
                      className="ls-avatar-hover-badge"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      <PiCameraBold style={{ fontSize: '1.6rem', color: '#fff' }} />
                    </div>
                  </div>

                  {/* Icono sutil de reajuste si ya tiene foto cargada */}
                  {profile.profileImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setRawImage(profile.profileImage!)
                        setShowEditor(true)
                      }}
                      title="Reajustar encuadre y zoom de la foto actual"
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#141628',
                        border: '2px solid #a855f7',
                        color: '#c084fc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
                        transition: 'transform 0.2s ease, background 0.2s ease',
                      }}
                    >
                      <PiCropBold style={{ fontSize: '0.85rem' }} />
                    </button>
                  )}
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
                <span className="ls-studio-tag">{profile.role || profile.category || 'Productor y Artista'}</span>
                <h2>{profile.nickname}</h2>
                <p>{profile.location}</p>
              </div>
            </div>

            {isEditing ? (
              <div className="ls-profile-edit-actions">
                <button
                  type="button"
                  className="ls-primary-button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  style={{ opacity: isSaving ? 0.7 : 1 }}
                >
                  {isSaving ? 'Guardando cambios...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="ls-secondary-button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="ls-profile-header-actions">
                <button type="button" className="ls-primary-button" onClick={handleStartEdit}>
                  Editar perfil
                </button>
                <button
                  type="button"
                  className="ls-secondary-button ls-btn-external-view"
                  onClick={() => setIsExternalPreviewOpen(true)}
                  title="Ver como ven tu perfil los demas usuarios"
                >
                  <PiEyeBold /> Vista Externa
                </button>
              </div>
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

            {/* 2. NickName | Rol */}
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
              <label>Rol (Especialidad Musical)</label>
              {isEditing ? (
                <select
                  value={profile.role || profile.category || 'Productor y Artista'}
                  onChange={(event) => {
                    handleChange('role', event.target.value)
                    handleChange('category', event.target.value)
                  }}
                >
                  <option value="Productor">Productor</option>
                  <option value="Artista">Artista</option>
                  <option value="Productor y Artista">Productor y Artista</option>
                </select>
              ) : (
                <span>{profile.role || profile.category || 'Productor y Artista'}</span>
              )}
            </div>

            {isAdminSession && (
              <div className="ls-profile-field">
                <label>Tipo de cuenta</label>
                {isEditing ? (
                  <select
                    value={profile.accountRole ?? 'Usuario'}
                    onChange={(event) => handleChange('accountRole', event.target.value)}
                  >
                    <option value="Usuario">Usuario</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                ) : (
                  <span className={`ls-role-pill-badge ${profile.accountRole === 'Administrador' ? 'admin' : 'user'}`}>
                    {profile.accountRole || 'Usuario'}
                  </span>
                )}
              </div>
            )}

            {/* 3. Descripción */}
            <div className="ls-profile-field wide-field">
              <label>Descripción (maximo 150 caracteres)</label>
              {isEditing ? (
                <>
                  <textarea
                    maxLength={150}
                    style={{
                      width: '100%',
                      minWidth: '100%',
                      boxSizing: 'border-box',
                      marginTop: '4px',
                      ...getInputStyle('description'),
                    }}
                    value={profile.description ?? ''}
                    onChange={(event) => {
                      const val = event.target.value.slice(0, 150)
                      handleChange('description', val)
                    }}
                    placeholder="Escribe tu biografía musical (maximo 150 caracteres)..."
                  />
                  {renderFieldError('description')}
                  <small
                    style={{
                      color: (profile.description?.length || 0) >= 150 ? '#f59e0b' : '#10b981',
                      fontSize: '0.78rem',
                      marginTop: '4px',
                      display: 'block',
                      fontWeight: 500,
                    }}
                  >
                    Caracteres: {profile.description?.length || 0} / 150 maximo
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
                        if (val.trim().toLowerCase() !== verifiedLocation.trim().toLowerCase()) {
                          setIsLocationVerified(false)
                        }
                        searchLocation(val)
                      }}
                      onKeyDown={handleLocationKeyDown}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true)
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200)
                      }}
                      style={getInputStyle('location')}
                    />
                    {renderFieldError('location')}

                    {isLocationVerified && (profile.location?.trim() || '').length > 0 && (
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

                    {!isLocationVerified && (profile.location?.trim() || '').length > 0 && (
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
                        <span>Debes seleccionar una opción sugerida (clic, Tab o Enter) o marcarla en el mapa.</span>
                      </div>
                    )}

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
                              handleSelectLocation(item)
                            }}
                          >
                            <span className="ls-ac-text">{item.full}</span>
                            <span className="ls-ac-badge">{idx === highlightedIndex ? 'Tab / Enter' : 'Elegir'}</span>
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px' }} title={isLocating ? 'Obteniendo ubicación...' : 'Buscando...'} aria-label="Cargando">
                          <span className="ls-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', display: 'inline-block' }} />
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
                <span>{profile.email || 'Sin correo'}</span>
              )}
            </div>

            <div className="ls-profile-field">
              <label>Contraseña</label>
              {isEditing ? (
                <>
                  <input
                    type="password"
                    placeholder="•••••••• (dejar en blanco para conservar)"
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

            {/* Pistas de Muestra de Audio (.WAV, .MP3, .FLAC, .OGG) */}
            <div className="ls-profile-field wide-field">
              <AudioSampleTrackUploader
                tracks={profile.tracks || []}
                onChange={(updatedTracks: SoundCloudTrack[]) => {
                  handleChange('tracks', updatedTracks)
                }}
                isEditable={isEditing}
                isRequired={true}
                minTracks={1}
                maxTracks={5}
              />
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

      {/* Modal de Error al Guardar Perfil */}
      {saveErrorMessage && (
        <div className="ls-modal-overlay" onClick={() => setSaveErrorMessage(null)}>
          <div
            className="ls-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(100%, 440px)',
              background: '#0f1325',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '18px',
              padding: '24px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                <PiWarningOctagonBold style={{ fontSize: '1.4rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Error al guardar perfil</h3>
              </div>
              <button
                type="button"
                onClick={() => setSaveErrorMessage(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                aria-label="Cerrar modal"
              >
                <PiXBold />
              </button>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 20px' }}>
              {saveErrorMessage}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ls-primary-button"
                onClick={() => setSaveErrorMessage(null)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Externa de perfil */}
      <SoundCloudPreviewModal
        isOpen={isExternalPreviewOpen}
        card={previewProfileCard}
        onClose={() => setIsExternalPreviewOpen(false)}
        isExternalPreview={true}
      />

      <Footer />
    </div>
  )
}