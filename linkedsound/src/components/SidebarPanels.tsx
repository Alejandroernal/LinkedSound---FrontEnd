import { useState, useRef } from 'react'

export type RadarFilterState = {
  locationQuery: string
  selectedCategories: string[]
  selectedGenres: string[]
  radius: number
}

type RadarFiltersProps = {
  filters?: RadarFilterState
  onChangeFilters?: (newFilters: RadarFilterState) => void
  onReset?: () => void
}

type LocationSuggestion = {
  label: string
  full: string
}

const PRESET_LOCATIONS: LocationSuggestion[] = [
  { label: 'Francia, paris', full: 'Francia, paris' },
  { label: 'Berlin, Germany', full: 'Berlin, Germany' },
  { label: 'Entre Rios, Argentina', full: 'Entre Rios, Argentina' },
  { label: 'New York, USA', full: 'New York, NY, United States' },
  { label: 'London, United Kingdom', full: 'London, England, United Kingdom' },
  { label: 'Los Angeles, USA', full: 'Los Angeles, CA, United States' },
  { label: 'Paris, France', full: 'Paris, Île-de-France, France' },
  { label: 'Madrid, Spain', full: 'Madrid, Spain' },
  { label: 'Buenos Aires, Argentina', full: 'Buenos Aires, Argentina' },
  { label: 'Tokyo, Japan', full: 'Tokyo, Japan' },
]

const collaboratorOptions = ['Productor', 'Artista', 'Productor/Artista'] as const
const availableGenres = [
  'ModularSynth', 'Live', 'Drone', 'Vocal', 'Alt Pop',
  'Analog', 'HardTrap', 'Synthwave', 'Electronic', 'Dark Pop', 'Darkwave X', 'Industrial X'
]

export function RadarFilters({ filters, onChangeFilters, onReset }: RadarFiltersProps) {
  const currentFilters: RadarFilterState = filters ?? {
    locationQuery: '',
    selectedCategories: [],
    selectedGenres: [],
    radius: 50,
  }

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchLocation = async (query: string) => {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.length < 1) {
      setSuggestions(PRESET_LOCATIONS)
      setShowSuggestions(true)
      setHighlightedIndex(0)
      return
    }

    const presetMatches = PRESET_LOCATIONS.filter((loc) =>
      loc.label.toLowerCase().includes(trimmed) || loc.full.toLowerCase().includes(trimmed)
    )

    setSuggestions(presetMatches.length > 0 ? presetMatches : PRESET_LOCATIONS)
    setShowSuggestions(true)
    setHighlightedIndex(0)

    if (trimmed.length >= 2) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`
        )
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
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
        }
      } catch {
        // Fallback to presets
      }
    }
  }

  const handleInputChange = (val: string) => {
    handleLocationChange(val)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(val)
    }, 200)
  }

  const selectSuggestion = (loc: LocationSuggestion) => {
    handleLocationChange(loc.label)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        const target = suggestions[highlightedIndex] || suggestions[0]
        selectSuggestion(target)
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

  const handleLocationChange = (query: string) => {
    onChangeFilters?.({ ...currentFilters, locationQuery: query })
  }

  const handleRadiusChange = (r: number) => {
    onChangeFilters?.({ ...currentFilters, radius: r })
  }

  return (
    <div className="ls-panel">
      <div className="ls-panel-header">
        <h3>Radar Filters</h3>
        <button
          type="button"
          onClick={onReset}
          style={{ background: 'transparent', border: 'none', color: '#ff3c6e', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
        >
          Reset
        </button>
      </div>

      {/* Location Filter Input con Desplegable de Sugerencias */}
      <div className="ls-filter-block">
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
          Location / Ubicación
        </label>
        <div className="ls-location-input-wrapper" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Ej. Francia, Berlin, Argentina, NY..."
            value={currentFilters.locationQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
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
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.85rem' }}
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
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    color: idx === highlightedIndex ? '#00e5ff' : '#fff',
                    background: idx === highlightedIndex ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <span className="ls-ac-text" style={{ fontWeight: 500 }}>{item.label}</span>
                  <span className="ls-ac-badge" style={{ fontSize: '0.7rem', color: '#a855f7', opacity: 0.8 }}>Elegir</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Distance Radius */}
      <div className="ls-filter-block">
        <label>Distance Radius</label>
        <div className="ls-range-row">
          <input
            type="range"
            value={currentFilters.radius}
            min={1}
            max={100}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
          />
          <span>{currentFilters.radius === 100 ? 'Worldwide' : `${currentFilters.radius} miles`}</span>
        </div>
        <div className="ls-range-scale">
          <span>In studio</span>
          <span>Worldwide</span>
        </div>
      </div>

      {/* Collaborator Type / Categoría Filter (Multi-select) */}
      <div className="ls-filter-block">
        <label>Collaborator Type (Categoría)</label>
        <div className="ls-choice-list">
          {collaboratorOptions.map((option) => {
            const isSelected = currentFilters.selectedCategories.includes(option)
            return (
              <button
                key={option}
                type="button"
                className={`ls-toggle ${isSelected ? 'is-selected' : ''}`}
                onClick={() => toggleCategory(option)}
                style={{
                  background: isSelected ? 'rgba(168, 85, 247, 0.3)' : undefined,
                  borderColor: isSelected ? '#a855f7' : undefined,
                  color: isSelected ? '#fff' : undefined,
                  fontWeight: isSelected ? 600 : 400
                }}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      {/* Genre Interests Filter (Multi-select) */}
      <div className="ls-filter-block">
        <label>Genre Interests (Géneros)</label>
        <div className="ls-genre-selector">
          {availableGenres.map((genre) => {
            const isSelected = currentFilters.selectedGenres.includes(genre)

            return (
              <button
                key={genre}
                type="button"
                className={`ls-genre-chip ${isSelected ? 'is-selected' : ''}`}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
