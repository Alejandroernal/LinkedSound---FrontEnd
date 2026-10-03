import { useState } from 'react'
import {
  PiFunnelBold,
  PiTagBold,
  PiCheckBold,
  PiBroomBold,
  PiMagnifyingGlassBold,
  PiXBold,
} from 'react-icons/pi'

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
  'Acoustic',
  'Experimental',
]

export default function GenreFilterPopover({
  isOpen,
  onClose,
  currentGenre,
  onSelectGenre,
}: GenreFilterPopoverProps) {
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const query = searchQuery.trim().toLowerCase()
  const filteredGenres = ALL_GENRES.filter((g) => g.toLowerCase().includes(query))

  return (
    <div className="ls-genre-inline-panel">
      {/* Header Fila Superior */}
      <div className="ls-genre-inline-header">
        <div className="ls-genre-inline-title-group">
          <div className="ls-genre-inline-icon">
            <PiFunnelBold />
          </div>
          <div>
            <h4 className="ls-genre-inline-title">Filtrar por Género Musical</h4>
            <p className="ls-genre-inline-subtitle">
              Selecciona cualquier género para filtrar publicaciones en tiempo real
            </p>
          </div>
        </div>

        <div className="ls-genre-inline-actions">
          {/* Campo de Búsqueda de Géneros */}
          <div className="ls-genre-search-wrap">
            <PiMagnifyingGlassBold className="ls-genre-search-icon" />
            <input
              type="text"
              placeholder="Buscar género..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ls-genre-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="ls-genre-search-clear"
                onClick={() => setSearchQuery('')}
                title="Limpiar búsqueda de género"
              >
                ✕
              </button>
            )}
          </div>

          {currentGenre && (
            <button
              type="button"
              className="ls-genre-inline-clear-btn"
              onClick={() => {
                onSelectGenre('')
                setSearchQuery('')
              }}
              title="Limpiar género seleccionado"
            >
              <PiBroomBold /> Limpiar
            </button>
          )}

          <button
            type="button"
            className="ls-genre-inline-close-btn"
            onClick={onClose}
            title="Cerrar panel de géneros"
          >
            <PiXBold />
          </button>
        </div>
      </div>

      {/* Grid fluid de Chips de Género */}
      <div className="ls-genre-inline-chips">
        <button
          type="button"
          className={`ls-genre-chip-item ${currentGenre === '' ? 'is-active' : ''}`}
          onClick={() => {
            onSelectGenre('')
          }}
        >
          <span>Todos los géneros</span>
          {currentGenre === '' && <PiCheckBold className="ls-genre-chip-check" />}
        </button>

        {filteredGenres.map((genre) => {
          const isSelected = currentGenre.toLowerCase() === genre.toLowerCase()
          return (
            <button
              key={genre}
              type="button"
              className={`ls-genre-chip-item ${isSelected ? 'is-active' : ''}`}
              onClick={() => {
                onSelectGenre(isSelected ? '' : genre)
              }}
            >
              <PiTagBold className="ls-genre-chip-tag-icon" />
              <span>{genre}</span>
              {isSelected && <PiCheckBold className="ls-genre-chip-check" />}
            </button>
          )
        })}

        {filteredGenres.length === 0 && (
          <div className="ls-genre-inline-no-results">
            No se encontraron géneros musicales que coincidan con "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  )
}


