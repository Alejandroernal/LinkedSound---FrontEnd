import { useEffect } from 'react'
import { PiXBold, PiChatTeardropTextBold, PiBriefcaseBold } from 'react-icons/pi'
import { FaSpotify } from 'react-icons/fa6'
import { ImLink } from 'react-icons/im'
import type { ProfileCard } from '../data/mockData'

type MatchModalProps = {
  isOpen: boolean
  matchedCard: ProfileCard | null
  userProfileImage?: string
  onClose: () => void
  onOpenChat: (card: ProfileCard) => void
}

export default function MatchModal({
  isOpen,
  matchedCard,
  userProfileImage,
  onClose,
  onOpenChat,
}: MatchModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !matchedCard) return null

  const cardName = matchedCard.nickname || ('firstName' in matchedCard ? matchedCard.firstName : '') || 'Artista'
  const isProfile = matchedCard.isProfile !== false
  const cardRole = matchedCard.role || (isProfile ? 'Creador Musical' : 'Evento Musical')
  const defaultUserImg = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
  const myImage = userProfileImage || defaultUserImg
  const targetImage = matchedCard.profileImage || defaultUserImg

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div
        className="ls-modal-content ls-match-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="ls-modal-close"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <PiXBold />
        </button>

        <div className="ls-match-modal-header">
          <div className="ls-match-sparkle-badge">
            <PiBriefcaseBold /> CONEXIÓN PROFESIONAL
          </div>
          <h2>¡NUEVO MATCH PROFESIONAL!</h2>
          <p>
            Tú y <strong>{cardName}</strong> coinciden en perfil profesional y afinidad para colaborar en proyectos musicales.
          </p>
        </div>

        {/* Visual Dual Avatar Match Display */}
        <div className="ls-match-avatars-row">
          <div className="ls-match-avatar-box">
            <img src={myImage} alt="Tu Perfil" />
            <span className="ls-match-avatar-label">Tú</span>
          </div>

          <div className="ls-match-music-pulse" title="Conexión Profesional">
            <ImLink />
          </div>

          <div className="ls-match-avatar-box">
            <img src={targetImage} alt={cardName} />
            <span className="ls-match-avatar-label">{cardName}</span>
          </div>
        </div>

        {/* Card Metadata info */}
        <div className="ls-match-info-card">
          <h4>{cardName}</h4>
          <p>{cardRole} • {matchedCard.location || 'LinkedSound Network'}</p>
          <span className="ls-match-percent-tag">{matchedCard.match || '95%'} Afinidad laboral</span>
          {((matchedCard.commonArtists && matchedCard.commonArtists.length > 0) || (matchedCard.commonGenres && matchedCard.commonGenres.length > 0)) && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              {matchedCard.commonArtists && matchedCard.commonArtists.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#1DB954', marginBottom: '4px' }}>
                  <FaSpotify /> Artistas en común: <strong>{matchedCard.commonArtists.slice(0, 3).join(', ')}</strong>
                </div>
              )}
              {matchedCard.commonGenres && matchedCard.commonGenres.length > 0 && (
                <div style={{ color: '#a855f7' }}>
                  Géneros compartidos: <strong>{matchedCard.commonGenres.slice(0, 3).join(', ')}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="ls-match-modal-actions">
          <button
            type="button"
            className="ls-primary-button ls-match-btn-chat"
            onClick={() => onOpenChat(matchedCard)}
          >
            <PiChatTeardropTextBold /> Iniciar Conversación
          </button>
          <button
            type="button"
            className="ls-secondary-button"
            onClick={onClose}
          >
            Continuar Explorando
          </button>
        </div>
      </div>
    </div>
  )
}

