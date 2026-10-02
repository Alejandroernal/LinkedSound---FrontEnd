import { useEffect, useState } from 'react'
import { PiFunnelBold, PiXBold, PiTagBold, PiCheckBold, PiBroomBold } from 'react-icons/pi'

type GenreFilterModalProps = {
  isOpen: boolean
  onClose: () => void
  currentGenre: string
  onApplyGenre: (genre: string) => void
}

const AVAILABLE_GENRES = [
  'Tech House',
  'Techno',
  'Synthwave',
  'Cyberpunk',
  'Ambient',
  'HardTrap',
  'Vocal',
  'Live',
  'ModularSynth',
  'Minimal',
  'Darkwave',
  'Alt Pop',
  'Electronic',
  'Lo-Fi',
  'Drone',
  'Industrial',
  'EBM',
]

export default function GenreFilterModal({
  isOpen,
  onClose,
  currentGenre,
  onApplyGenre,
}: GenreFilterModalProps) {
  const [selectedGenre, setSelectedGenre] = useState(currentGenre)

  useEffect(() => {
    setSelectedGenre(currentGenre)
  }, [currentGenre, isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (genre: string) => {
    if (selectedGenre.toLowerCase() === genre.toLowerCase()) {
      setSelectedGenre('')
    } else {
      setSelectedGenre(genre)
    }
  }

  const handleApply = () => {
    onApplyGenre(selectedGenre)
    onClose()
  }

  const handleClear = () => {
    setSelectedGenre('')
    onApplyGenre('')
    onClose()
  }

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div className="ls-modal-content ls-genre-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ls-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="ls-explore-icon-badge" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>
              <PiFunnelBold />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>Filtrar por Género Musical</h3>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Selecciona la categoría o estilo de sonido que deseas explorar
              </span>
            </div>
          </div>
          <button type="button" className="ls-modal-close" onClick={onClose} title="Cerrar modal">
            <PiXBold />
          </button>
        </div>

        <div className="ls-modal-body" style={{ padding: '20px 0' }}>
          <div className="ls-genre-modal-grid">
            {AVAILABLE_GENRES.map((genre) => {
              const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase()
              return (
                <button
                  key={genre}
                  type="button"
                  className={`ls-genre-modal-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(genre)}
                >
                  <PiTagBold style={{ fontSize: '1rem' }} />
                  <span>{genre}</span>
                  {isSelected && <PiCheckBold className="ls-genre-check-icon" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="ls-modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <button
            type="button"
            className="ls-secondary-button"
            onClick={handleClear}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PiBroomBold /> Limpiar Filtro
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="ls-secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="ls-primary-button" onClick={handleApply}>
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
