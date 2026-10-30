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
  PiWarningBold,
  PiEyeSlashBold,
  PiNavigationArrowBold,
  PiUploadSimpleBold,
  PiClockBold,
  PiPencilSimpleBold,
  PiImageBold,
  PiTrashBold,
  PiWarningOctagonBold,
  PiLockKeyBold,
} from 'react-icons/pi'
import type { ProfileCard } from '../data/mockData'

type CreateEventModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreateEvent: (newEvent: ProfileCard) => void
  onUpdateEvent?: (updatedEvent: ProfileCard) => void
  eventToEdit?: ProfileCard | null
  userNickname?: string
  userLocation?: string
}

type LocationSuggestion = {
  label: string
  lat: number
  lon: number
  full: string
  country?: string
  province?: string
  city?: string
}

const PRESET_LOCATIONS: LocationSuggestion[] = [
  { label: 'Berlin, Germany', lat: 52.520, lon: 13.405, full: 'Berlin, Germany', country: 'Alemania', province: 'Berlín', city: 'Berlin' },
  { label: 'London, United Kingdom', lat: 51.507, lon: -0.127, full: 'London, England, United Kingdom', country: 'Reino Unido', province: 'England', city: 'London' },
  { label: 'New York, USA', lat: 40.712, lon: -74.006, full: 'New York, NY, United States', country: 'Estados Unidos', province: 'New York', city: 'New York' },
  { label: 'Los Angeles, USA', lat: 34.052, lon: -118.243, full: 'Los Angeles, CA, United States', country: 'Estados Unidos', province: 'California', city: 'Los Angeles' },
  { label: 'Paris, France', lat: 48.856, lon: 2.352, full: 'Paris, Île-de-France, France', country: 'Francia', province: 'Île-de-France', city: 'Paris' },
  { label: 'Madrid, Spain', lat: 40.416, lon: -3.703, full: 'Madrid, Community of Madrid, Spain', country: 'España', province: 'Madrid', city: 'Madrid' },
  { label: 'Buenos Aires, Argentina', lat: -34.603, lon: -58.381, full: 'Buenos Aires, Argentina', country: 'Argentina', province: 'Buenos Aires', city: 'Buenos Aires' },
  { label: 'Tokyo, Japan', lat: 35.676, lon: 139.650, full: 'Tokyo, Japan', country: 'Japón', province: 'Tokyo', city: 'Tokyo' },
  { label: 'Amsterdam, Netherlands', lat: 52.367, lon: 4.904, full: 'Amsterdam, Netherlands', country: 'Países Bajos', province: 'North Holland', city: 'Amsterdam' },
  { label: 'Mexico City, Mexico', lat: 19.432, lon: -99.133, full: 'Mexico City, Mexico', country: 'México', province: 'CDMX', city: 'Ciudad de México' },
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
  'Experimental',
]

export default function CreateEventModal({
  isOpen,
  onClose,
  onCreateEvent,
  onUpdateEvent,
  eventToEdit,
  userNickname = 'Organizador',
  userLocation = '',
}: CreateEventModalProps) {
  const isEditing = Boolean(eventToEdit && eventToEdit.id)

  const [title, setTitle] = useState('')
  const [role, setRole] = useState('Showcase & Live Performance')
  const [location, setLocation] = useState('')
  const [verifiedLocation, setVerifiedLocation] = useState('')
  const [isLocationVerified, setIsLocationVerified] = useState(false)

  const [country, setCountry] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [streetAddress, setStreetAddress] = useState('')

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [showMap, setShowMap] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [venue, setVenue] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('22:00')
  const [description, setDescription] = useState('')
  const [ticketUrl, setTicketUrl] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Live', 'Techno'])
  const [profileImage, setProfileImage] = useState('')

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Cálculo de lapso de modificación de 24 horas
  const createdAtTime = eventToEdit?.createdAt ? new Date(eventToEdit.createdAt).getTime() : null
  const isExpired = isEditing && createdAtTime ? (Date.now() - createdAtTime) > 24 * 60 * 60 * 1000 : false
  const remainingHours = isEditing && createdAtTime
    ? Math.max(0, 24 - (Date.now() - createdAtTime) / (1000 * 60 * 60))
    : 24

  useEffect(() => {
    if (!isOpen) return

    if (eventToEdit) {
      const ev = eventToEdit as any
      const evTitle = ev.nickname || ev.title || ''
      setTitle(evTitle)
      setRole(ev.role || 'Showcase & Live Performance')
      const evLoc = ev.location || ''
      setLocation(evLoc)
      setVerifiedLocation(evLoc)
      setIsLocationVerified(Boolean(evLoc.trim()))
      setCountry(ev.country || '')
      setProvince(ev.province || '')
      setCity(ev.city || '')
      setStreetAddress(ev.streetAddress || '')
      setVenue(ev.venue || '')
      setEventDate(ev.eventDate || '')
      setEventTime(ev.eventTime || '22:00')
      setDescription(ev.description || '')
      setTicketUrl(ev.ticketUrl || '')
      setSelectedGenres(ev.interestGenres && ev.interestGenres.length > 0 ? ev.interestGenres : ['Live', 'Techno'])
      setProfileImage(ev.profileImage || '')
      setHighlightedIndex(0)
    } else {
      setTitle('')
      setRole('Showcase & Live Performance')
      setLocation('')
      setVerifiedLocation('')
      setIsLocationVerified(false)
      setCountry('')
      setProvince('')
      setCity('')
      setStreetAddress('')
      setVenue('')
      setEventDate('')
      setEventTime('22:00')
      setDescription('')
      setTicketUrl('')
      setSelectedGenres(['Live', 'Techno'])
      setProfileImage('')
      setHighlightedIndex(0)
    }
    setValidationError(null)
  }, [isOpen, eventToEdit, userLocation])

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

      setCountry(foundCountry)
      setProvince(foundProvince)
      setCity(foundCity)
      setStreetAddress(foundStreet)

      const label = [foundStreet, foundCity, foundProvince, foundCountry].filter(Boolean).join(', ')
      const finalLoc = label || `${lat.toFixed(3)}, ${lon.toFixed(3)}`
      setLocation(finalLoc)
      setVerifiedLocation(finalLoc)
      setIsLocationVerified(true)
      if (validationError) setValidationError(null)
    } catch {
      const fallback = `${lat.toFixed(3)}, ${lon.toFixed(3)}`
      setLocation(fallback)
      setVerifiedLocation(fallback)
      setIsLocationVerified(true)
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
          const foundProvince = addr.state || addr.province || addr.region || ''
          const foundCountry = addr.country || ''
          return {
            label: [foundCity, foundCountry].filter(Boolean).join(', '),
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            full: item.display_name,
            country: foundCountry,
            province: foundProvince,
            city: foundCity,
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
    setLocation(loc.label)
    setVerifiedLocation(loc.label)
    setIsLocationVerified(true)
    setShowSuggestions(false)
    if (validationError) setValidationError(null)

    if (loc.country) setCountry(loc.country)
    if (loc.province) setProvince(loc.province)
    if (loc.city) setCity(loc.city)

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

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo (imagen)
    if (!file.type.startsWith('image/')) {
      setValidationError('El archivo seleccionado no es una imagen válida. Formatos permitidos: JPG, PNG, WEBP, GIF.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    if (!validExtensions.includes(fileExt)) {
      setValidationError('Extensión de archivo no permitida. Formatos válidos: JPG, PNG, WEBP, GIF.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validar tamaño máximo de imagen (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setValidationError('El archivo de imagen excede el límite permitido de 10 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string
      setProfileImage(result)
      setValidationError(null)
    }
    reader.readAsDataURL(file)
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
  }, [isOpen, showMap])

  if (!isOpen) return null

  const handleGenreToggle = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g].slice(0, 4)
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && isExpired) {
      setValidationError('El plazo de modificación de 24 horas para este evento ha expirado. Ya no es posible modificar dicho evento.')
      return
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const todayStr = `${currentYear}-${month}-${day}`

    // 1. Restricción de caracteres en título
    const trimmedTitle = title.trim()
    if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 50) {
      setValidationError('El título del evento es obligatorio y debe tener entre 3 y 50 caracteres para preservar el formato.')
      return
    }

    // 2. Validación de Fecha y Año de 4 dígitos
    if (!eventDate) {
      setValidationError('Por favor completa la fecha del evento.')
      return
    }

    const yearParts = eventDate.split('-')
    const enteredYearStr = yearParts[0]
    const enteredYear = parseInt(enteredYearStr, 10)

    if (!enteredYearStr || enteredYearStr.length !== 4 || isNaN(enteredYear) || enteredYear < currentYear || enteredYear > 2099) {
      setValidationError(`El año debe tener exactamente 4 dígitos y ser válido (entre ${currentYear} y 2099).`)
      return
    }

    if (eventDate < todayStr) {
      setValidationError('No puedes publicar ni modificar eventos con fechas pasadas. La fecha debe ser igual o posterior a hoy.')
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

    // 3. Validación de Localización corroborada (Tabulación obligatoria)
    const locTrim = location.trim()
    const isLocValid = isLocationVerified && locTrim.length > 0 && locTrim.toLowerCase() === verifiedLocation.trim().toLowerCase()
    if (!isLocValid) {
      setValidationError('Debes corroborar la información de localización seleccionando una opción sugerida (presiona Tab o Enter) o marcarla en el mapa.')
      return
    }

    // 4. Validación de longitud máxima en descripción
    if (description && description.trim().length > 250) {
      setValidationError('La descripción no debe superar los 250 caracteres para no romper el formato en el modal.')
      return
    }

    // 5. Validación de Imagen
    if (profileImage && !profileImage.startsWith('data:image/') && !profileImage.startsWith('http://') && !profileImage.startsWith('https://')) {
      setValidationError('La imagen promocional debe ser un archivo de imagen válido o una URL web (http/https).')
      return
    }

    // 6. Enlace de Tickets puede ser campo nulo
    let finalTicketUrl: string | null = null
    if (ticketUrl && ticketUrl.trim()) {
      const trimmedTicket = ticketUrl.trim()
      if (!trimmedTicket.startsWith('http://') && !trimmedTicket.startsWith('https://')) {
        finalTicketUrl = `https://${trimmedTicket}`
      } else {
        finalTicketUrl = trimmedTicket
      }
    }

    const finalLocation =
      [streetAddress.trim(), city.trim(), province.trim(), country.trim()].filter(Boolean).join(', ') ||
      locTrim ||
      'Online / Global'

    if (isEditing && eventToEdit && onUpdateEvent) {
      const updatedEvent: ProfileCard = {
        ...eventToEdit,
        title: trimmedTitle.slice(0, 50),
        nickname: trimmedTitle.slice(0, 50),
        role: role.trim().slice(0, 40) || 'Evento Live',
        location: finalLocation,
        country: country.trim() || undefined,
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        streetAddress: streetAddress.trim().slice(0, 50) || undefined,
        interestGenres: selectedGenres,
        profileImage: profileImage.trim() || undefined,
        description: description.trim().slice(0, 250) || undefined,
        eventDate,
        eventTime: eventTime || '22:00',
        venue: venue.trim().slice(0, 40) || undefined,
        ticketUrl: finalTicketUrl || undefined,
      }
      onUpdateEvent(updatedEvent)
    } else {
      const newEvent: ProfileCard = {
        title: trimmedTitle.slice(0, 50),
        nickname: trimmedTitle.slice(0, 50),
        role: role.trim().slice(0, 40) || 'Evento Live',
        location: finalLocation,
        country: country.trim(),
        province: province.trim(),
        city: city.trim(),
        streetAddress: streetAddress.trim().slice(0, 50),
        interestGenres: selectedGenres,
        profileImage: profileImage.trim() || undefined,
        match: '100%',
        description: description.trim().slice(0, 250) || 'Nuevo evento publicado por la comunidad en LinkedSound.',
        badge: 'Evento',
        itemRole: 'Evento',
        isProfile: false,
        owner: userNickname,
        ownerNickname: userNickname,
        eventDate,
        eventTime: eventTime || '22:00',
        venue: venue.trim().slice(0, 40) || 'Venue Principal',
        ticketUrl: finalTicketUrl || undefined,
        isFinished: false,
        soundcloudUrl: '',
        spotifyUrl: '',
        instagramUrl: '',
      }
      onCreateEvent(newEvent)
    }

    onClose()
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
                background: isEditing
                  ? 'linear-gradient(135deg, #00e5ff, #6d5efc)'
                  : 'linear-gradient(135deg, #a855f7, #6d5efc)',
                color: '#fff',
                boxShadow: isEditing
                  ? '0 0 20px rgba(0, 229, 255, 0.5)'
                  : '0 0 20px rgba(168, 85, 247, 0.5)'
              }}
            >
              {isEditing ? <PiPencilSimpleBold /> : <PiCalendarPlusBold />}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>
                {isEditing ? 'Modificar Evento' : 'Publicar Nuevo Evento'}
              </h3>
              <p className="ls-report-subtitle">
                Organizador: <strong>{userNickname}</strong>
              </p>
            </div>
          </div>

          {/* Banner de lapso de modificación de 24 horas */}
          {isEditing && (
            isExpired ? (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#fca5a5',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}
              >
                <PiWarningBold size={20} style={{ flexShrink: 0, color: '#ef4444' }} />
                <span>
                  <strong>Plazo de modificación expirado:</strong> Han transcurrido más de 24 horas desde la creación de este evento. Conforme a las reglas de la plataforma, no es posible modificarlo.
                </span>
              </div>
            ) : (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  color: '#e9d5ff',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <PiClockBold size={18} style={{ color: '#c084fc', flexShrink: 0 }} />
                <span>
                  <strong>Ventana de edición activa:</strong> Restan aproximadamente {remainingHours.toFixed(1)} horas para realizar modificaciones a este evento.
                </span>
              </div>
            )
          )}

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
              <PiWarningBold size={18} style={{ flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Título del Evento con restricción de caracteres */}
          <div className="ls-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="ls-form-label">Título del Evento *</label>
              <span style={{ fontSize: '0.72rem', color: title.length > 45 ? '#f59e0b' : 'rgba(255,255,255,0.45)' }}>
                {title.length}/50 caracteres
              </span>
            </div>
            <input
              type="text"
              maxLength={50}
              disabled={isExpired}
              placeholder="Ej. Synth Lab Live Night, Berlin Underground Jam..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (validationError) setValidationError(null)
              }}
              className="ls-select-input"
              style={{
                borderColor: validationError && (!title.trim() || title.trim().length < 3) ? '#ef4444' : undefined,
                boxShadow: validationError && (!title.trim() || title.trim().length < 3) ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="ls-form-group">
              <label className="ls-form-label">Concepto / Formato</label>
              <input
                type="text"
                maxLength={40}
                disabled={isExpired}
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
                maxLength={40}
                disabled={isExpired}
                placeholder="Ej. Watergate Club, Niceto..."
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="ls-select-input"
              />
            </div>
          </div>

          {/* Selector de Ubicación Verificada con Autocomplete y Mapa */}
          <div className="ls-form-group wide-field ls-location-group" style={{ position: 'relative' }}>
            <label className="ls-form-label">
              Ubicación de la Localidad *
            </label>
            <div>
              <div className="ls-location-input-wrapper" style={{ position: 'relative' }}>
                <input
                  type="text"
                  disabled={isExpired}
                  placeholder="Escribe la ciudad o selecciona en el mapa (ej. Berlín, Buenos Aires, Madrid...)"
                  value={location}
                  onChange={(e) => {
                    const val = e.target.value
                    setLocation(val)
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
                    setTimeout(() => setShowSuggestions(false), 250)
                  }}
                  className="ls-select-input"
                  style={{
                    borderColor: validationError && !isLocationVerified ? '#ef4444' : undefined,
                    boxShadow: validationError && !isLocationVerified ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined,
                  }}
                />

                {showSuggestions && suggestions.length > 0 && !isExpired && (
                  <div className="ls-autocomplete-dropdown" role="listbox">
                    {suggestions.map((item, idx) => (
                      <div
                        key={`${item.lat}-${item.lon}-${idx}`}
                        className={`ls-autocomplete-item ${idx === highlightedIndex ? 'active' : ''}`}
                        role="option"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelectLocation(item)
                        }}
                      >
                        <span className="ls-ac-text">{item.full}</span>
                        <span className="ls-ac-badge">
                          {idx === highlightedIndex ? 'Tab / Enter ↹' : 'Elegir'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isLocationVerified && (location.trim() || '').length > 0 && (
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
                  <span>Localidad Verificada: {verifiedLocation}</span>
                </div>
              )}

              {!isLocationVerified && (location.trim() || '').length > 0 && (
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
                  <span>Debes corroborar la información seleccionando una opción sugerida (Tab o Enter) o marcarla en el mapa.</span>
                </div>
              )}

              {showSuggestions && suggestions.length > 0 && !isExpired && (
                <div className="ls-tab-hint">
                  <span>Sugerencia rápida: presiona <kbd>Tab</kbd> o <kbd>Enter</kbd> para elegir <strong>{suggestions[highlightedIndex]?.label || suggestions[0]?.label}</strong></span>
                </div>
              )}

              {!showMap && !isExpired && (
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
                  <button
                    type="button"
                    className="ls-map-toggle-btn"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <PiNavigationArrowBold />
                    {isLocating ? 'Detectando...' : 'Usar mi ubicación actual'}
                  </button>
                  {(isLocating || isSearching) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px' }} title={isLocating ? 'Obteniendo ubicación...' : 'Buscando...'}>
                      <span className="ls-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', display: 'inline-block' }} />
                    </div>
                  )}
                </div>
              )}

              {showMap && !isExpired && (
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
                    style={{ width: '100%', height: '240px', borderRadius: '12px', marginTop: 0 }}
                  />

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

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      zIndex: 10,
                      background: 'rgba(15, 19, 37, 0.8)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.72rem',
                      pointerEvents: 'none'
                    }}
                  >
                    Haz clic en el mapa para marcar la posición exacta
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detalle de Localización sincronizado (Campos corroborados automáticamente) */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px', margin: '4px 0 14px 0' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#c084fc', fontWeight: 700, marginBottom: '10px' }}>
              <PiMapPinBold style={{ marginRight: '4px' }} /> Detalle de Localización del Evento
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div className="ls-form-group">
                <label className="ls-form-label" style={{ fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>País</span>
                  <PiLockKeyBold style={{ color: '#c084fc', fontSize: '0.8rem' }} title="Campo corroborado automáticamente" />
                </label>
                <input
                  type="text"
                  readOnly
                  disabled={isExpired}
                  placeholder="Selecciona una opción sugerida arriba..."
                  value={country}
                  className="ls-select-input"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: country ? '#f3e8ff' : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'not-allowed',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                  }}
                />
              </div>
              <div className="ls-form-group">
                <label className="ls-form-label" style={{ fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Provincia / Estado</span>
                  <PiLockKeyBold style={{ color: '#c084fc', fontSize: '0.8rem' }} title="Campo corroborado automáticamente" />
                </label>
                <input
                  type="text"
                  readOnly
                  disabled={isExpired}
                  placeholder="Selecciona una opción sugerida arriba..."
                  value={province}
                  className="ls-select-input"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: province ? '#f3e8ff' : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'not-allowed',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="ls-form-group">
                <label className="ls-form-label" style={{ fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Localidad / Ciudad</span>
                  <PiLockKeyBold style={{ color: '#c084fc', fontSize: '0.8rem' }} title="Campo corroborado automáticamente" />
                </label>
                <input
                  type="text"
                  readOnly
                  disabled={isExpired}
                  placeholder="Selecciona una opción sugerida arriba..."
                  value={city}
                  className="ls-select-input"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: city ? '#f3e8ff' : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'not-allowed',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                  }}
                />
              </div>
              <div className="ls-form-group">
                <label className="ls-form-label" style={{ fontSize: '0.74rem' }}>Calle y Altura (Opcional)</label>
                <input
                  type="text"
                  maxLength={50}
                  disabled={isExpired}
                  placeholder="Ej. Niceto Vega 5510, Skalitzer Str. 130..."
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="ls-select-input"
                />
              </div>
            </div>
          </div>

          {/* Fecha y Hora con restricción de año a 4 dígitos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="ls-form-group">
              <label className="ls-form-label">Fecha * (Año de 4 dígitos)</label>
              <input
                type="date"
                disabled={isExpired}
                min={new Date().toLocaleDateString('sv-SE')}
                max="2099-12-31"
                value={eventDate}
                onChange={(e) => {
                  const val = e.target.value
                  setEventDate(val)
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
                disabled={isExpired}
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="ls-select-input"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Enlace de Entradas / Tickets (Campo nulo / Opcional) */}
          <div className="ls-form-group">
            <label className="ls-form-label">
              Enlace de Entradas / Tickets (Opcional) <PiTicketBold style={{ color: '#00e5ff' }} />
            </label>
            <input
              type="url"
              disabled={isExpired}
              placeholder="https://eventbrite.com/tu-evento (dejar vacío si no aplica)"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              className="ls-select-input"
            />
          </div>

          {/* Descripción / Lineup con límite de caracteres */}
          <div className="ls-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="ls-form-label">Descripción / Lineup</label>
              <span style={{ fontSize: '0.72rem', color: description.length > 220 ? '#f59e0b' : 'rgba(255,255,255,0.45)' }}>
                {description.length}/250 caracteres
              </span>
            </div>
            <textarea
              className="ls-textarea-input"
              rows={3}
              maxLength={250}
              disabled={isExpired}
              placeholder="Describe la propuesta musical, DJs o artistas invitados (máx 250 caracteres)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Géneros Destacados */}
          <div className="ls-form-group">
            <label className="ls-form-label">Géneros Destacados (máx 4)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {genreOptions.map((g) => {
                const isSelected = selectedGenres.includes(g)
                return (
                  <button
                    key={g}
                    type="button"
                    disabled={isExpired}
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

          {/* Imagen Promocional del Evento con Validación de Imagen */}
          <div className="ls-form-group">
            <label className="ls-form-label">
              Flyer / Imagen Promocional del Evento <PiImageBold style={{ color: '#c084fc' }} />
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                style={{ display: 'none' }}
                disabled={isExpired}
                onChange={handleImageFileUpload}
              />
              <button
                type="button"
                className="ls-secondary-button"
                disabled={isExpired}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '0.8rem',
                }}
              >
                <PiUploadSimpleBold /> Subir Archivo de Imagen
              </button>
              <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)' }}>
                Formatos permitidos: JPG, PNG, WEBP, GIF (máx 10 MB)
              </span>
            </div>

            <input
              type="url"
              disabled={isExpired}
              placeholder="O escribe una URL directa de imagen (https://...)"
              value={profileImage.startsWith('data:image/') ? '' : profileImage}
              onChange={(e) => {
                setProfileImage(e.target.value)
                if (validationError) setValidationError(null)
              }}
              className="ls-select-input"
            />

            {profileImage && (
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                <img
                  src={profileImage}
                  alt="Vista previa del flyer"
                  style={{ width: '70px', height: '52px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#c084fc', fontWeight: 600 }}>
                    Imagen promocional cargada
                  </span>
                  {!isExpired && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileImage('')
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.74rem',
                        padding: 0,
                        marginTop: '2px',
                        textDecoration: 'underline',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <PiTrashBold /> Quitar imagen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="ls-modal-actions" style={{ marginTop: '14px' }}>
            <button type="button" className="ls-secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isExpired}
              className="ls-primary-button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isExpired ? 0.5 : 1,
                cursor: isExpired ? 'not-allowed' : 'pointer'
              }}
            >
              <PiSparkleBold /> {isEditing ? 'Guardar Cambios' : 'Publicar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
