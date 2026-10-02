import { useEffect, useRef, useState } from 'react'
import { PiFunnelBold, PiTagBold, PiCheckBold, PiBroomBold, PiMusicNotesBold, PiMagnifyingGlassBold, PiXBold } from 'react-icons/pi'

type GenreFilterPopoverProps = {
  isOpen: boolean
  onClose: () => void
  currentGenre: string
  onSelectGenre: (genre: string) => void
}

const ALL_GENRES = [
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

export default function GenreFilterPopover({
  isOpen,
  onClose,
  currentGenre,
  onSelectGenre,
}: GenreFilterPopoverProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const query = searchQuery.trim().toLowerCase()
  const filteredGenres = ALL_GENRES.filter((g) => g.toLowerCase().includes(query))
  const showAllOption = !query || 'todos los géneros'.includes(query) || 'todos'.includes(query)

  return (
    <div className="ls-genre-popover-dropdown" ref={popoverRef}>
      {/* Encabezado */}
      <div className="ls-genre-popover-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PiFunnelBold style={{ color: '#a855f7', fontSize: '1.1rem' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
              Filtrar por Género
            </span>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.55)' }}>
              Busca o selecciona un estilo de sonido
            </span>
          </div>
        </div>

        {currentGenre && (
          <button
            type="button"
            className="ls-genre-popover-clear-btn"
            onClick={() => {
              onSelectGenre('')
              setSearchQuery('')
              onClose()
            }}
            title="Limpiar filtro de género"
          >
            <PiBroomBold /> Limpiar
          </button>
        )}
      </div>

      <hr className="ls-dropdown-divider" />

      {/* Campo de Búsqueda Interna */}
      <div className="ls-genre-popover-search-wrap">
        <PiMagnifyingGlassBold className="ls-genre-popover-search-icon" />
        <input
          type="text"
          placeholder="Buscar género..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ls-genre-popover-search-input"
          autoFocus
        />
        {searchQuery && (
          <button
            type="button"
            className="ls-genre-search-clear-btn"
            onClick={() => setSearchQuery('')}
            title="Borrar texto"
          >
            <PiXBold />
          </button>
        )}
      </div>

      <hr className="ls-dropdown-divider" />

      {/* Lista de Opciones */}
      <div className="ls-genre-popover-list">
        {showAllOption && (
          <button
            type="button"
            className={`ls-genre-popover-item ${currentGenre === '' ? 'is-selected' : ''}`}
            onClick={() => {
              onSelectGenre('')
              setSearchQuery('')
              onClose()
            }}
          >
            <PiMusicNotesBold className="ls-genre-item-icon" />
            <span className="ls-genre-item-name">Todos los géneros</span>
            {currentGenre === '' && <PiCheckBold className="ls-genre-item-check" />}
          </button>
        )}

        {filteredGenres.map((genre) => {
          const isSelected = currentGenre.toLowerCase() === genre.toLowerCase()
          return (
            <button
              key={genre}
              type="button"
              className={`ls-genre-popover-item ${isSelected ? 'is-selected' : ''}`}
              onClick={() => {
                onSelectGenre(isSelected ? '' : genre)
                setSearchQuery('')
                onClose()
              }}
            >
              <PiTagBold className="ls-genre-item-icon" />
              <span className="ls-genre-item-name">{genre}</span>
              {isSelected && <PiCheckBold className="ls-genre-item-check" />}
            </button>
          )
        })}

        {!showAllOption && filteredGenres.length === 0 && (
          <div style={{ padding: '12px 8px', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            No se encontraron géneros que coincidan
          </div>
        )}
      </div>
    </div>
  )
}
