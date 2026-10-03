import { useState, useRef, useEffect } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  PiMapPinBold,
  PiMusicNotesFill,
  PiCaretDownBold,
  PiCheckBold,
  PiUserBold,
} from 'react-icons/pi'

export type RadarFilterState = {
  locationQuery: string
  centerLat?: number
  centerLng?: number
  selectedCategories: string[]
  selectedGenres: string[]
  radius: number // Distancia en kilómetros
}

type RadarFiltersProps = {
  filters?: RadarFilterState
  onChangeFilters?: (newFilters: RadarFilterState) => void
  onReset?: () => void
}

type LocationSuggestion = {
  label: string
  full: string
  lat?: number
  lon?: number
}

const PRESET_LOCATIONS: LocationSuggestion[] = [
  { label: 'Francia, paris', full: 'Francia, paris', lat: 48.8566, lon: 2.3522 },
  { label: 'Berlin, Germany', full: 'Berlin, Germany', lat: 52.52, lon: 13.405 },
  { label: 'Entre Rios, Argentina', full: 'Entre Rios, Argentina', lat: -31.741, lon: -58.514 },
  { label: 'Trenque Lauquen, Argentina', full: 'Trenque Lauquen, Buenos Aires, Argentina', lat: -35.973, lon: -62.734 },
  { label: 'New York, USA', full: 'New York, NY, United States', lat: 40.7128, lon: -74.006 },
  { label: 'London, United Kingdom', full: 'London, England, United Kingdom', lat: 51.5074, lon: -0.1278 },
  { label: 'Los Angeles, USA', full: 'Los Angeles, CA, United States', lat: 34.0522, lon: -118.2437 },
  { label: 'Buenos Aires, Argentina', full: 'Buenos Aires, Argentina', lat: -34.6037, lon: -58.3816 },
  { label: 'Tokyo, Japan', full: 'Tokyo, Japan', lat: 35.6895, lon: 139.6917 },
]

const KNOWN_CITIES = [
  { label: 'Trenque Lauquen, Argentina', lat: -35.973, lon: -62.734 },
  { label: 'Buenos Aires, Argentina', lat: -34.6037, lon: -58.3816 },
  { label: 'Entre Ríos, Argentina', lat: -31.741, lon: -58.514 },
  { label: 'Córdoba, Argentina', lat: -31.4201, lon: -64.1888 },
  { label: 'Rosario, Argentina', lat: -32.9442, lon: -60.6505 },
  { label: 'Mendoza, Argentina', lat: -32.8895, lon: -68.8458 },
  { label: 'La Plata, Argentina', lat: -34.9214, lon: -57.9545 },
  { label: 'Mar del Plata, Argentina', lat: -38.0055, lon: -57.5426 },
  { label: 'Bariloche, Argentina', lat: -41.1335, lon: -71.3103 },
  { label: 'Salta, Argentina', lat: -24.7821, lon: -65.4232 },
  { label: 'Francia, Paris', lat: 48.8566, lon: 2.3522 },
  { label: 'Berlin, Germany', lat: 52.52, lon: 13.405 },
  { label: 'New York, USA', lat: 40.7128, lon: -74.006 },
  { label: 'London, United Kingdom', lat: 51.5074, lon: -0.1278 },
  { label: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437 },
  { label: 'Tokyo, Japan', lat: 35.6895, lon: 139.6917 },
  { label: 'Madrid, España', lat: 40.4168, lon: -3.7038 },
  { label: 'Barcelona, España', lat: 41.3851, lon: 2.1734 },
]

export function getNearestPlaceName(lat: number, lon: number): string {
  let closest = KNOWN_CITIES[0]
  let minDistance = Infinity

  for (const city of KNOWN_CITIES) {
    const dLat = city.lat - lat
    const dLon = city.lon - lon
    const distSq = dLat * dLat + dLon * dLon
    if (distSq < minDistance) {
      minDistance = distSq
      closest = city
    }
  }

  return closest.label
}

const collaboratorOptions = ['Productor', 'Artista', 'Productor/Artista'] as const

const availableGenres = [
  'Tech House',
  'Techno',
  'Synthwave',
  'Cyberpunk',
  'Ambient',
  'HardTrap',
  'Vocal',
  'Live',
  'Minimal',
  'Darkwave',
  'Alt Pop',
  'Electronic',
  'Lo-Fi',
  'ModularSynth',
  'Drone',
  'Industrial',
  'EBM',
]

export function RadarFilters({ filters, onChangeFilters, onReset }: RadarFiltersProps) {
  const currentFilters: RadarFilterState = filters ?? {
    locationQuery: '',
    selectedCategories: [],
    selectedGenres: [],
    radius: 50,
  }

  const [isLocating, setIsLocating] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [showCategoryPopover, setShowCategoryPopover] = useState(false)
  const [showGenrePopover, setShowGenrePopover] = useState(false)
  const [genreSearch, setGenreSearch] = useState('')

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const popoverCategoryRef = useRef<HTMLDivElement | null>(null)
  const popoverGenreRef = useRef<HTMLDivElement | null>(null)

  // Usar ubicación actual del navegador
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          updateMapPosition(latitude, longitude)
          reverseGeocode(latitude, longitude)
          setIsLocating(false)
        },
        (err) => {
          console.warn('Geolocation error or denied:', err)
          setIsLocating(false)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }

  // Cerrar popovers al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverCategoryRef.current && !popoverCategoryRef.current.contains(e.target as Node)) {
        setShowCategoryPopover(false)
      }
      if (popoverGenreRef.current && !popoverGenreRef.current.contains(e.target as Node)) {
        setShowGenrePopover(false)
      }
    }
    if (showCategoryPopover || showGenrePopover) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategoryPopover, showGenrePopover])

  // Inicializar / actualizar mapa de localización en el Radar
  useEffect(() => {
    if (!mapContainerRef.current) return

    let initialCenter: [number, number] = [13.405, 52.52] // Default Berlin
    if (currentFilters.centerLng !== undefined && currentFilters.centerLat !== undefined) {
      initialCenter = [currentFilters.centerLng, currentFilters.centerLat]
    } else if (navigator.geolocation && !currentFilters.locationQuery) {
      // Intentar obtener ubicación actual si no hay filtro establecido
      handleUseCurrentLocation()
    }

    // Actualizar mapa existente
    if (mapRef.current) {
      mapRef.current.flyTo({ center: initialCenter, zoom: 11 })
      if (markerRef.current) {
        markerRef.current.setLngLat(initialCenter)
      } else {
        markerRef.current = new maplibregl.Marker({ color: '#a855f7' })
          .setLngLat(initialCenter)
          .addTo(mapRef.current)
      }
      mapRef.current.resize()
      return
    }

    // Instancia única limpia
    mapContainerRef.current.innerHTML = ''

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: initialCenter,
      zoom: 11,
    })

    const marker = new maplibregl.Marker({ color: '#a855f7' })
      .setLngLat(initialCenter)
      .addTo(map)

    markerRef.current = marker
    mapRef.current = map

    // Clic directo sobre el mapa ubica el pin y actualiza el filtro de ubicación
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat])
      }
      map.flyTo({ center: [lng, lat], zoom: 12 })
      reverseGeocode(lat, lng)
    })

    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.resize()
    }, 150)

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
  }, [])

  // Geocodificación inversa tras clic en el mapa
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`
      )
      if (!response.ok) throw new Error('Geocoding request failed')
      const data = await response.json()
      const addr = data.address || {}

      const mainPlace =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.city_district ||
        addr.county ||
        addr.state_district ||
        addr.state ||
        addr.region ||
        data.name ||
        ''

      const regionOrCountry = addr.state || addr.country || ''

      let label = ''
      if (mainPlace && regionOrCountry && mainPlace.toLowerCase() !== regionOrCountry.toLowerCase()) {
        label = `${mainPlace}, ${regionOrCountry}`
      } else if (mainPlace) {
        label = mainPlace
      } else if (data.display_name) {
        const parts = data.display_name.split(',').map((s: string) => s.trim())
        label = parts.slice(0, 2).filter(Boolean).join(', ')
      }

      if (!label || label.trim().length === 0) {
        label = getNearestPlaceName(lat, lon)
      }

      onChangeFilters?.({
        ...currentFilters,
        locationQuery: label,
        centerLat: lat,
        centerLng: lon,
      })
    } catch {
      const fallbackLabel = getNearestPlaceName(lat, lon)
      onChangeFilters?.({
        ...currentFilters,
        locationQuery: fallbackLabel,
        centerLat: lat,
        centerLng: lon,
      })
    }
  }

  // Actualizar ubicación en el mapa al buscar o seleccionar
  const updateMapPosition = (lat: number, lon: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lon, lat], zoom: 12 })
      if (markerRef.current) {
        markerRef.current.setLngLat([lon, lat])
      } else {
        markerRef.current = new maplibregl.Marker({ color: '#a855f7' })
          .setLngLat([lon, lat])
          .addTo(mapRef.current)
      }
    }
  }

  const searchLocation = async (query: string) => {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.length < 1) {
      setSuggestions(PRESET_LOCATIONS)
      setShowSuggestions(true)
      setHighlightedIndex(0)
      return
    }

    const presetMatches = PRESET_LOCATIONS.filter(
      (loc) => loc.label.toLowerCase().includes(trimmed) || loc.full.toLowerCase().includes(trimmed)
    )

    setSuggestions(presetMatches.length > 0 ? presetMatches : PRESET_LOCATIONS)
    setShowSuggestions(true)
    setHighlightedIndex(0)

    if (presetMatches.length > 0 && presetMatches[0].lat && presetMatches[0].lon) {
      updateMapPosition(presetMatches[0].lat, presetMatches[0].lon)
      onChangeFilters?.({
        ...currentFilters,
        locationQuery: query,
        centerLat: presetMatches[0].lat,
        centerLng: presetMatches[0].lon,
      })
    }

    if (trimmed.length >= 2) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`
        )
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)

          updateMapPosition(lat, lon)

          const remoteResults: LocationSuggestion[] = data.map((item: any) => {
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
              full: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            }
          })

          const combined = [...presetMatches]
          remoteResults.forEach((remoteItem) => {
            if (!combined.some((c) => c.label.toLowerCase() === remoteItem.label.toLowerCase())) {
              combined.push(remoteItem)
            }
          })
          setSuggestions(combined.slice(0, 6))
          setShowSuggestions(true)

          onChangeFilters?.({
            ...currentFilters,
            locationQuery: query,
            centerLat: lat,
            centerLng: lon,
          })
        }
      } catch {
        // Fallback a presets
      }
    }
  }

  const handleInputChange = (val: string) => {
    onChangeFilters?.({ ...currentFilters, locationQuery: val })

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(val)
    }, 250)
  }

  const selectSuggestion = (loc: LocationSuggestion) => {
    onChangeFilters?.({
      ...currentFilters,
      locationQuery: loc.label,
      centerLat: loc.lat,
      centerLng: loc.lon,
    })
    if (loc.lat && loc.lon) {
      updateMapPosition(loc.lat, loc.lon)
    }
    setShowSuggestions(false)
  }

  const toggleCategory = (cat: string) => {
    const isSelected = currentFilters.selectedCategories.includes(cat)
    const nextCategories = isSelected
      ? currentFilters.selectedCategories.filter((c) => c !== cat)
      : [...currentFilters.selectedCategories, cat]

    onChangeFilters?.({ ...currentFilters, selectedCategories: nextCategories })
  }

  const toggleGenre = (genre: string) => {
    const isSelected = currentFilters.selectedGenres.includes(genre)
    const nextGenres = isSelected
      ? currentFilters.selectedGenres.filter((g) => g !== genre)
      : [...currentFilters.selectedGenres, genre]

    onChangeFilters?.({ ...currentFilters, selectedGenres: nextGenres })
  }

  const handleRadiusChange = (r: number) => {
    onChangeFilters?.({ ...currentFilters, radius: r })
  }

  const filteredAvailableGenres = availableGenres.filter((g) =>
    g.toLowerCase().includes(genreSearch.trim().toLowerCase())
  )

  return (
    <div className="ls-panel" style={{ padding: '14px 16px' }}>
      <div className="ls-panel-header" style={{ marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Radar Filters</h3>
        <button
          type="button"
          onClick={onReset}
          style={{ background: 'transparent', border: 'none', color: '#ff3c6e', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
        >
          Reset
        </button>
      </div>

      {/* Location Filter Input & Interactive Map */}
      <div className="ls-filter-block" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
            Location / Ubicación
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00e5ff',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <PiMapPinBold />
            {isLocating ? 'Detectando...' : 'Ubicación actual'}
          </button>
        </div>

        <div className="ls-location-input-wrapper" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Ej. Francia, Berlin, Argentina, NY..."
            value={currentFilters.locationQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (currentFilters.locationQuery.trim().length > 0) {
                searchLocation(currentFilters.locationQuery)
              } else {
                setSuggestions(PRESET_LOCATIONS)
                setShowSuggestions(true)
                setHighlightedIndex(0)
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            className="ls-explore-search-input"
            style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.8rem' }}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              className="ls-autocomplete-dropdown"
              role="listbox"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 999,
                marginTop: '4px',
                background: 'rgba(12, 14, 26, 0.98)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
              }}
            >
              {suggestions.map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className={`ls-autocomplete-item ${idx === highlightedIndex ? 'active' : ''}`}
                  role="option"
                  aria-selected={idx === highlightedIndex}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectSuggestion(item)
                  }}
                  style={{
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    color: idx === highlightedIndex ? '#00e5ff' : '#fff',
                    background: idx === highlightedIndex ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <span className="ls-ac-text" style={{ fontWeight: 500 }}>{item.label}</span>
                  <span className="ls-ac-badge" style={{ fontSize: '0.68rem', color: '#a855f7', opacity: 0.8 }}>Elegir</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chips de ubicaciones rápidas (Opciones de cambio de ubicación) */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
          {PRESET_LOCATIONS.slice(0, 4).map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => selectSuggestion(preset)}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                background: currentFilters.locationQuery === preset.label ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${currentFilters.locationQuery === preset.label ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                color: currentFilters.locationQuery === preset.label ? '#fff' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer'
              }}
            >
              {preset.label.split(',')[0]}
            </button>
          ))}
        </div>

        {/* Embedded Interactive Map for Radar (Compact: 105px height) */}
        <div style={{ marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#c084fc', marginBottom: '3px' }}>
            <PiMapPinBold />
            <span>Haz clic en el mapa para fijar el centro del radar</span>
          </div>
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '105px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          />
        </div>
      </div>

      {/* Distance Radius (Filtrado por kilómetros) */}
      <div className="ls-filter-block" style={{ marginBottom: '10px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
          <span>Distance Radius</span>
          <span style={{ color: '#c084fc', fontWeight: 700 }}>
            {currentFilters.radius >= 500 ? 'Sin límite (Global)' : `${currentFilters.radius} km`}
          </span>
        </label>
        <div className="ls-range-row" style={{ marginTop: '4px' }}>
          <input
            type="range"
            value={currentFilters.radius}
            min={5}
            max={500}
            step={5}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div className="ls-range-scale" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
          <span>5 km</span>
          <span>500 km (Global)</span>
        </div>
      </div>

      {/* Collaborator Type / Categoría Filter (Desplegable / Popover) */}
      <div className="ls-filter-block" style={{ position: 'relative', marginBottom: '10px' }} ref={popoverCategoryRef}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
          Collaborator Type (Categoría)
        </label>

        <button
          type="button"
          className="ls-category-popover-trigger"
          onClick={() => {
            setShowCategoryPopover(!showCategoryPopover)
            setShowGenrePopover(false)
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '8px',
            background: currentFilters.selectedCategories.length > 0 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${currentFilters.selectedCategories.length > 0 ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PiUserBold style={{ color: '#a855f7' }} />
            <span>
              {currentFilters.selectedCategories.length === 0
                ? 'Todas las categorías'
                : currentFilters.selectedCategories.length === 1
                  ? currentFilters.selectedCategories[0]
                  : `${currentFilters.selectedCategories.length} categorías seleccionadas`}
            </span>
          </div>
          <PiCaretDownBold style={{ transform: showCategoryPopover ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
        </button>

        {/* Popover / Desplegable Categoría */}
        {showCategoryPopover && (
          <div
            className="ls-category-popover-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              marginTop: '4px',
              background: '#0d1021',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '10px',
              padding: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e9d5ff' }}>Seleccionar Categoría</span>
              {currentFilters.selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeFilters?.({ ...currentFilters, selectedCategories: [] })}
                  style={{ background: 'transparent', border: 'none', color: '#ff3c6e', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Limpiar ({currentFilters.selectedCategories.length})
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {collaboratorOptions.map((option) => {
                const isSelected = currentFilters.selectedCategories.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleCategory(option)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                      color: isSelected ? '#a855f7' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 600 : 400,
                      textAlign: 'left',
                    }}
                  >
                    <span>{option}</span>
                    {isSelected && <PiCheckBold style={{ color: '#a855f7' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Genre Interests Filter (Desplegable / Popover que se abre hacia arriba) */}
      <div className="ls-filter-block" style={{ marginBottom: '4px' }} ref={popoverGenreRef}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
          Genre Interests (Géneros)
        </label>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="ls-genre-popover-trigger"
            onClick={() => {
              setShowGenrePopover(!showGenrePopover)
              setShowCategoryPopover(false)
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              background: currentFilters.selectedGenres.length > 0 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${currentFilters.selectedGenres.length > 0 ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PiMusicNotesFill style={{ color: '#a855f7' }} />
              <span>
                {currentFilters.selectedGenres.length === 0
                  ? 'Todos los géneros'
                  : `${currentFilters.selectedGenres.length} género(s) seleccionado(s)`}
              </span>
            </div>
            <PiCaretDownBold style={{ transform: showGenrePopover ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Desplegable / Popover Géneros (Abre estrictamente hacia arriba) */}
          {showGenrePopover && (
            <div
              className="ls-genre-popover-dropdown"
              style={{
                position: 'absolute',
                top: 'auto',
                bottom: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 1000,
                background: '#0d1021',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '10px',
                padding: '10px',
                boxShadow: '0 -10px 30px rgba(0,0,0,0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e9d5ff' }}>Seleccionar Géneros</span>
                {currentFilters.selectedGenres.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChangeFilters?.({ ...currentFilters, selectedGenres: [] })}
                    style={{ background: 'transparent', border: 'none', color: '#ff3c6e', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Limpiar ({currentFilters.selectedGenres.length})
                  </button>
                )}
              </div>

              <div style={{ position: 'relative', marginBottom: '6px' }}>
                <input
                  type="text"
                  placeholder="Buscar género..."
                  value={genreSearch}
                  onChange={(e) => setGenreSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '0.76rem',
                  }}
                />
              </div>

              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredAvailableGenres.map((genre) => {
                  const isSelected = currentFilters.selectedGenres.includes(genre)
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                        border: 'none',
                        color: isSelected ? '#a855f7' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 600 : 400,
                        textAlign: 'left',
                      }}
                    >
                      <span>{genre}</span>
                      {isSelected && <PiCheckBold style={{ color: '#a855f7' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

